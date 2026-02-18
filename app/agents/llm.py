import os
import logging
from typing import Optional

from langchain_openai import ChatOpenAI

from app.config import LLM_TIMEOUT, LLM_MAX_RETRIES

logger = logging.getLogger(__name__)


def create_llm(temperature: float = 0.0, max_tokens: Optional[int] = None) -> ChatOpenAI:
    """Create a LangChain ChatOpenAI client with custom endpoint.

    Timeout and retry behaviour are controlled by the env vars
    ``LLM_TIMEOUT_SECONDS`` (default 60) and ``LLM_MAX_RETRIES`` (default 5).
    """
    base_url = os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("OPENAI_MODEL_NAME", "sonar")

    logger.info(
        "Env vars loaded: OPENAI_BASE_URL=%s, OPENAI_API_KEY=%s, OPENAI_MODEL_NAME=%s",
        base_url,
        "***" if api_key else None,
        model_name,
    )

    if not base_url:
        raise ValueError("OPENAI_BASE_URL environment variable is required")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")

    logger.info(
        "Creating LLM: model=%s, base_url=%s, temperature=%s, timeout=%ds, max_retries=%d, max_tokens=%s",
        model_name, base_url, temperature, LLM_TIMEOUT, LLM_MAX_RETRIES, max_tokens,
    )

    kwargs = dict(
        base_url=base_url,
        api_key=api_key,
        model=model_name,
        temperature=temperature,
        timeout=LLM_TIMEOUT,
        max_retries=LLM_MAX_RETRIES,
    )
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens

    return ChatOpenAI(**kwargs)
