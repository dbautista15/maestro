"""
FastAPI server - the HTTP interface to your orchestration layer.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

from core.orchestrator import MaestroOrchestrator, OrchestratorConfig

# Initialize FastAPI
app = FastAPI(
    title="Maestro API",
    description="Enterprise RAG Orchestration Layer",
    version="1.0.0",
)

# CORS for frontend (localhost during demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specific domains only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator (singleton)
orchestrator = MaestroOrchestrator(
    config=OrchestratorConfig(
        use_cache=True, cache_threshold=0.88, max_cost_per_query=0.05
    )
)


# Request/Response models
class QueryRequest(BaseModel):
    query: str
    strategy: Optional[str] = None  # Override: 'fast', 'balanced', 'comprehensive'
    use_cache: Optional[bool] = True


class QueryResponse(BaseModel):
    answer: str
    documents: list
    confidence: float
    cost: float
    latency_ms: float
    source: str  # 'CACHE' or 'RETRIEVAL'
    strategy: str
    complexity: str


# API Endpoints


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"service": "Maestro", "status": "operational", "version": "1.0.0"}


@app.post("/api/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Main query endpoint.

    This is what frontend calls when user submits a query.
    """
    try:
        # Build user config from request
        user_config = {}
        if request.strategy:
            user_config["default_strategy"] = request.strategy
        if request.use_cache is not None:
            user_config["use_cache"] = request.use_cache

        # Process query
        result = orchestrator.process_query(
            query=request.query, user_config=user_config if user_config else None
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics")
async def get_metrics():
    """
    Get dashboard metrics.

    Frontend polls this every few seconds to update charts.
    """
    try:
        return orchestrator.get_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recent-queries")
async def get_recent_queries(limit: int = 10):
    """
    Get recent queries for audit trail.

    Shows full provenance - which docs, what scores, etc.
    """
    try:
        return {"queries": orchestrator.get_recent_queries(limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/timeseries/queries")
async def get_query_timeseries(bucket_seconds: int = 60, num_buckets: int = 20):
    """
    Get time-series data for query volume.
    
    Returns time-bucketed query counts for trend visualization.
    
    Args:
        bucket_seconds: Size of each time bucket in seconds (default: 60 = 1 minute)
        num_buckets: Number of time buckets to return (default: 20)
        
    WHY: Frontend needs time-series data to visualize query volume trends
    and identify usage patterns. This enables managers to see peak times
    and plan capacity accordingly.
    """
    try:
        return {"data": orchestrator.get_query_timeseries(bucket_seconds, num_buckets)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "components": {
            "cache": "operational",
            "router": "operational",
            "vector_db": "operational",
        },
        "metrics": orchestrator.get_metrics(),
    }


# Run server
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
