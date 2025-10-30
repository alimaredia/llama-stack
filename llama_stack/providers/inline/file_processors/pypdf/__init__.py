# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the terms described in the LICENSE file in
# the root directory of this source tree.

from typing import Any

from llama_stack.core.datatypes import Api

from .config import PyPDFFileProcessorConfig
from .pypdf import PyPDFFileProcessorImpl

__all__ = ["PyPDFFileProcessorImpl", "PyPDFFileProcessorConfig"]


async def get_provider_impl(config: PyPDFFileProcessorConfig, deps: dict[Api, Any]):
    impl = PyPDFFileProcessorImpl(config, deps)
    await impl.initialize()
    return impl
