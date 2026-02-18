"""Centralized configuration loaded from environment variables.

All timeout / retry / logging settings live here so they can be read once
and imported by any module that needs them.
"""

import os
import logging

logger = logging.getLogger(__name__)


def _env_int(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        logger.warning("Invalid integer for %s=%r, using default %d", key, raw, default)
        return default


# ── Logging ──────────────────────────────────────────────────────────────────
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

# ── LLM (OpenAI-compatible) ─────────────────────────────────────────────────
LLM_TIMEOUT: int = _env_int("LLM_TIMEOUT_SECONDS", 60)
LLM_MAX_RETRIES: int = _env_int("LLM_MAX_RETRIES", 5)

# ── External API calls (Perplexity, etc.) ────────────────────────────────────
API_TIMEOUT: int = _env_int("API_TIMEOUT_SECONDS", 60)
API_MAX_RETRIES: int = _env_int("API_MAX_RETRIES", 5)

# ── LangGraph recursion limit ────────────────────────────────────────────────
# The ReAct agents loop between LLM → tool calls; each round is 2 steps.
# Default 25 is too low when the model makes many search calls.
RECURSION_LIMIT: int = _env_int("RECURSION_LIMIT", 100)
