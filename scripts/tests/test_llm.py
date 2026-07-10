#!/usr/bin/env python3
"""测试 LLM 抽象层"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from youth_weekly.core.llm import (
    AnthropicProvider,
    LLMError,
    LLMUnavailableError,
    OpenAICompatibleProvider,
    create_llm_provider,
)


class TestCreateLLMProvider:
    """测试工厂函数"""

    def test_openai_provider(self):
        config = {
            "provider": "openai",
            "api_key": "sk-test",
            "model": "gpt-4o-mini",
        }
        provider = create_llm_provider(config)
        assert isinstance(provider, OpenAICompatibleProvider)
        assert provider.model == "gpt-4o-mini"

    def test_anthropic_provider(self):
        config = {
            "provider": "anthropic",
            "api_key": "sk-test",
            "model": "claude-3-5-sonnet-20241022",
        }
        provider = create_llm_provider(config)
        assert isinstance(provider, AnthropicProvider)

    def test_api_key_from_env(self, monkeypatch):
        monkeypatch.setenv("YOUTH_WEEKLY_LLM_API_KEY", "env-key")
        config = {"provider": "openai", "model": "gpt-4o-mini"}
        provider = create_llm_provider(config)
        assert provider.is_available()

    def test_api_key_env_override(self, monkeypatch):
        monkeypatch.setenv("CUSTOM_KEY", "custom-value")
        config = {
            "provider": "openai",
            "api_key": "fallback",
            "api_key_env": "CUSTOM_KEY",
            "model": "gpt-4o-mini",
        }
        provider = create_llm_provider(config)
        assert provider.api_key == "custom-value"

    def test_missing_key_raises(self):
        config = {"provider": "openai", "model": "gpt-4o-mini"}
        with pytest.raises(LLMUnavailableError):
            create_llm_provider(config)

    def test_unsupported_provider_raises(self):
        config = {
            "provider": "unknown",
            "api_key": "sk-test",
            "model": "x",
        }
        with pytest.raises(LLMUnavailableError):
            create_llm_provider(config)


class TestOpenAICompatibleProvider:
    """测试 OpenAI 兼容提供者"""

    def test_chat_success(self):
        provider = OpenAICompatibleProvider(api_key="sk-test", model="gpt-4o-mini")
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "  hello  "}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5},
        }
        with patch.object(provider.session, "post", return_value=mock_resp):
            result = provider.chat("sys", "user")
        assert result.text == "hello"
        assert result.model == "gpt-4o-mini"
        assert result.usage["completion_tokens"] == 5

    def test_chat_retries_then_raises(self):
        provider = OpenAICompatibleProvider(
            api_key="sk-test", model="gpt-4o-mini", max_retries=2
        )
        with patch.object(provider.session, "post", side_effect=LLMError("network")):
            with pytest.raises(LLMError):
                provider.chat("sys", "user")


class TestAnthropicProvider:
    """测试 Anthropic 提供者"""

    def test_chat_success(self):
        provider = AnthropicProvider(
            api_key="sk-test", model="claude-3-5-sonnet-20241022"
        )
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {
            "content": [{"text": "  world  "}],
            "usage": {"input_tokens": 8, "output_tokens": 4},
        }
        with patch.object(provider.session, "post", return_value=mock_resp):
            result = provider.chat("sys", "user")
        assert result.text == "world"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
