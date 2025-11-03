# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the terms described in the LICENSE file in
# the root directory of this source tree.

import os
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import File, UploadFile

try:
    from docling.document_converter import DocumentConverter
    from docling.chunking import HybridChunker
    from docling_core.transforms.chunker import BaseChunker
except ImportError:
    raise ImportError(
        "docling is required for the docling file processor provider. "
        "Install it with: pip install docling"
    )

from llama_stack.apis.common.errors import ResourceNotFoundError
from llama_stack.apis.file_processors import (
    FileProcessors,
    ProcessFileResponse,
    ProcessFileUploadResponse,
)
from llama_stack.apis.files import Files
from llama_stack.core.datatypes import Api
from llama_stack.log import get_logger

from .config import DoclingFileProcessorConfig

logger = get_logger(name=__name__, category="file_processors")


class DoclingFileProcessorImpl(FileProcessors):
    """Implementation of FileProcessors using docling for document to markdown conversion."""

    def __init__(self, config: DoclingFileProcessorConfig, deps: dict[Api, any]) -> None:
        self.config = config
        self.files_api: Files | None = deps.get(Api.files)
        self.converter: DocumentConverter | None = None

    def _ensure_tokenizer_available(self, tokenizer_name: str) -> BaseChunker:
        """
        Ensure the tokenizer is available, downloading it if necessary.

        Args:
            tokenizer_name: Name of the tokenizer (e.g., "Llama3Tokenizer")

        Returns:
            Initialized BaseChunker instance with the tokenizer
        """
        try:
            # Try to initialize the chunker with the specified tokenizer
            logger.info(f"Initializing HybridChunker with {tokenizer_name}...")
            chunker = HybridChunker(
                tokenizer=tokenizer_name,
                max_tokens=self.config.max_tokens,
            )
            logger.info(f"Successfully initialized {tokenizer_name}")
            return chunker
        except Exception as e:
            # Check if it's a tokenizer not found error
            error_msg = str(e).lower()
            if "tokenizer" in error_msg or "not found" in error_msg or "download" in error_msg or "modulenotfounderror" in error_msg:
                logger.info(f"Tokenizer {tokenizer_name} not found locally, attempting to download...")

                # Try to download the tokenizer using transformers library
                try:
                    from transformers import AutoTokenizer

                    # Map docling tokenizer names to HuggingFace model names
                    tokenizer_map = {
                        "Llama3Tokenizer": "meta-llama/Meta-Llama-3-8B",
                        "Llama2Tokenizer": "meta-llama/Llama-2-7b-hf",
                        "GPT2Tokenizer": "gpt2",
                    }

                    hf_model_name = tokenizer_map.get(tokenizer_name, tokenizer_name)

                    logger.info(f"Downloading tokenizer from HuggingFace: {hf_model_name}")

                    # For Llama models, provide helpful message about license
                    if "llama" in hf_model_name.lower():
                        logger.info(
                            "Note: For Llama models, you may need to:\n"
                            "  1. Accept the license on HuggingFace (https://huggingface.co/meta-llama)\n"
                            "  2. Set HF_TOKEN environment variable with your HuggingFace token\n"
                            "  3. Or use a different tokenizer like 'GPT2Tokenizer' in config"
                        )

                    # Try to download with token if available
                    import os
                    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")

                    # Download and cache the tokenizer
                    AutoTokenizer.from_pretrained(
                        hf_model_name,
                        trust_remote_code=True,
                        token=hf_token,
                    )

                    logger.info(f"Successfully downloaded {tokenizer_name}")

                    # Try initializing the chunker again
                    chunker = HybridChunker(
                        tokenizer=tokenizer_name,
                        max_tokens=self.config.max_tokens,
                    )
                    return chunker

                except ImportError:
                    logger.warning(
                        "transformers library not found. Install with: pip install transformers"
                    )
                    # Try to fall back to a simpler tokenizer
                    logger.info("Attempting to fall back to GPT2Tokenizer...")
                    try:
                        chunker = HybridChunker(
                            tokenizer="GPT2Tokenizer",
                            max_tokens=self.config.max_tokens,
                        )
                        logger.info("Successfully fell back to GPT2Tokenizer")
                        return chunker
                    except Exception:
                        raise RuntimeError(
                            f"Failed to initialize any tokenizer. "
                            "Install transformers library: pip install transformers"
                        )
                except Exception as download_error:
                    logger.warning(f"Failed to download tokenizer {tokenizer_name}: {download_error}")

                    # Try to fall back to GPT2Tokenizer which doesn't require license
                    logger.info("Attempting to fall back to GPT2Tokenizer...")
                    try:
                        from transformers import AutoTokenizer
                        AutoTokenizer.from_pretrained("gpt2", trust_remote_code=True)
                        chunker = HybridChunker(
                            tokenizer="GPT2Tokenizer",
                            max_tokens=self.config.max_tokens,
                        )
                        logger.info("Successfully fell back to GPT2Tokenizer")
                        return chunker
                    except Exception as fallback_error:
                        logger.error(f"Fallback to GPT2Tokenizer also failed: {fallback_error}")
                        raise RuntimeError(
                            f"Failed to initialize tokenizer {tokenizer_name}. "
                            f"Error: {download_error}. "
                            f"Fallback to GPT2Tokenizer also failed: {fallback_error}"
                        )
            else:
                # Re-raise if it's a different error
                logger.error(f"Error initializing HybridChunker: {e}")
                raise

    async def initialize(self) -> None:
        """Initialize the file processor provider."""
        # Initialize the DocumentConverter
        self.converter = DocumentConverter()

        # Initialize the HybridChunker if chunking is enabled
        if self.config.enable_hybrid_chunking:
            try:
                self.chunker = self._ensure_tokenizer_available(self.config.tokenizer)
                logger.info(
                    f"Docling file processor initialized with hybrid chunking "
                    f"(tokenizer={self.config.tokenizer}, max_tokens={self.config.max_tokens})"
                )
            except Exception as e:
                logger.warning(
                    f"Failed to initialize hybrid chunking: {e}. "
                    "Hybrid chunking will be disabled."
                )
                self.chunker = None
        else:
            self.chunker = None
            logger.info("Docling file processor initialized without chunking")

    async def shutdown(self) -> None:
        """Shutdown the file processor provider."""
        pass

    def _extract_text_from_document(self, doc_bytes: bytes, filename: str) -> tuple[str, list[str] | None]:
        """
        Extract text from document bytes and convert to markdown using docling.

        Args:
            doc_bytes: Document file content as bytes
            filename: The name of the file for proper handling

        Returns:
            Tuple of (markdown_content, chunks) where chunks is None if chunking is disabled
        """
        if not self.converter:
            raise RuntimeError("Docling converter not initialized")

        # Create a temporary file to write the bytes
        # Docling requires a file path, not a file-like object
        temp_fd = None
        temp_path = None

        try:
            # Get file extension from filename
            _, ext = os.path.splitext(filename)
            if not ext:
                ext = ".pdf"  # Default to PDF if no extension

            # Create a temporary file with the correct extension
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext)

            # Write bytes to temporary file
            with os.fdopen(temp_fd, 'wb') as f:
                f.write(doc_bytes)
                temp_fd = None  # Mark as closed

            # Convert document to markdown using the file path
            # Docling supports PDF, DOCX, PPTX, HTML, images, and more
            result = self.converter.convert(Path(temp_path))

            # Export to markdown
            markdown_content = result.document.export_to_markdown()

            # Generate chunks if chunking is enabled
            chunks = None
            if self.chunker:
                try:
                    # Use docling's HybridChunker for semantic chunking
                    chunk_iter = self.chunker.chunk(dl_doc=result.document)
                    # Extract text from each chunk
                    chunks = [chunk.text for chunk in chunk_iter]
                    logger.info(f"Generated {len(chunks)} hybrid chunks for document {filename}")
                except Exception as e:
                    logger.warning(f"Failed to generate hybrid chunks: {e}, will use full markdown")
                    chunks = None

            return markdown_content.strip(), chunks
        except Exception as e:
            logger.error(f"Error extracting text from document: {e}")
            raise ValueError(f"Failed to process document: {str(e)}")
        finally:
            # Clean up: close file descriptor if still open and remove temp file
            if temp_fd is not None:
                try:
                    os.close(temp_fd)
                except OSError:
                    pass

            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except OSError as e:
                    logger.warning(f"Failed to remove temporary file {temp_path}: {e}")

    async def process_file(self, file_id: str) -> ProcessFileResponse:
        """
        Process a file by ID to markdown.

        Args:
            file_id: The ID of the file to process (from Files API)

        Returns:
            ProcessFileResponse with markdown content and optional chunks
        """
        if not self.files_api:
            raise RuntimeError(
                "Files API dependency not available. "
                "FileProcessors provider requires Files API to be configured."
            )

        try:
            # Retrieve file metadata to get filename
            file_obj = await self.files_api.openai_retrieve_file(file_id)

            # Retrieve file content from Files API
            file_response = await self.files_api.openai_retrieve_file_content(file_id)
            file_bytes = file_response.body

            # Extract text and convert to markdown (with optional chunking)
            markdown_content, chunks = self._extract_text_from_document(file_bytes, file_obj.filename)

            return ProcessFileResponse(
                content=markdown_content,
                file_id=file_id,
                chunks=chunks,
            )
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error processing file {file_id}: {e}")
            raise ValueError(f"Failed to process file: {str(e)}")

    async def process_file_upload(
        self, file: Annotated[UploadFile, File()]
    ) -> ProcessFileUploadResponse:
        """
        Process an uploaded file to markdown.

        Args:
            file: The uploaded file

        Returns:
            ProcessFileUploadResponse with markdown content and optional chunks
        """
        try:
            # Read file content
            file_bytes = await file.read()
            filename = file.filename or "uploaded_file"

            # Extract text and convert to markdown (with optional chunking)
            markdown_content, chunks = self._extract_text_from_document(file_bytes, filename)

            return ProcessFileUploadResponse(
                content=markdown_content,
                filename=filename,
                chunks=chunks,
            )
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error processing uploaded file: {e}")
            raise ValueError(f"Failed to process uploaded file: {str(e)}")
