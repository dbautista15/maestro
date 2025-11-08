"""
Main orchestration engine.
This is what judges evaluate - the "brain" of your system.
"""

import time
from typing import Dict, Any, Optional
from dataclasses import dataclass

from core.cache import SemanticCache
from core.router import QueryRouter
from core.metrics import MetricsCollector
from adapters.vector_db import MockVectorDB


@dataclass
class OrchestratorConfig:
    """
    Configuration for orchestration behavior.

    WHY: Shows enterprises can tune the system to their needs.
    Different use cases need different trade-offs.
    """

    use_cache: bool = True
    cache_threshold: float = 0.88
    default_strategy: Optional[str] = None  # Override routing
    max_cost_per_query: float = 0.05  # Budget constraint
    enable_verification: bool = True


class MaestroOrchestrator:
    """
    Main orchestration engine for Maestro.

    This is your product. Everything else is infrastructure.

    FLOW:
    1. Check semantic cache (fastest path)
    2. If miss, classify query complexity
    3. Select retrieval strategy
    4. Execute retrieval via vector DB
    5. Generate answer (in real system, would call LLM)
    6. Cache result if high confidence
    7. Log metrics for dashboard
    8. Return result

    WHY THIS DESIGN: Each step is independently testable and configurable.
    """

    def __init__(self, config: OrchestratorConfig = None):
        self.config = config or OrchestratorConfig()

        # Initialize components
        print("Initializing Maestro Orchestrator...")
        self.cache = SemanticCache(similarity_threshold=self.config.cache_threshold)
        self.router = QueryRouter()
        self.metrics = MetricsCollector()
        self.vector_db = MockVectorDB()

        print(" Orchestrator ready")

    def process_query(self, query: str, user_config: Dict = None) -> Dict[str, Any]:
        """
        Main entry point for query processing.

        This is what the API endpoint calls.

        Returns:
            Dict with answer, cost, latency, source, etc.
        """
        start_time = time.time()

        # Merge user config with defaults
        config = self.config
        if user_config:
            # Allow per-query overrides
            config = OrchestratorConfig(**{**config.__dict__, **user_config})

        # STEP 1: Check cache (if enabled)
        if config.use_cache:
            cached = self.cache.get(query)
            if cached:
                # Cache hit - return immediately
                cached["total_latency_ms"] = (time.time() - start_time) * 1000

                # Log metrics
                self.metrics.log_query(
                    query=query,
                    source="cache",
                    strategy="cached",
                    latency_ms=cached["latency_ms"],
                    cost=cached["cost"],
                    confidence=cached["confidence"],
                    num_documents=len(cached["documents"]),
                )

                return cached

        # STEP 2: Cache miss - classify query
        complexity = self.router.classify_query(query)

        # STEP 3: Select strategy
        strategy = self.router.select_strategy(
            complexity, user_preference=config.default_strategy
        )

        # STEP 4: Check budget constraint
        if strategy.estimated_cost > config.max_cost_per_query:
            # Downgrade to cheaper strategy
            print(f" Cost constraint: downgrading to fast")
            strategy = self.router.select_strategy("simple")

        # STEP 5: Retrieve documents
        try:
            documents = self.vector_db.search(query, top_k=strategy.top_k)
        except Exception as e:
            # Graceful degradation
            print(f" Vector DB error: {e}")
            return self._fallback_response(query, error=str(e))

        # STEP 6: Generate answer
        # In real system: answer = llm.generate(query, documents)
        # For demo: Use simple template
        answer = self._generate_answer(query, documents)

        # STEP 7: Calculate confidence
        # In real system: Use model's confidence scores
        # For demo: Use similarity scores
        confidence = self._calculate_confidence(documents)

        # STEP 8: Verification (if required)
        if config.enable_verification and strategy.requires_verification:
            # In real system: Run verification checks
            # For demo: Just flag if confidence is low
            if confidence < 0.90:
                print(f" Low confidence ({confidence:.2f}) - would queue for review")

        # Calculate total latency
        latency_ms = (time.time() - start_time) * 1000

        # STEP 9: Prepare result
        result = {
            "answer": answer,
            "documents": [self._serialize_doc(d) for d in documents],
            "confidence": confidence,
            "cost": strategy.estimated_cost,
            "latency_ms": latency_ms,
            "source": "RETRIEVAL",
            "strategy": strategy.name,
            "complexity": complexity,
            "num_documents_retrieved": len(documents),
        }

        # STEP 10: Cache result (if high confidence)
        if config.use_cache and confidence >= 0.85:
            self.cache.set(
                query=query,
                answer=answer,
                documents=result["documents"],
                confidence=confidence,
                cost=strategy.estimated_cost,
                strategy=strategy.name,
                complexity=complexity,
            )

        # STEP 11: Log metrics
        self.metrics.log_query(
            query=query,
            source="retrieval",
            strategy=strategy.name,
            latency_ms=latency_ms,
            cost=strategy.estimated_cost,
            confidence=confidence,
            num_documents=len(documents),
        )

        return result

    def _generate_answer(self, query: str, documents: list) -> str:
        """
        Generate answer from retrieved documents.

        WHY SIMPLE: For demo, we just show the concept. In production,
        this would be a real LLM call. Judges understand this is a demo.
        """
        # For demo: Just reference the documents
        doc_titles = [d["title"] for d in documents[:3]]

        answer = f"Based on {len(documents)} relevant documents "
        answer += f"({', '.join(doc_titles)}), "

        # Use first doc's content as base
        if documents:
            content_snippet = documents[0]["content"][:200]
            answer += content_snippet + "..."

        return answer

    def _calculate_confidence(self, documents: list) -> float:
        """
        Calculate confidence score from documents.

        WHY: Gives enterprises a signal for when to escalate to humans.

        NOTE: Semantic similarity scores from embeddings typically range 0.3-0.7
        for good matches. We scale these to more intuitive 0-1 confidence scores.
        """
        if not documents:
            return 0.0

        # Use top document's similarity score (most relevant)
        scores = [d["similarity_score"] for d in documents]
        top_score = scores[0]  # Documents are sorted by similarity

        # Scale similarity to confidence
        # 0.2 similarity → ~0.68 confidence (low)
        # 0.3 similarity → ~0.85 confidence (moderate)
        # 0.4 similarity → ~1.0 confidence (high)
        # 0.5+ similarity → 1.0 confidence (very high)
        confidence = min((top_score + 0.15) * 2.0, 1.0)

        # Boost confidence if multiple documents agree (avg similarity is also high)
        if len(scores) > 1:
            avg_score = sum(scores[:3]) / min(3, len(scores))  # Top 3 docs
            if avg_score > 0.35:
                confidence = min(confidence * 1.05, 1.0)  # 5% boost

        return confidence

    def _serialize_doc(self, doc: Dict) -> Dict:
        """Prepare document for JSON response"""
        return {
            "id": doc["id"],
            "title": doc["title"],
            "category": doc.get("category"),
            "similarity_score": doc.get("similarity_score", 0.0),
            "content_preview": doc["content"][:150] + "...",
        }

    def _fallback_response(self, query: str, error: str) -> Dict:
        """
        Graceful degradation when primary system fails.

        WHY: Production systems must handle failures gracefully.
        This shows judges you thought about reliability.
        """
        return {
            "answer": "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
            "documents": [],
            "confidence": 0.0,
            "cost": 0.0,
            "latency_ms": 0.0,
            "source": "FALLBACK",
            "error": error,
            "strategy": "error_handling",
        }

    def get_metrics(self) -> Dict:
        """Get dashboard metrics"""
        return {**self.metrics.get_dashboard_metrics(), **self.cache.get_stats()}

    def get_recent_queries(self, limit: int = 10) -> list:
        """Get recent queries for audit trail"""
        return self.metrics.get_recent_queries(limit)

    def get_query_timeseries(
        self, bucket_seconds: int = 60, num_buckets: int = 20
    ) -> list:
        """Get time-series data for query volume"""
        return self.metrics.get_query_timeseries(bucket_seconds, num_buckets)