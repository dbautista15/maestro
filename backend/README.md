# Maestro Backend

## Structure

```
backend/
├── core/               # Core orchestration logic (YOUR PRODUCT)
│   ├── orchestrator.py # Main orchestration engine
│   ├── cache.py        # Semantic caching with LangCache
│   ├── router.py       # Query classification & routing
│   ├── metrics.py      # Metrics collection & aggregation
│   └── logger.py       # Logging configuration
│
├── adapters/           # Integration layer (provider-agnostic)
│   └── vector_db.py    # Vector DB adapters (Mock, Pinecone, etc.)
│
├── data/               # Demo data (generated, not committed)
│   ├── documents.json  # Sample documents
│   ├── embeddings.npy  # Pre-computed embeddings (gitignored)
│   └── metadata.json   # Embedding metadata
│
├── scripts/            # Setup and testing utilities
│   ├── prepare_demo_data.py  # Generate demo data
│   └── test_pipeline.py      # Integration tests
│
├── main.py             # FastAPI server entrypoint
├── requirements.txt    # Python dependencies
└── .env                # Environment variables (gitignored)
```

## API Endpoints

**For Frontend Integration:**

### POST /api/query

Process a query through the orchestration layer.

**Request:**

```json
{
  "query": "What is your refund policy?",
  "strategy": "auto", // optional: "fast", "balanced", "comprehensive"
  "use_cache": true // optional: default true
}
```

**Response:**

```json
{
  "answer": "Our refund policy...",
  "documents": [...],
  "confidence": 0.94,
  "cost": 0.003,
  "latency_ms": 127,
  "source": "CACHE",  // or "RETRIEVAL"
  "strategy": "balanced",
  "complexity": "simple"
}
```

### GET /api/metrics

Get dashboard metrics.

**Response:**

```json
{
  "total_queries": 47,
  "cache_hit_rate": 0.63,
  "avg_cost": 0.0032,
  "total_cost": 0.15,
  "cost_saved": 0.85
}
```

### GET /api/recent-queries?limit=10

Get recent queries for audit trail.

### GET /api/health

Health check endpoint.

---

## Development Workflow

1. **Setup:**

```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Add your GEMINI_API_KEY to .env
```

2. **Generate Demo Data:**

```bash
   python scripts/prepare_demo_data.py
```

3. **Run Server:**

```bash
   python main.py
```

4. **Test:**

```bash
   python scripts/test_pipeline.py
```

---

## For Frontend Engineer

**Server will be running at:** http://localhost:8000

**Test endpoint:**

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is your refund policy?"}'
```

**API docs (Swagger):** http://localhost:8000/docs
