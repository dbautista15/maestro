"""
Test script to verify everything works before demo.
Run this multiple times to pre-warm cache.
"""

import requests
import time

API_URL = "http://localhost:8000"

# Demo queries (use these in presentation)
DEMO_QUERIES = [
    "What is your refund policy?",  # Should be fast after first query
    "How does shipping work?",
    "Tell me about enterprise pricing",
    "What are your support hours?",
    "Explain your security and compliance",
]


def test_query(query: str, strategy: str = None):
    """Test a single query"""
    print(f"\n{'='*60}")
    print(f"Query: {query}")
    print(f"Strategy: {strategy or 'auto'}")
    print("=" * 60)

    start = time.time()

    response = requests.post(
        f"{API_URL}/api/query", json={"query": query, "strategy": strategy}
    )

    elapsed = time.time() - start

    if response.status_code == 200:
        data = response.json()
        print(f" Success ({elapsed*1000:.0f}ms total)")
        print(f"   Source: {data['source']}")
        print(f"   Strategy: {data['strategy']}")
        print(f"   Cost: ${data['cost']:.4f}")
        print(f"   Latency: {data['latency_ms']:.0f}ms")
        print(f"   Confidence: {data['confidence']:.2f}")
        print(f"   Documents: {data['num_documents_retrieved']}")
        print(f"   Answer: {data['answer'][:100]}...")
    else:
        print(f" Error: {response.status_code}")
        print(response.text)


def test_metrics():
    """Test metrics endpoint"""
    print(f"\n{'='*60}")
    print("METRICS")
    print("=" * 60)

    response = requests.get(f"{API_URL}/api/metrics")
    if response.status_code == 200:
        data = response.json()
        print(f"Total queries: {data['total_queries']}")
        print(f"Cache hit rate: {data['cache_hit_rate']*100:.1f}%")
        print(f"Avg cost: ${data['avg_cost']:.4f}")
        print(f"Total cost: ${data['total_cost']:.2f}")
        print(f"Cost saved: ${data['cost_saved']:.2f}")


def run_demo_prep():
    """Run all demo queries to pre-warm cache"""
    print("🚀 Starting demo prep...")
    print("This will pre-warm the cache for smooth demo\n")

    # Run each query twice
    # First time: cache miss
    # Second time: cache hit (shows the value)
    for query in DEMO_QUERIES:
        test_query(query)
        time.sleep(0.5)  # Brief pause

    print("\n" + "=" * 60)
    print("Running queries again to demonstrate cache hits...")
    print("=" * 60)

    for query in DEMO_QUERIES[:3]:  # Just first 3
        test_query(query)
        time.sleep(0.5)

    # Show final metrics
    test_metrics()

    print("\n Demo prep complete!")
    print("Cache is warm, system is ready for presentation")


if __name__ == "__main__":
    run_demo_prep()
