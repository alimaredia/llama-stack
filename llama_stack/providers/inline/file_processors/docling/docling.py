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

    async def initialize(self) -> None:
        """Initialize the file processor provider."""
        # Initialize the DocumentConverter
        self.converter = DocumentConverter()
        logger.info("Docling file processor initialized")

    async def shutdown(self) -> None:
        """Shutdown the file processor provider."""
        pass

    def _extract_text_from_document(self, doc_bytes: bytes, filename: str) -> str:
        """
        Extract text from document bytes and convert to markdown using docling.

        Args:
            doc_bytes: Document file content as bytes
            filename: The name of the file for proper handling

        Returns:
            Extracted text formatted as markdown
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

            return markdown_content.strip()
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
            ProcessFileResponse with markdown content
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

            # Extract text and convert to markdown
            markdown_content = self._extract_text_from_document(file_bytes, file_obj.filename)

            return ProcessFileResponse(
                content=markdown_content,
                file_id=file_id,
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
            ProcessFileUploadResponse with markdown content
        """
        try:
            # Read file content
            file_bytes = await file.read()
            filename = file.filename or "uploaded_file"

            # Extract text and convert to markdown
            markdown_content = self._extract_text_from_document(file_bytes, filename)

            return ProcessFileUploadResponse(
                content=markdown_content,
                filename=filename,
            )
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error processing uploaded file: {e}")
            raise ValueError(f"Failed to process uploaded file: {str(e)}")
