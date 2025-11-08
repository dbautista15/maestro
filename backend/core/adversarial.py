"""
Adversarial RAG Testing System

This module acts as a "red team" for your LLM, proactively finding weaknesses
before customers do. Uses Gemini AI to generate intelligent test cases.

WHY: Traditional RAG is reactive. This makes it proactive - testing and improving
continuously rather than waiting for failures.
"""

import os
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


@dataclass
class AdversarialQuery:
    """
    A challenging test query designed to expose LLM weaknesses.
    """

    query: str
    type: str  # "cross_domain", "edge_case", "multi_hop", "contradiction"
    expected_categories: List[str]
    difficulty: str  # "easy", "medium", "hard"
    description: str  # Why this is challenging


@dataclass
class TestResult:
    """
    Result of running an adversarial test.
    """

    query: str
    passed: bool
    confidence: float
    actual_answer: str
    retrieved_docs: List[Dict]
    weakness_detected: Optional[str]
    recommendation: Optional[str]


class AdversarialQueryGenerator:
    """
    Generates challenging queries using Gemini AI.

    WHY GEMINI: We need creativity and intelligence to generate queries that
    truly challenge the LLM. Rule-based would be too predictable.
    """

    def __init__(self, vector_db):
        """
        Args:
            vector_db: The vector database containing documents
        """
        self.vector_db = vector_db
        try:
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
            self.gemini_available = True
            print("🔥 Adversarial tester: Gemini enabled for intelligent query generation")
        except Exception as e:
            print(f"⚠ Gemini unavailable for adversarial testing: {e}")
            self.gemini_available = False

        # Analyze knowledge base
        self.documents = vector_db.documents
        self.categories = list(set([doc["category"] for doc in self.documents]))

    def generate_challenge_queries(self, num_queries: int = 10) -> List[AdversarialQuery]:
        """
        Use Gemini to generate challenging test queries.

        Returns:
            List of adversarial queries designed to expose weaknesses
        """
        if not self.gemini_available:
            print("⚠ Using fallback hand-crafted queries (Gemini unavailable)")
            return self._fallback_queries()

        print(f"🔥 Generating {num_queries} adversarial queries with Gemini...")

        # Build context about the knowledge base
        kb_summary = self._build_knowledge_base_summary()

        # Prompt Gemini to generate adversarial queries
        prompt = f"""You are a red team tester for an AI system. Your job is to generate challenging queries that could expose weaknesses in a RAG (Retrieval-Augmented Generation) system.

Knowledge Base Summary:
{kb_summary}

Available document categories: {', '.join(self.categories)}

Generate {num_queries} challenging test queries that:
1. **Cross-domain queries**: Require combining information from multiple categories (e.g., "How does pricing affect support response times?")
2. **Edge cases**: Test boundary conditions or unusual scenarios (e.g., "What happens if I need support on a weekend for the basic plan?")
3. **Multi-hop reasoning**: Require connecting multiple pieces of information (e.g., "If I'm on enterprise pricing, can I get refunds processed faster?")
4. **Subtle contradictions**: Might have conflicting information in different docs

For each query, provide:
- The query text
- Type (cross_domain, edge_case, multi_hop, or contradiction)
- Expected categories that should be retrieved
- Difficulty (easy, medium, hard)
- Brief explanation of why this is challenging

Return ONLY a valid JSON array in this exact format:
[
  {{
    "query": "query text here",
    "type": "cross_domain",
    "expected_categories": ["pricing", "support"],
    "difficulty": "hard",
    "description": "why this is challenging"
  }}
]

IMPORTANT: Return ONLY the JSON array, no other text."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()

            # Extract JSON from response (handle markdown code blocks)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            queries_data = json.loads(result_text)

            # Convert to AdversarialQuery objects
            queries = [
                AdversarialQuery(
                    query=q["query"],
                    type=q["type"],
                    expected_categories=q["expected_categories"],
                    difficulty=q["difficulty"],
                    description=q["description"],
                )
                for q in queries_data
            ]

            print(f"✓ Generated {len(queries)} adversarial queries")
            return queries

        except Exception as e:
            print(f"⚠ Gemini generation failed: {e}")
            # Fallback to hand-crafted queries
            return self._fallback_queries()

    def _build_knowledge_base_summary(self) -> str:
        """Build a summary of the knowledge base for Gemini"""
        summary = []
        for category in self.categories:
            docs_in_category = [d for d in self.documents if d["category"] == category]
            doc_titles = [d["title"] for d in docs_in_category]
            summary.append(f"- {category}: {', '.join(doc_titles)}")

        return "\n".join(summary)

    def _fallback_queries(self) -> List[AdversarialQuery]:
        """
        Fallback hand-crafted queries if Gemini fails.

        WHY: Demo must never fail. Always have a backup.
        """
        return [
            AdversarialQuery(
                query="How does our enterprise pricing affect support response times?",
                type="cross_domain",
                expected_categories=["pricing", "support"],
                difficulty="hard",
                description="Combines pricing and support - tests cross-domain retrieval",
            ),
            AdversarialQuery(
                query="If I return an item after the refund period, what are my options?",
                type="edge_case",
                expected_categories=["policy"],
                difficulty="medium",
                description="Tests edge case outside normal refund policy",
            ),
            AdversarialQuery(
                query="What security features are included in the standard pricing tier?",
                type="cross_domain",
                expected_categories=["security", "pricing"],
                difficulty="hard",
                description="Requires correlating security features with pricing tiers",
            ),
            AdversarialQuery(
                query="Can I use the API if I'm on the basic plan?",
                type="multi_hop",
                expected_categories=["technical", "pricing"],
                difficulty="medium",
                description="Requires understanding both API availability and plan limitations",
            ),
            AdversarialQuery(
                query="How fast can enterprise customers get refunds processed?",
                type="multi_hop",
                expected_categories=["pricing", "policy"],
                difficulty="hard",
                description="Combines enterprise tier benefits with refund processing",
            ),
            AdversarialQuery(
                query="What happens if my international shipment gets delayed during the refund window?",
                type="edge_case",
                expected_categories=["logistics", "policy"],
                difficulty="hard",
                description="Tests intersection of shipping delays and refund timing",
            ),
            AdversarialQuery(
                query="Do enterprise customers get better data security than standard users?",
                type="cross_domain",
                expected_categories=["pricing", "security"],
                difficulty="medium",
                description="Tests if security features vary by pricing tier",
            ),
            AdversarialQuery(
                query="Can I integrate with Slack if I only have API access on the basic plan?",
                type="multi_hop",
                expected_categories=["product", "technical", "pricing"],
                difficulty="hard",
                description="Requires correlating integrations, API access, and plan features",
            ),
        ]


class WeaknessAnalyzer:
    """
    Analyzes test failures using Gemini to understand WHY they failed
    and suggest improvements.
    """

    def __init__(self):
        try:
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
            self.gemini_available = True
        except Exception as e:
            print(f"⚠ Gemini unavailable for weakness analysis: {e}")
            self.gemini_available = False

    def analyze_failure(
        self, query: str, confidence: float, answer: str, docs: List[Dict]
    ) -> Dict[str, str]:
        """
        Use Gemini to analyze why a query had low confidence.

        Returns:
            Dict with 'weakness' and 'recommendation' keys
        """
        if not self.gemini_available:
            return {
                "weakness": "Low confidence detected - insufficient context or ambiguous query",
                "recommendation": "Consider adding more documents or refining retrieval strategy",
            }

        doc_summary = "\n".join(
            [f"- {doc['title']} (category: {doc.get('category', 'unknown')})" for doc in docs]
        )

        prompt = f"""You are analyzing a RAG system failure. A query had low confidence, indicating potential weakness.

Query: "{query}"
Confidence Score: {confidence:.2f} (below threshold of 0.85)
Answer Generated: {answer[:200]}...

Documents Retrieved:
{doc_summary}

Analyze:
1. Why might this query have low confidence?
2. What specific improvements would help?

Provide a response in this JSON format:
{{
  "weakness": "brief explanation of the weakness",
  "recommendation": "specific actionable recommendation"
}}

Return ONLY the JSON, no other text."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()

            # Extract JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            analysis = json.loads(result_text)
            return analysis

        except Exception as e:
            print(f"⚠ Gemini analysis failed: {e}")
            return {
                "weakness": "Low confidence detected - insufficient context or ambiguous query",
                "recommendation": "Consider adding more documents or refining retrieval strategy",
            }


class AdversarialTester:
    """
    Runs adversarial tests and generates comprehensive reports.

    This is the main interface for the adversarial testing system.
    """

    def __init__(self, orchestrator):
        """
        Args:
            orchestrator: The MaestroOrchestrator instance to test
        """
        self.orchestrator = orchestrator
        self.generator = AdversarialQueryGenerator(orchestrator.vector_db)
        self.analyzer = WeaknessAnalyzer()

        # Cache generated queries
        self._challenge_queries = None

    def get_challenge_queries(self, regenerate: bool = False) -> List[AdversarialQuery]:
        """
        Get adversarial challenge queries (cached).

        Args:
            regenerate: Force regeneration of queries

        Returns:
            List of adversarial queries
        """
        if self._challenge_queries is None or regenerate:
            self._challenge_queries = self.generator.generate_challenge_queries()

        return self._challenge_queries

    def run_test(self, query: str) -> TestResult:
        """
        Run a single adversarial test.

        Args:
            query: The test query to run

        Returns:
            TestResult with pass/fail and analysis
        """
        # Run query through orchestrator
        result = self.orchestrator.process_query(query)

        # Determine if test passed (high confidence)
        passed = result["confidence"] >= 0.85
        confidence = result["confidence"]

        # If failed (low confidence), analyze why
        weakness = None
        recommendation = None

        if not passed:
            analysis = self.analyzer.analyze_failure(
                query=query,
                confidence=confidence,
                answer=result["answer"],
                docs=result["documents"],
            )
            weakness = analysis.get("weakness")
            recommendation = analysis.get("recommendation")

        return TestResult(
            query=query,
            passed=passed,
            confidence=confidence,
            actual_answer=result["answer"],
            retrieved_docs=result["documents"],
            weakness_detected=weakness,
            recommendation=recommendation,
        )

    def run_full_suite(self) -> Dict[str, Any]:
        """
        Run all adversarial tests and generate comprehensive report.

        Returns:
            Dict with test results, statistics, and recommendations
        """
        print("🔥 Running full adversarial test suite...")

        queries = self.get_challenge_queries()
        results = []

        for query in queries:
            print(f"  Testing: {query.query[:60]}...")
            test_result = self.run_test(query.query)
            results.append(
                {
                    "query": query.query,
                    "type": query.type,
                    "difficulty": query.difficulty,
                    "description": query.description,
                    "passed": test_result.passed,
                    "confidence": test_result.confidence,
                    "weakness": test_result.weakness_detected,
                    "recommendation": test_result.recommendation,
                }
            )

        # Calculate statistics
        total = len(results)
        passed = len([r for r in results if r["passed"]])
        failed = total - passed
        pass_rate = (passed / total) * 100 if total > 0 else 0

        # Group failures by type
        failures_by_type = {}
        for r in results:
            if not r["passed"]:
                test_type = r["type"]
                if test_type not in failures_by_type:
                    failures_by_type[test_type] = []
                failures_by_type[test_type].append(r)

        report = {
            "summary": {
                "total_tests": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": pass_rate,
            },
            "results": results,
            "weaknesses_detected": [r for r in results if not r["passed"]],
            "failures_by_type": failures_by_type,
            "recommendations": [r["recommendation"] for r in results if r["recommendation"]],
        }

        print(f"✓ Suite complete: {passed}/{total} passed ({pass_rate:.1f}%)")

        return report
