# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the terms described in the LICENSE file in
# the root directory of this source tree.

from typing import Any

from pydantic import BaseModel


class DoclingFileProcessorConfig(BaseModel):
    """Configuration for the Docling file processor provider.

    :param enable_hybrid_chunking: Enable docling's hybrid chunking for better semantic chunks (default: True)
    :param tokenizer: Tokenizer to use for hybrid chunking (default: "Llama3Tokenizer")
    :param max_tokens: Maximum tokens per chunk (default: 800)
    """

    enable_hybrid_chunking: bool = True
    tokenizer: str = "Llama3Tokenizer"
    max_tokens: int = 800

    @classmethod
    def sample_run_config(cls, __distro_dir__: str) -> dict[str, Any]:
        return {
            "enable_hybrid_chunking": True,
            "tokenizer": "Llama3Tokenizer",
            "max_tokens": 800,
        }
