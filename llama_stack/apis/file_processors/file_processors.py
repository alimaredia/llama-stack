# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the terms described in the LICENSE file in
# the root directory of this source tree.

from typing import Annotated, Literal, Protocol, runtime_checkable

from fastapi import File, UploadFile
from pydantic import BaseModel

from llama_stack.apis.version import LLAMA_STACK_API_V1
from llama_stack.providers.utils.telemetry.trace_protocol import trace_protocol
from llama_stack.schema_utils import json_schema_type, webmethod


@json_schema_type
class ProcessFileRequest(BaseModel):
    """
    Request for processing a file to markdown.

    :param file_id: The ID of a file previously uploaded via the Files API
    """

    file_id: str


@json_schema_type
class ProcessFileResponse(BaseModel):
    """
    Response containing the processed file content as markdown.

    :param content: The file content converted to markdown
    :param file_id: The ID of the processed file
    :param object: The object type, which is always "file_processor.result"
    """

    content: str
    file_id: str
    object: Literal["file_processor.result"] = "file_processor.result"


@json_schema_type
class ProcessFileUploadResponse(BaseModel):
    """
    Response containing the processed uploaded file content as markdown.

    :param content: The file content converted to markdown
    :param filename: The name of the processed file
    :param object: The object type, which is always "file_processor.result"
    """

    content: str
    filename: str
    object: Literal["file_processor.result"] = "file_processor.result"


@runtime_checkable
@trace_protocol
class FileProcessors(Protocol):
    """FileProcessors

    This API converts input files to markdown format. It can process files
    either by file ID (from the Files API) or by direct file upload.
    """

    @webmethod(route="/file-processors/process", method="POST", level=LLAMA_STACK_API_V1)
    async def process_file(
        self,
        file_id: str,
    ) -> ProcessFileResponse:
        """Process a file to markdown.

        Converts a previously uploaded file (via the Files API) to markdown format.

        :param file_id: The ID of the file to process
        :returns: A ProcessFileResponse containing the markdown content
        """
        ...

    @webmethod(route="/file-processors/process-upload", method="POST", level=LLAMA_STACK_API_V1)
    async def process_file_upload(
        self,
        file: Annotated[UploadFile, File()],
    ) -> ProcessFileUploadResponse:
        """Process an uploaded file to markdown.

        Converts an uploaded file directly to markdown format without requiring
        it to be stored via the Files API first.

        :param file: The uploaded file object containing content and metadata
        :returns: A ProcessFileUploadResponse containing the markdown content
        """
        ...
