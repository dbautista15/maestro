class AdversarialQueryGenerator:
    """
    Generates challenging queries to test LLM robustness.

    DEMO VALUE: Shows enterprises how you find their LLM's blind spots.
    """

    def __init__(self, vector_db, orchestrator):
        self.vector_db = vector_db
        self.orchestrator = orchestrator

    def generate_challenge_queries(self):
        """Generate queries that combine multiple documents"""

        # Get all document categories
        categories = set([doc["category"] for doc in self.vector_db.documents])

        challenges = []

        # Cross-category queries (harder than single-topic)
        challenges.append(
            {
                "query": "How does pricing affect our SLA guarantees?",
                "type": "cross_domain",
                "expected_categories": ["pricing", "legal"],
                "difficulty": "hard",
            }
        )

        # Edge case queries
        challenges.append(
            {
                "query": "What happens if I need support outside business hours on the basic plan?",
                "type": "edge_case",
                "expected_categories": ["support", "pricing"],
                "difficulty": "medium",
            }
        )

        return challenges

    def run_adversarial_test(self, query):
        """
        Run a challenge query and analyze if LLM handles it well.
        """
        result = self.orchestrator.process_query(query)

        # Adversarial analysis
        analysis = {
            "query": query,
            "confidence": result["confidence"],
            "passed": result["confidence"] > 0.85,
            "weakness_detected": result["confidence"] < 0.7,
            "recommendation": self._get_recommendation(result),
        }

        return analysis

    def _get_recommendation(self, result):
        """RAG system acts as adversary by recommending improvements"""
        if result["confidence"] < 0.7:
            return {
                "issue": "Low confidence on complex query",
                "action": "Consider adding more documents or fine-tuning on cross-domain queries",
                "similar_test_cases": ["query1", "query2"],
            }
        return {"status": "LLM handled this well"}
