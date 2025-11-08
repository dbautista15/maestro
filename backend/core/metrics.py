"""
Metrics collection for observability dashboard.
Tracks cost, latency, cache performance, etc.
"""

import time
from typing import Dict, List
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class QueryMetric:
    """Single query execution metrics"""

    timestamp: float
    query: str
    source: str  # 'cache' or 'retrieval'
    strategy: str  # 'fast', 'balanced', 'comprehensive'
    latency_ms: float
    cost: float
    confidence: float
    num_documents: int


class MetricsCollector:
    """
    Collects and aggregates metrics for dashboard.

    WHY: Observability is key for production systems. This gives
    enterprises visibility into what their RAG is doing.
    """

    def __init__(self):
        self.queries: List[QueryMetric] = []
        self.aggregated = defaultdict(
            lambda: {"count": 0, "total_cost": 0.0, "total_latency": 0.0}
        )

    def log_query(
        self,
        query: str,
        source: str,
        strategy: str,
        latency_ms: float,
        cost: float,
        confidence: float,
        num_documents: int,
    ):
        """Log individual query execution"""
        metric = QueryMetric(
            timestamp=time.time(),
            query=query,
            source=source,
            strategy=strategy,
            latency_ms=latency_ms,
            cost=cost,
            confidence=confidence,
            num_documents=num_documents,
        )

        self.queries.append(metric)

        # Update aggregations
        self.aggregated[source]["count"] += 1
        self.aggregated[source]["total_cost"] += cost
        self.aggregated[source]["total_latency"] += latency_ms

    def get_dashboard_metrics(self) -> Dict:
        """
        Return metrics for frontend dashboard.

        WHY: Frontend polls this endpoint every few seconds to show
        real-time updates during demo.
        """
        total_queries = len(self.queries)

        if total_queries == 0:
            return {
                "total_queries": 0,
                "cache_hit_rate": 0.0,
                "avg_cost": 0.0,
                "avg_latency_ms": 0.0,
                "total_cost": 0.0,
                "cost_saved": 0.0,
            }

        # Calculate metrics
        cache_queries = self.aggregated["cache"]["count"]
        total_cost = sum(q.cost for q in self.queries)
        total_latency = sum(q.latency_ms for q in self.queries)

        # Estimate savings (compare to naive RAG)
        naive_cost_per_query = 0.018  # Assume always comprehensive
        cost_without_optimization = total_queries * naive_cost_per_query
        cost_saved = cost_without_optimization - total_cost

        return {
            "total_queries": total_queries,
            "cache_hit_rate": cache_queries / total_queries,
            "avg_cost": total_cost / total_queries,
            "avg_latency_ms": total_latency / total_queries,
            "total_cost": total_cost,
            "cost_saved": max(0, cost_saved),
            "breakdown_by_strategy": self._get_strategy_breakdown(),
        }

    def _get_strategy_breakdown(self) -> Dict:
        """Break down queries by strategy for charts"""
        breakdown = defaultdict(int)
        for query in self.queries:
            breakdown[query.strategy] += 1
        return dict(breakdown)

    def get_recent_queries(self, limit: int = 10) -> List[Dict]:
        """Get recent queries for audit trail display"""
        recent = self.queries[-limit:]
        return [asdict(q) for q in reversed(recent)]
