import argparse
import asyncio
import logging
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from app.agents.graph import decision_graph

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool) -> None:
    """Configure logging based on verbosity flag."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stderr,
    )
    # Quiet down noisy libraries unless in debug mode
    if not verbose:
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("openai").setLevel(logging.WARNING)
        logging.getLogger("langchain").setLevel(logging.WARNING)


def dump_state(state: dict) -> None:
    """Log the full final state for debugging."""
    logger.info("========== FINAL STATE DUMP ==========")
    for key, value in state.items():
        if isinstance(value, str):
            logger.info("  state[%r]: str, %d chars", key, len(value))
            logger.debug("  state[%r] preview: %s...", key, value[:300])
        elif isinstance(value, list):
            logger.info("  state[%r]: list, %d items", key, len(value))
            for i, item in enumerate(value):
                if hasattr(item, "model_dump"):
                    logger.debug("  state[%r][%d]: %s", key, i, item.model_dump())
                else:
                    logger.debug("  state[%r][%d]: %s", key, i, str(item)[:200])
        else:
            logger.info("  state[%r]: %s = %s", key, type(value).__name__, str(value)[:200])
    logger.info("========== END STATE DUMP ==========")


async def run(ticker: str, output: str | None, verbose: bool) -> None:
    setup_logging(verbose)

    logger.info("Starting pipeline for ticker: %s", ticker)

    result = await decision_graph.ainvoke({
        "user_message": f"Analyze {ticker} stock",
    })

    dump_state(result)

    report = result.get("report", "")
    if not report:
        logger.error("Pipeline produced an empty report!")
        logger.error("State keys present: %s", list(result.keys()))
        for key, value in result.items():
            if isinstance(value, str):
                logger.error("  %s (%d chars): %s...", key, len(value), value[:200])
        sys.exit(1)

    if output is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = f"{ticker}_{timestamp}_report.md"

    Path(output).write_text(report, encoding="utf-8")
    logger.info("Report saved to %s (%d chars)", output, len(report))


def main():
    parser = argparse.ArgumentParser(description="Run the stock analysis pipeline")
    parser.add_argument("ticker", help="Stock ticker symbol (e.g. AAPL, MSFT, TSLA)")
    parser.add_argument("-o", "--output", default=None, help="Output file path (default: <TICKER>_<timestamp>_report.md)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable DEBUG-level logging for all agents")
    args = parser.parse_args()

    asyncio.run(run(args.ticker.upper(), args.output, args.verbose))


if __name__ == "__main__":
    main()
