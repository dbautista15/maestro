# Maestro Backend

running tests ( make sure you are in the backend folder and not the test one though): source venv/bin/activate -> pytest test/test\_\*.py -v

# Adversarial RAG Implementation

Create adversarial testing system that uses Gemini API for intelligent test generation and analysis. Since adversarial testing is NOT performance-critical (runs on-demand, not per-query), we can use Gemini's intelligence here.

While other RAGs just respond to queries, Maestro proactively tests your LLM using AI to generate challenging scenarios. It uses Gemini to think like an adversary, finding weaknesses before your customers do.

Uses existing Gemini configuration from router.py
Generates queries that combine multiple document categories
Tests queries through existing orchestrator
Flags responses with confidence < 0.7 as weaknesses
Uses Gemini to explain WHY they failed
Provides actionable recommendations
Why Gemini for Adversarial (But Not Main Queries)?
Main Query Path (Gemini DISABLED):
Needs to be fast (<1 second)
Runs on every user query
Performance critical
Rule-based works fine
Adversarial Testing (Gemini ENABLED):
Runs on-demand or in background
Speed doesn't matter (can take 20-30 seconds)
Needs creativity and intelligence
Perfect use case for LLM!
Gemini Use Cases in Adversarial System
Generate Challenge Queries:
"Given these document categories: [pricing, support, SLA, features]
Generate 10 challenging queries that:

- Combine multiple topics
- Test edge cases
- Require multi-hop reasoning
- Could expose LLM weaknesses"
  Analyze Failures:
  "This query had low confidence (0.65):
  Query: 'What support is included in basic pricing?'
  Retrieved docs: [doc1, doc2]
  Answer: [...]
  Why might this be low confidence? What's missing?"
  Generate Recommendations:
  "Based on these 3 failed queries, suggest improvements:

1. Add specific document types?
2. Adjust retrieval strategy?
3. Fine-tune on similar queries?"

# Demo Usage

For your hackathon presentation:
Show Proactive Testing:
curl http://localhost:8000/api/adversarial/challenges
"While other RAGs wait for failures, Maestro uses AI to generate challenging test cases proactively."
Show Intelligent Analysis:
curl -X POST http://localhost:8000/api/adversarial/test \
 -H "Content-Type: application/json" \
 -d '{"query":"Your challenging query here"}'
"When tests fail, Gemini analyzes WHY and suggests specific improvements."
Show Full Report: Visit http://localhost:8000/docs → Find /api/adversarial/report → Try it out "One-click health check for your entire LLM system."

# # Your Pitch

"Traditional RAG is reactive - it waits for user queries. Maestro is proactive - it acts as a red team for your LLM, using AI to generate challenging scenarios, detect weaknesses before customers do, and provide intelligent recommendations for improvement. It's continuous LLMOps, not just retrieval."

# Technical Highlights

✅ Minimal Code Changes - Only 3 lines modified in existing code
✅ Gemini Integration - Uses AI for query generation and failure analysis
✅ Graceful Fallback - Works even if Gemini API fails
✅ Production Ready - Error handling, logging, proper HTTP status codes
✅ Documented - Full docstrings and WHY comments Ready to commit and deploy to Railway?

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
