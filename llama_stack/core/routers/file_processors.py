# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the terms described in the LICENSE file in
# the root directory of this source tree.

from typing import Annotated

from fastapi import File, UploadFile

from llama_stack.apis.file_processors import (
    FileProcessors,
    ProcessFileResponse,
    ProcessFileUploadResponse,
)
from llama_stack.log import get_logger
from llama_stack.providers.datatypes import RoutingTable

logger = get_logger(name=__name__, category="core::routers")


class FileProcessorsRouter(FileProcessors):
    """Router for the FileProcessors API.

    This is a simple passthrough router since FileProcessors is a single-provider API.
    """

    def __init__(self, routing_table: RoutingTable) -> None:
        logger.debug("Initializing FileProcessorsRouter")
        self.routing_table = routing_table

    async def initialize(self) -> None:
        logger.debug("FileProcessorsRouter.initialize")
        pass

    async def shutdown(self) -> None:
        logger.debug("FileProcessorsRouter.shutdown")
        pass

    async def process_file(self, file_id: str) -> ProcessFileResponse:
        """Process a file by ID to markdown.

        Args:
            file_id: The ID of the file to process (from Files API)

        Returns:
            ProcessFileResponse with markdown content and optional chunks
        """
        logger.debug(f"FileProcessorsRouter.process_file: {file_id}")
        # Get the provider implementation and delegate to it
        provider = await self.routing_table.get_provider_impl()
        return await provider.process_file(file_id)

    async def process_file_upload(
        self, file: Annotated[UploadFile, File()]
    ) -> ProcessFileUploadResponse:
        """Process an uploaded file to markdown.

        Args:
            file: The uploaded file

        Returns:
            ProcessFileUploadResponse with markdown content and optional chunks
        """
        logger.debug(f"FileProcessorsRouter.process_file_upload: {file.filename if file else 'unknown'}")
        # Get the provider implementation and delegate to it
        provider = await self.routing_table.get_provider_impl()
        return await provider.process_file_upload(file)
