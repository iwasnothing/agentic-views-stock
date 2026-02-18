# Agentic Decision Maker

AI-powered stock analysis platform that generates multi-perspective investment reports using a pipeline of LangGraph agents. Enter a ticker symbol and receive a comprehensive report synthesized from four distinct analyst personas — each with their own risk appetite, time horizon, and reasoning style.

## Architecture

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│  Frontend   │──────▶│  Backend    │──────▶│  LiteLLM   │──▶ OpenAI / Anthropic / …
│  Next.js    │ HTTP  │  FastAPI    │ HTTP  │  Proxy     │
│  :3000      │       │  :8000      │       │  :4000     │
└────────────┘       └────────────┘       └────────────┘
                            │
                            ├── yfinance (financial statements)
                            └── DuckDuckGo (qualitative search)
```

### Agent Pipeline

The backend runs a five-stage LangGraph workflow:

```
Planner → Stock Info → Persona Generator → Analysis → Report
```

| Stage | What it does |
|---|---|
| **Planner** | Extracts the user's intent and stock ticker from free-text input |
| **Stock Info** | Fetches financial statements via yfinance and runs DuckDuckGo searches for qualitative context |
| **Persona Generator** | Creates 4 analyst personas with distinct risk appetites, time horizons, and value orientations |
| **Analysis** | Each persona independently analyzes the stock's profitability, risks, moat, and growth drivers |
| **Report** | Synthesizes all perspectives into a structured Markdown investment report with a clear Buy/Hold/Sell recommendation |

### Frontend

A Next.js app that provides:

- Real-time SSE streaming of each pipeline stage as it completes
- Live "thinking process" visualization showing agent progress
- A structured report dashboard with executive summary, per-persona analysis, and financial data

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- An OpenAI API key (or any OpenAI-compatible provider key)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL_NAME=gpt-4
```

### 2. Start all services

```bash
docker compose up --build
```

This starts three containers:

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:3000 | Next.js UI |
| **Backend** | http://localhost:8000 | FastAPI API server |
| **LiteLLM Proxy** | http://localhost:4000 | OpenAI-compatible LLM gateway |

### 3. Use the app

Open http://localhost:3000, type a stock ticker (e.g. `AAPL`, `TSLA`, `MSFT`), and watch the analysis pipeline run in real time.

## Local Development (without Docker)

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file at the project root (see `.env.example`), then:

```bash
python -m app.app
```

The API will be available at http://localhost:8000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at http://localhost:3000. It expects the backend at `http://localhost:8000` by default (configured via `NEXT_PUBLIC_API_URL` in `frontend/.env.local`).

## Project Structure

```
.
├── app/                        # Python backend
│   ├── app.py                  # FastAPI entry point
│   ├── config.py               # Environment-based configuration
│   ├── events.py               # SSE event queue and text helpers
│   ├── api/
│   │   └── routes.py           # /api/analyze, /api/analyze/stream, /health
│   ├── agents/
│   │   ├── graph.py            # LangGraph workflow definition
│   │   ├── llm.py              # ChatOpenAI factory
│   │   ├── planner.py          # Intent + ticker extraction
│   │   ├── stock_info_agent.py # yfinance + DuckDuckGo data gathering
│   │   ├── persona_agent.py    # 4-persona generator
│   │   ├── analysis_agent.py   # Per-persona stock analysis
│   │   └── report_agent.py     # Final report synthesis
│   ├── schema/
│   │   ├── state.py            # AgentState TypedDict
│   │   └── models.py           # Pydantic models (Persona, PersonaAnalysis, etc.)
│   └── prompts/
│       └── stock_info_prompt.yaml
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Main page (search + streaming + report)
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── globals.css
│   │   ├── components/         # SearchBar, ThinkingProcess, ReportDashboard, etc.
│   │   ├── lib/
│   │   │   └── parseReport.ts  # Report markdown parser
│   │   └── types/
│   │       └── report.ts       # TypeScript type definitions
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.ts
├── Dockerfile                  # Backend Docker image
├── docker-compose.yml          # Full stack orchestration
├── litellm_config.yaml         # LiteLLM proxy model routing
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
└── README.md
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | *(required)* | API key for the LLM provider |
| `OPENAI_MODEL_NAME` | `gpt-4` | Model name (must match `litellm_config.yaml` when using Docker) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | LLM endpoint (overridden to LiteLLM proxy in Docker) |
| `PERPLEXITY_API_KEY` | *(optional)* | Perplexity API key for enhanced search |
| `LITELLM_MASTER_KEY` | `sk-litellm-master-key` | Master key for the LiteLLM proxy admin API |
| `LOG_LEVEL` | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `LLM_TIMEOUT_SECONDS` | `60` | Timeout per LLM request |
| `LLM_MAX_RETRIES` | `5` | Max retries per LLM request |
| `API_TIMEOUT_SECONDS` | `60` | Timeout for external API calls |
| `API_MAX_RETRIES` | `5` | Max retries for external API calls |
| `RECURSION_LIMIT` | `100` | LangGraph max steps per invocation |

### LiteLLM Proxy

The `litellm_config.yaml` defines which models the proxy can route to. By default it includes `gpt-4`, `gpt-4o`, and `gpt-4o-mini`. To add other providers (Anthropic, Azure, Bedrock, etc.), edit the config following the [LiteLLM docs](https://docs.litellm.ai/docs/proxy/configs).

Example — adding Claude:

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
```

Then set `OPENAI_MODEL_NAME=claude-sonnet` and `ANTHROPIC_API_KEY` in your `.env`.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Run full analysis pipeline, return JSON result |
| `POST` | `/api/analyze/stream` | SSE stream of pipeline progress + final report |
| `GET` | `/health` | Health check |

### Streaming Example

```bash
curl -N -X POST http://localhost:8000/api/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"user_message": "Analyze AAPL stock"}'
```

## License

MIT
