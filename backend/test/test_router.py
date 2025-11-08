"""
Unit tests for QueryRouter component.
Tests query complexity classification and retrieval strategy selection.
"""

import pytest
from unittest.mock import patch, MagicMock
from core.router import QueryRouter, STRATEGIES


class TestQueryRouter:
    """Test suite for QueryRouter"""

    @pytest.fixture
    def router(self):
        """Create a fresh router for each test"""
        return QueryRouter()

    # ============================================================================
    # Query Classification Tests
    # ============================================================================

    def test_classify_simple_query_rules(self, router):
        """Test rule-based classification of simple queries"""
        # Disable Gemini for this test to use rules only
        router.gemini_available = False

        simple_queries = [
            "What is your refund policy?",
            "Who is the CEO?",
            "When does shipping take?",
            "How much does it cost?",
        ]

        for query in simple_queries:
            result = router.classify_query(query)
            assert result == "simple", f"Failed for: {query}"

    def test_classify_complex_query_rules(self, router):
        """Test rule-based classification of complex queries"""
        router.gemini_available = False

        complex_queries = [
            "Compare your pricing to competitors",
            "Analyze the pros and cons of this service",
            "Evaluate our system versus other solutions",
            "What is the difference between plan A and B?",
        ]

        for query in complex_queries:
            result = router.classify_query(query)
            assert result == "complex", f"Failed for: {query}"

    def test_classify_moderate_query_rules(self, router):
        """Test rule-based classification of moderate queries"""
        router.gemini_available = False

        moderate_queries = [
            "How do I use your platform?",
            "Explain your onboarding process",
            "Tell me about your API",
            "What features are included?",
        ]

        for query in moderate_queries:
            result = router.classify_query(query)
            assert result == "moderate", f"Failed for: {query}"

    def test_classify_short_query_is_simple(self, router):
        """Test that very short queries are classified as simple"""
        router.gemini_available = False

        result = router.classify_query("Cost?")
        assert result == "simple"

        result = router.classify_query("Pricing")
        assert result == "simple"

    def test_classify_with_gemini_when_available(self, router):
        """Test that Gemini is used when available"""
        # Enable Gemini for this test (normally disabled for performance)
        router.gemini_available = True

        # Mock Gemini response
        mock_response = MagicMock()
        mock_response.text = "complex"

        with patch.object(router, "_classify_with_gemini", return_value="complex"):
            result = router.classify_query("Some query")
            assert result == "complex"

    def test_classify_fallback_on_gemini_error(self, router):
        """Test fallback to rules when Gemini fails"""
        # Mock Gemini to fail
        with patch.object(router, "_classify_with_gemini", return_value=None):
            result = router.classify_query("Compare X and Y")
            # Should fall back to rules and classify as complex
            assert result == "complex"

    def test_classify_with_gemini_invalid_response(self, router):
        """Test handling of invalid Gemini responses"""
        router.gemini_available = True

        # Mock invalid response
        with patch.object(router, "_classify_with_gemini", return_value=None):
            result = router.classify_query("What is refund policy?")
            # Should fall back to rules
            assert result in ["simple", "moderate", "complex"]

    # ============================================================================
    # Strategy Selection Tests
    # ============================================================================

    def test_select_strategy_simple_to_fast(self):
        """Test that simple queries map to fast strategy"""
        router = QueryRouter()
        router.gemini_available = False

        strategy = router.select_strategy("simple")
        assert strategy.name == "fast"
        assert strategy.top_k == 2
        assert strategy.estimated_cost == 0.003

    def test_select_strategy_moderate_to_balanced(self):
        """Test that moderate queries map to balanced strategy"""
        router = QueryRouter()
        router.gemini_available = False

        strategy = router.select_strategy("moderate")
        assert strategy.name == "balanced"
        assert strategy.top_k == 5
        assert strategy.estimated_cost == 0.007

    def test_select_strategy_complex_to_comprehensive(self):
        """Test that complex queries map to comprehensive strategy"""
        router = QueryRouter()
        router.gemini_available = False

        strategy = router.select_strategy("complex")
        assert strategy.name == "comprehensive"
        assert strategy.top_k == 10
        assert strategy.estimated_cost == 0.018

    def test_user_preference_overrides_complexity(self):
        """Test that user preference overrides auto-selection"""
        router = QueryRouter()

        # User prefers fast even for complex query
        strategy = router.select_strategy("complex", user_preference="fast")
        assert strategy.name == "fast"
        assert strategy.top_k == 2

    def test_invalid_user_preference_ignored(self):
        """Test that invalid user preference is ignored"""
        router = QueryRouter()

        # Invalid preference should be ignored
        strategy = router.select_strategy("complex", user_preference="invalid_strategy")
        # Should fall back to default for complex
        assert strategy.name == "comprehensive"

    def test_strategy_has_all_required_fields(self):
        """Test that strategies have all required fields"""
        for strategy_name, strategy in STRATEGIES.items():
            assert hasattr(strategy, "name")
            assert hasattr(strategy, "complexity")
            assert hasattr(strategy, "top_k")
            assert hasattr(strategy, "estimated_cost")
            assert hasattr(strategy, "requires_verification")
            assert hasattr(strategy, "max_latency_ms")

            # Validate field values
            assert strategy.name in ["fast", "balanced", "comprehensive"]
            assert strategy.complexity in ["simple", "moderate", "complex"]
            assert strategy.top_k > 0
            assert strategy.estimated_cost > 0
            assert isinstance(strategy.requires_verification, bool)
            assert strategy.max_latency_ms > 0

    def test_strategy_cost_increases_with_complexity(self):
        """Test that more comprehensive strategies cost more"""
        fast_cost = STRATEGIES["fast"].estimated_cost
        balanced_cost = STRATEGIES["balanced"].estimated_cost
        comprehensive_cost = STRATEGIES["comprehensive"].estimated_cost

        assert fast_cost < balanced_cost < comprehensive_cost

    def test_strategy_top_k_increases_with_complexity(self):
        """Test that more comprehensive strategies retrieve more docs"""
        fast_k = STRATEGIES["fast"].top_k
        balanced_k = STRATEGIES["balanced"].top_k
        comprehensive_k = STRATEGIES["comprehensive"].top_k

        assert fast_k < balanced_k < comprehensive_k

    def test_comprehensive_requires_verification(self):
        """Test that comprehensive strategy requires verification"""
        assert STRATEGIES["comprehensive"].requires_verification is True
        assert STRATEGIES["fast"].requires_verification is False
        assert STRATEGIES["balanced"].requires_verification is False

    # ============================================================================
    # Integration Tests
    # ============================================================================

    def test_end_to_end_simple_query_routing(self, router):
        """Test complete flow for simple query"""
        router.gemini_available = False

        # Classify
        complexity = router.classify_query("What is your refund policy?")
        assert complexity == "simple"

        # Select strategy
        strategy = router.select_strategy(complexity)
        assert strategy.name == "fast"
        assert strategy.top_k == 2

    def test_end_to_end_complex_query_routing(self, router):
        """Test complete flow for complex query"""
        router.gemini_available = False

        # Classify
        complexity = router.classify_query("Compare your pricing versus competitors")
        assert complexity == "complex"

        # Select strategy
        strategy = router.select_strategy(complexity)
        assert strategy.name == "comprehensive"
        assert strategy.top_k == 10

    def test_router_handles_edge_cases(self, router):
        """Test router handles edge cases gracefully"""
        router.gemini_available = False

        edge_cases = [
            "",  # Empty query
            "   ",  # Whitespace only
            "???",  # Symbols only
            "a" * 1000,  # Very long query
        ]

        for query in edge_cases:
            # Should not crash
            result = router.classify_query(query)
            assert result in ["simple", "moderate", "complex"]

    def test_router_case_insensitive(self, router):
        """Test that classification is case-insensitive"""
        router.gemini_available = False

        query_lower = "what is your refund policy?"
        query_upper = "WHAT IS YOUR REFUND POLICY?"

        result_lower = router.classify_query(query_lower)
        result_upper = router.classify_query(query_upper)

        assert result_lower == result_upper


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
