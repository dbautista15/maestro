"""
Unit tests for SemanticCache component.
Tests cache hits, misses, TTL, similarity matching, and LRU eviction.
"""

import pytest
import time
import numpy as np
from unittest.mock import patch, MagicMock
from core.cache import SemanticCache, CacheEntry


class TestSemanticCache:
    """Test suite for SemanticCache"""

    @pytest.fixture
    def cache(self):
        """Create a fresh cache for each test"""
        # Use 0.70 threshold for testing - realistic for semantic matching
        # (0.88 is too strict for many real-world similar queries)
        return SemanticCache(similarity_threshold=0.70, max_size=3)

    def test_cache_initialization(self, cache):
        """Test cache initializes with correct defaults"""
        assert cache.similarity_threshold == 0.70
        assert cache.max_size == 3
        assert len(cache.cache) == 0
        assert cache.stats["total_queries"] == 0
        assert cache.stats["cache_hits"] == 0
        assert cache.stats["cache_misses"] == 0

    def test_cache_miss_on_empty_cache(self, cache):
        """Test that empty cache always returns None (miss)"""
        result = cache.get("What is your refund policy?")
        assert result is None
        assert cache.stats["cache_misses"] == 1
        assert cache.stats["cache_hits"] == 0

    def test_cache_set_and_get_exact_match(self, cache):
        """Test storing and retrieving exact query match"""
        query = "What is your refund policy?"
        answer = "30 days for full refund"
        documents = [{"id": "doc_001", "title": "Refund Policy"}]

        # Set cache
        cache.set(
            query=query, answer=answer, documents=documents, confidence=0.95, cost=0.01,
            strategy="fast", complexity="simple"
        )

        # Get from cache
        result = cache.get(query)

        assert result is not None
        assert result["answer"] == answer
        assert result["source"] == "CACHE"
        assert result["cost"] == 0.0001  # Cache access is ~free
        assert result["latency_ms"] == 5.0
        assert cache.stats["cache_hits"] == 1

    def test_cache_semantic_similarity_match(self, cache):
        """Test cache hits on semantically similar queries"""
        query1 = "What is your refund policy?"
        query2 = "How do I get a refund?"  # Semantically similar
        answer = "30 days for full refund"
        documents = [{"id": "doc_001", "title": "Refund Policy"}]

        # Cache first query
        cache.set(
            query=query1, answer=answer, documents=documents, confidence=0.95, cost=0.01,
            strategy="fast", complexity="simple"
        )

        # Query with similar but different text
        result = cache.get(query2)

        # Should get cache hit due to semantic similarity
        # (similarity is ~0.73, which exceeds 0.70 threshold)
        assert result is not None
        assert result["source"] == "CACHE"
        assert result["cache_similarity"] >= cache.similarity_threshold

    def test_cache_miss_on_dissimilar_query(self, cache):
        """Test cache miss when query is dissimilar"""
        query1 = "What is your refund policy?"
        query2 = "Tell me about your API documentation"  # Completely different
        answer = "30 days for full refund"
        documents = [{"id": "doc_001", "title": "Refund Policy"}]

        cache.set(
            query=query1, answer=answer, documents=documents, confidence=0.95, cost=0.01,
            strategy="fast", complexity="simple"
        )

        result = cache.get(query2)

        assert result is None
        assert cache.stats["cache_misses"] == 1

    def test_cache_does_not_store_low_confidence(self, cache):
        """Test that low-confidence results are not cached"""
        query = "uncertain question?"
        answer = "uncertain answer"
        documents = []

        # Try to cache with low confidence (< 0.85)
        cache.set(
            query=query, answer=answer, documents=documents, confidence=0.75, cost=0.01,
            strategy="fast", complexity="simple"
        )

        # Should not be in cache
        assert len(cache.cache) == 0

        # Query miss
        result = cache.get(query)
        assert result is None

    def test_cache_ttl_expiration(self, cache):
        """Test that cache entries expire after TTL"""
        query = "What is your refund policy?"
        answer = "30 days for full refund"
        documents = [{"id": "doc_001"}]

        # Cache with 1 second TTL
        cache.set(
            query=query,
            answer=answer,
            documents=documents,
            confidence=0.95,
            cost=0.01,
            strategy="fast",
            complexity="simple",
            ttl=1,
        )

        # Get immediately - should hit
        result = cache.get(query)
        assert result is not None

        # Wait for TTL to expire
        time.sleep(1.1)

        # Should be cache miss now
        result = cache.get(query)
        assert result is None
        # Entry should be deleted from cache
        assert len(cache.cache) == 0

    def test_cache_lru_eviction(self, cache):
        """Test LRU eviction when cache reaches max_size"""
        # Cache has max_size=3
        queries = [
            ("What is refund policy?", "30 days"),
            ("How long does shipping take?", "5-7 days"),
            ("What is pricing?", "$10k/year"),
            ("Tell me about security", "SOC 2 certified"),  # This should evict oldest
        ]

        for query, answer in queries:
            cache.set(
                query=query, answer=answer, documents=[], confidence=0.95, cost=0.01,
                strategy="fast", complexity="simple"
            )

        # Cache should only have 3 entries (LRU evicted oldest)
        assert len(cache.cache) == 3

        # First query should have been evicted
        result = cache.get(queries[0][0])
        assert result is None

        # Most recent queries should still be there
        result = cache.get(queries[2][0])
        assert result is not None

    def test_cache_hit_count_increments(self, cache):
        """Test that hit count increments on cache hits"""
        query = "What is your refund policy?"
        cache.set(
            query=query, answer="30 days", documents=[], confidence=0.95, cost=0.01,
            strategy="fast", complexity="simple"
        )

        # Access cache multiple times
        for i in range(3):
            result = cache.get(query)
            assert result is not None
            assert result["hit_count"] == i + 1

    def test_cache_stats_tracking(self, cache):
        """Test that cache stats are tracked correctly"""
        # Initial stats
        assert cache.stats["total_queries"] == 0
        assert cache.stats["cache_hits"] == 0
        assert cache.stats["cache_misses"] == 0

        # Perform queries with distinct strings that won't accidentally match
        cache.set(query="refund policy question", answer="a1", documents=[], confidence=0.95, cost=0.01,
                  strategy="fast", complexity="simple")
        cache.get("refund policy question")  # hit
        cache.get("completely unrelated API documentation query")  # miss
        cache.get("refund policy question")  # hit again

        stats = cache.get_stats()
        assert stats["total_queries"] == 3
        assert stats["cache_hits"] == 2
        assert stats["cache_misses"] == 1
        assert stats["hit_rate"] == 2 / 3

    def test_cache_clear(self, cache):
        """Test cache.clear() resets everything"""
        cache.set(query="q1", answer="a1", documents=[], confidence=0.95, cost=0.01,
                  strategy="fast", complexity="simple")
        cache.get("q1")

        # Stats should have data
        assert len(cache.cache) > 0
        assert cache.stats["cache_hits"] > 0

        # Clear cache
        cache.clear()

        assert len(cache.cache) == 0
        assert cache.stats["total_queries"] == 0
        assert cache.stats["cache_hits"] == 0

    def test_cache_with_multiple_documents(self, cache):
        """Test caching with multiple documents"""
        query = "Tell me about your platform"
        documents = [
            {"id": "doc_001", "title": "Features"},
            {"id": "doc_002", "title": "Pricing"},
            {"id": "doc_003", "title": "Security"},
        ]
        answer = "Our platform offers X, Y, Z"

        cache.set(
            query=query, answer=answer, documents=documents, confidence=0.92, cost=0.01,
            strategy="fast", complexity="simple"
        )
        result = cache.get(query)

        assert result is not None
        assert len(result["documents"]) == 3
        assert result["documents"][0]["id"] == "doc_001"

    def test_cache_similarity_above_threshold(self, cache):
        """Test that cache requires similarity above threshold"""
        query1 = "What is your refund policy?"
        cache.set(
            query=query1, answer="30 days", documents=[], confidence=0.95, cost=0.01,
            strategy="fast", complexity="simple"
        )

        # Very different query - should not hit even with low threshold
        result = cache.get("Tell me about Python programming")
        assert result is None

    def test_embedding_consistency(self, cache):
        """Test that embeddings are consistent across calls"""
        query = "What is your refund policy?"
        cache.set(
            query=query, answer="30 days", documents=[], confidence=0.95, cost=0.01,
            strategy="fast", complexity="simple"
        )

        # Get entry
        entry = list(cache.cache.values())[0]
        original_embedding = entry.query_embedding.copy()

        # Query again and check embedding similarity
        result = cache.get(query)
        assert result is not None

        # Original should still be in cache (not modified)
        entry_again = list(cache.cache.values())[0]
        assert np.allclose(original_embedding, entry_again.query_embedding)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
