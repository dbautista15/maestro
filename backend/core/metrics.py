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

    def get_query_timeseries(
        self, bucket_seconds: int = 60, num_buckets: int = 20
    ) -> List[Dict]:
        """
        Get time-series data for query volume.
        
        Buckets queries by time intervals for trend visualization.
        
        Args:
            bucket_seconds: Size of each time bucket in seconds (default: 60 = 1 minute)
            num_buckets: Number of time buckets to return (default: 20)
            
        Returns:
            List of dicts with timestamp, queries count, and formatted time
            
        WHY: Frontend needs time-series data to show query volume trends.
        This allows managers to see usage patterns and peak times.
        """
        if not self.queries:
            return []
        
        # Get time range
        now = time.time()
        earliest_time = now - (bucket_seconds * num_buckets)
        
        # Create buckets
        buckets = defaultdict(int)
        
        # Bucket each query by its timestamp
        for query in self.queries:
            if query.timestamp >= earliest_time:
                # Calculate which bucket this query belongs to
                bucket_index = int((query.timestamp - earliest_time) / bucket_seconds)
                bucket_time = earliest_time + (bucket_index * bucket_seconds)
                buckets[bucket_time] += 1
        
        # Build result with per-bucket counts
        result = []
        
        for i in range(num_buckets):
            bucket_time = earliest_time + (i * bucket_seconds)
            count = buckets.get(bucket_time, 0)
            
            result.append({
                "timestamp": int(bucket_time * 1000),  # Convert to milliseconds for JS
                "queries": count,  # Queries in this time bucket
            })
        
        return result

    def get_cache_hit_rate_timeseries(
        self, bucket_seconds: int = 60, num_buckets: int = 20
    ) -> List[Dict]:
        """
        Get time-series data for cumulative cache hit rate.
        
        Calculates cumulative cache hit rate up to each time bucket.
        Shows overall cache effectiveness from the start to each point in time.
        
        Args:
            bucket_seconds: Size of each time bucket in seconds (default: 60 = 1 minute)
            num_buckets: Number of time buckets to return (default: 20)
            
        Returns:
            List of dicts with timestamp and cumulative cache hit rate (0.0 to 1.0)
            
        WHY: Frontend needs time-series data to show cache warming patterns
        and effectiveness over time. Cumulative rate shows the overall trend
        and helps managers understand if the cache is consistently improving.
        """
        if not self.queries:
            return []
        
        # Get time range
        now = time.time()
        earliest_time = now - (bucket_seconds * num_buckets)
        
        # Create buckets to track total and cache hits
        buckets = defaultdict(lambda: {"total": 0, "cache_hits": 0})
        
        # Bucket each query by its timestamp
        for query in self.queries:
            if query.timestamp >= earliest_time:
                # Calculate which bucket this query belongs to
                bucket_index = int((query.timestamp - earliest_time) / bucket_seconds)
                bucket_time = earliest_time + (bucket_index * bucket_seconds)
                
                buckets[bucket_time]["total"] += 1
                if query.source == "cache":
                    buckets[bucket_time]["cache_hits"] += 1
        
        # Build result with cumulative cache hit rates
        result = []
        cumulative_total = 0
        cumulative_cache_hits = 0
        
        for i in range(num_buckets):
            bucket_time = earliest_time + (i * bucket_seconds)
            bucket_data = buckets.get(bucket_time, {"total": 0, "cache_hits": 0})
            
            # Add this bucket's data to cumulative totals
            cumulative_total += bucket_data["total"]
            cumulative_cache_hits += bucket_data["cache_hits"]
            
            # Calculate cumulative hit rate (avoid division by zero)
            if cumulative_total > 0:
                hit_rate = cumulative_cache_hits / cumulative_total
            else:
                hit_rate = 0.0
            
            result.append({
                "timestamp": int(bucket_time * 1000),  # Convert to milliseconds for JS
                "hit_rate": hit_rate,  # Cumulative cache hit rate (0.0 to 1.0)
                "total_queries": cumulative_total,  # For context
            })
        
        return result

    def get_avg_cost_timeseries(
        self, bucket_seconds: int = 60, num_buckets: int = 20
    ) -> List[Dict]:
        """
        Get time-series data for cumulative average cost per query.
        
        Calculates cumulative average cost per query up to each time bucket.
        Shows overall cost effectiveness from the start to each point in time.
        
        Args:
            bucket_seconds: Size of each time bucket in seconds (default: 60 = 1 minute)
            num_buckets: Number of time buckets to return (default: 20)
            
        Returns:
            List of dicts with timestamp and cumulative average cost per query
            
        WHY: Frontend needs time-series data to show cost optimization trends.
        Cumulative average shows the overall trend and helps managers understand
        if the system is becoming more cost-efficient over time (from cache warming
        and smart routing).
        """
        if not self.queries:
            return []
        
        # Get time range
        now = time.time()
        earliest_time = now - (bucket_seconds * num_buckets)
        
        # Create buckets to track total cost and query count
        buckets = defaultdict(lambda: {"total_cost": 0.0, "query_count": 0})
        
        # Bucket each query by its timestamp
        for query in self.queries:
            if query.timestamp >= earliest_time:
                # Calculate which bucket this query belongs to
                bucket_index = int((query.timestamp - earliest_time) / bucket_seconds)
                bucket_time = earliest_time + (bucket_index * bucket_seconds)
                
                buckets[bucket_time]["total_cost"] += query.cost
                buckets[bucket_time]["query_count"] += 1
        
        # Build result with cumulative average costs
        result = []
        cumulative_total_cost = 0.0
        cumulative_query_count = 0
        
        for i in range(num_buckets):
            bucket_time = earliest_time + (i * bucket_seconds)
            bucket_data = buckets.get(bucket_time, {"total_cost": 0.0, "query_count": 0})
            
            # Add this bucket's data to cumulative totals
            cumulative_total_cost += bucket_data["total_cost"]
            cumulative_query_count += bucket_data["query_count"]
            
            # Calculate cumulative average cost (avoid division by zero)
            if cumulative_query_count > 0:
                avg_cost = cumulative_total_cost / cumulative_query_count
            else:
                avg_cost = 0.0
            
            result.append({
                "timestamp": int(bucket_time * 1000),  # Convert to milliseconds for JS
                "avg_cost": avg_cost,  # Cumulative average cost per query
                "query_count": cumulative_query_count,  # For context
            })
        
        return result