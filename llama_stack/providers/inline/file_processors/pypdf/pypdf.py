# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the terms described in the LICENSE file in
# the root directory of this source tree.

import io
from typing import Annotated

from fastapi import File, UploadFile

try:
    from pypdf import PdfReader
except ImportError:
    raise ImportError(
        "pypdf is required for the pypdf file processor provider. "
        "Install it with: pip install pypdf"
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

from .config import PyPDFFileProcessorConfig

logger = get_logger(name=__name__, category="file_processors")


class PyPDFFileProcessorImpl(FileProcessors):
    """Implementation of FileProcessors using pypdf for PDF to markdown conversion."""

    def __init__(self, config: PyPDFFileProcessorConfig, deps: dict[Api, any]) -> None:
        self.config = config
        self.files_api: Files | None = deps.get(Api.files)

    async def initialize(self) -> None:
        """Initialize the file processor provider."""
        pass

    async def shutdown(self) -> None:
        """Shutdown the file processor provider."""
        pass

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF bytes and convert to markdown.

        Args:
            pdf_bytes: PDF file content as bytes

        Returns:
            Extracted text formatted as markdown
        """
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))

            # Extract text from all pages
            text_parts = []
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text()
                if text.strip():
                    # Add page header for multi-page documents
                    if len(reader.pages) > 1:
                        text_parts.append(f"## Page {page_num}\n\n{text}\n")
                    else:
                        text_parts.append(text)

            markdown_content = "\n".join(text_parts)

            # Basic cleanup - remove excessive newlines
            while "\n\n\n" in markdown_content:
                markdown_content = markdown_content.replace("\n\n\n", "\n\n")

            return markdown_content.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise ValueError(f"Failed to process PDF: {str(e)}")

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
            # Retrieve file content from Files API
            file_response = await self.files_api.openai_retrieve_file_content(file_id)
            file_bytes = file_response.body

            # Extract text and convert to markdown
            markdown_content = self._extract_text_from_pdf(file_bytes)

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

            # Validate it's a PDF
            filename = file.filename or "unknown"
            if not filename.lower().endswith(".pdf"):
                raise ValueError(
                    f"Only PDF files are supported. Got file: {filename}"
                )

            # Extract text and convert to markdown
            markdown_content = self._extract_text_from_pdf(file_bytes)

            return ProcessFileUploadResponse(
                content=markdown_content,
                filename=filename,
            )
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error processing uploaded file: {e}")
            raise ValueError(f"Failed to process uploaded file: {str(e)}")
