"""Shared event queue for streaming status updates from graph nodes to the SSE endpoint."""

import asyncio
import re
from contextvars import ContextVar

status_queue_var: ContextVar[asyncio.Queue | None] = ContextVar(
    "status_queue", default=None
)


async def emit_status(event: dict):
    """Push a status update to the SSE event queue if one is active."""
    queue = status_queue_var.get(None)
    if queue is not None:
        await queue.put(event)


def strip_tool_calls(text: str) -> str:
    """Remove <tool_call>…</tool_call> artifacts that some models hallucinate.

    Only *deletes* the block when the content looks like a JSON tool-call
    object (``{"name": …}``).  If the model merely wrapped real prose inside
    the tags the content is kept and only the tag markup is removed.
    """
    if not text:
        return text or ""

    def _replace(match: re.Match) -> str:
        inner = match.group(1).strip()
        if inner.startswith("{") and '"name"' in inner:
            return ""
        return inner

    text = re.sub(r"<tool_call>(.*?)</tool_call>", _replace, text, flags=re.DOTALL)
    text = re.sub(r"</?tool_call>", "", text)
    return text.strip()


def strip_citation_markers(text: str) -> str:
    """Remove Perplexity-style citation markers like [1], [2], [1][3], etc."""
    if not text:
        return text or ""
    return re.sub(r"\[(\d+)\]", "", text).strip()
