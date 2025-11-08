# maestro

AI ATL Hackathon Project

# ScaleRAG / TrustRAG

Enterprise RAG orchestration layer for production deployments.

## For Google Track: Performance & Scalability

**ScaleRAG** - RAG infrastructure that actually ships. 70% cost reduction, 5x latency improvement.

## For Reliability Track: Trust & Safety

**TrustRAG** - Production-grade reliability framework with full auditability and explainability.

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Gemini API key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Prepare demo data
python scripts/prepare_demo_data.py

# Start server
python main.py
```

Server runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Dashboard runs at: http://localhost:3000

---

## Architecture

```
┌─────────────────────────────────────┐
│     ScaleRAG Orchestration Layer    │
│  • Semantic Cache (LangCache)       │
│  • Query Router (Gemini)            │
│  • Cost Tracking & Budgeting        │
│  • Observability Dashboard          │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴───────────┐
    │  Enterprise Stack    │
    │  • Pinecone/Weaviate │
    │  • OpenAI/Anthropic  │
    │  • Their Documents   │
    └──────────────────────┘
```

---

## Team

- **Backend Engineer:** [Your Name] - Orchestration engine, caching, routing
- **Frontend Engineer:** [Teammate Name] - Dashboard, visualizations, UX

---

## Demo

[Link to demo video - add after recording]

---

## Tech Stack

**Backend:**

- FastAPI (API framework)
- LangCache (semantic caching)
- Google Gemini (query classification)
- Sentence Transformers (embeddings)

**Frontend:**

- Next.js 14 (React framework)
- Tailwind CSS (styling)
- Recharts (visualizations)

---
