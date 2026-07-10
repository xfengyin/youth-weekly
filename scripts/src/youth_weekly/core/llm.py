#!/usr/bin/env python3
"""
LLM 抽象层 - 支持多模型/多厂商无缝替换

按依赖倒置原则设计:
- ContentExpander 只依赖 LLMProvider 接口
- 具体实现(OpenAI/Anthropic/其他)通过工厂注入
- 所有配置从 config.yaml / 环境变量读取,零代码切换模型
"""

from __future__ import annotations

import logging
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import requests

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LLMResponse:
    """LLM 响应对象"""

    text: str
    model: str = ""
    usage: dict[str, int] | None = None
    latency_ms: float = 0.0


class LLMProvider(ABC):
    """LLM 提供者抽象接口"""

    @abstractmethod
    def chat(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        """执行一次对话补全"""
        raise NotImplementedError

    @abstractmethod
    def is_available(self) -> bool:
        """检查当前 provider 是否可用(密钥/配置是否完整)"""
        raise NotImplementedError


class OpenAICompatibleProvider(LLMProvider):
    """
    OpenAI 兼容接口提供者

    适用于 OpenAI、DeepSeek、Moonshot、Azure OpenAI、本地 vLLM 等
    任意兼容 /chat/completions 的端点。
    """

    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str = "https://api.openai.com/v1",
        timeout: int = 60,
        max_retries: int = 3,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
        )

    def is_available(self) -> bool:
        return bool(self.api_key and self.model)

    def chat(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        """调用 OpenAI 兼容 /chat/completions"""
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
        url = f"{self.base_url}/chat/completions"

        start = time.perf_counter()
        last_error: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                resp = self.session.post(url, json=payload, timeout=self.timeout)
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                usage = data.get("usage")
                latency = (time.perf_counter() - start) * 1000
                return LLMResponse(
                    text=text.strip(),
                    model=self.model,
                    usage=usage,
                    latency_ms=latency,
                )
            except requests.RequestException as exc:
                last_error = exc
                logger.warning(
                    "LLM request failed (attempt %d/%d): %s",
                    attempt + 1,
                    self.max_retries,
                    exc,
                )
                if attempt < self.max_retries - 1:
                    time.sleep(2**attempt)

        raise LLMError(
            f"OpenAI-compatible LLM call failed after {self.max_retries} retries"
        ) from last_error


class AnthropicProvider(LLMProvider):
    """Anthropic Claude API 提供者"""

    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-5-sonnet-20241022",
        timeout: int = 60,
        max_retries: int = 3,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.session = requests.Session()
        self.session.headers.update(
            {
                "x-api-key": api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
            }
        )

    def is_available(self) -> bool:
        return bool(self.api_key and self.model)

    def chat(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        """调用 Anthropic Messages API"""
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
        url = "https://api.anthropic.com/v1/messages"

        start = time.perf_counter()
        last_error: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                resp = self.session.post(url, json=payload, timeout=self.timeout)
                resp.raise_for_status()
                data = resp.json()
                text = data["content"][0]["text"]
                usage = data.get("usage")
                latency = (time.perf_counter() - start) * 1000
                return LLMResponse(
                    text=text.strip(),
                    model=self.model,
                    usage=usage,
                    latency_ms=latency,
                )
            except requests.RequestException as exc:
                last_error = exc
                logger.warning(
                    "Anthropic request failed (attempt %d/%d): %s",
                    attempt + 1,
                    self.max_retries,
                    exc,
                )
                if attempt < self.max_retries - 1:
                    time.sleep(2**attempt)

        raise LLMError(
            f"Anthropic LLM call failed after {self.max_retries} retries"
        ) from last_error


class LLMError(Exception):
    """LLM 调用异常"""


class LLMUnavailableError(Exception):
    """LLM 配置不完整或不可用"""


def create_llm_provider(config: dict[str, Any]) -> LLMProvider:
    """
    根据配置创建 LLM 提供者实例

    Args:
        config: 配置字典,包含 provider/api_key/model/base_url 等

    Returns:
        LLMProvider 实例

    Raises:
        LLMUnavailableError: 配置缺失时抛出
    """
    provider = config.get("provider", "openai").lower()
    api_key = config.get("api_key", "")
    # 允许通过环境变量覆盖(安全合规,避免密钥入代码)
    env_key_name = config.get("api_key_env", "")
    if env_key_name:
        api_key = os.environ.get(env_key_name, api_key)
    if not api_key:
        api_key = os.environ.get("YOUTH_WEEKLY_LLM_API_KEY", "")

    model = config.get("model", "")
    timeout = int(config.get("timeout", 60))
    max_retries = int(config.get("max_retries", 3))
    temperature = float(config.get("temperature", 0.7))
    max_tokens = int(config.get("max_tokens", 2048))

    if not api_key or not model:
        raise LLMUnavailableError(
            "LLM api_key or model not configured. "
            "Set YOUTH_WEEKLY_LLM_API_KEY or config.yaml llm.api_key"
        )

    common_kwargs = {
        "api_key": api_key,
        "model": model,
        "timeout": timeout,
        "max_retries": max_retries,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if provider in ("openai", "openai_compatible"):
        return OpenAICompatibleProvider(
            base_url=config.get("base_url", "https://api.openai.com/v1"),
            **common_kwargs,
        )
    if provider == "anthropic":
        return AnthropicProvider(**common_kwargs)

    raise LLMUnavailableError(f"Unsupported LLM provider: {provider}")


__all__ = [
    "LLMProvider",
    "LLMResponse",
    "OpenAICompatibleProvider",
    "AnthropicProvider",
    "LLMError",
    "LLMUnavailableError",
    "create_llm_provider",
]
