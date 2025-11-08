"""
Prepare demo data that simulates an enterprise knowledge base.
We're creating a fake company's documentation.
"""

import json
import numpy as np
from sentence_transformers import SentenceTransformer

# Fake company documents (10-20 is enough for demo)
DEMO_DOCUMENTS = [
    {
        "id": "doc_001",
        "title": "Refund Policy 2024",
        "content": """Our refund policy allows customers to return products within 30 days 
        of purchase for a full refund. Items must be in original condition with tags attached. 
        Refunds are processed within 5-7 business days to the original payment method.""",
        "category": "policy",
        "last_updated": "2024-01-15",
    },
    {
        "id": "doc_002",
        "title": "Shipping Information",
        "content": """We ship orders within 2-3 business days via FedEx or UPS. 
        Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available 
        for an additional fee. International shipping is available to most countries.""",
        "category": "logistics",
        "last_updated": "2024-02-01",
    },
    {
        "id": "doc_003",
        "title": "Enterprise Pricing Model",
        "content": """Our enterprise pricing starts at $10,000 per year for up to 50 users. 
        Volume discounts are available for organizations with 100+ users. Enterprise plans 
        include priority support, dedicated account manager, and custom integrations. 
        We offer annual and multi-year contract options.""",
        "category": "pricing",
        "last_updated": "2024-01-20",
    },
    {
        "id": "doc_004",
        "title": "Technical Support Guidelines",
        "content": """Technical support is available 24/7 for enterprise customers. 
        Standard support hours are Monday-Friday 9am-5pm EST. Submit tickets via our 
        support portal or email support@company.com. Average response time is 4 hours 
        for critical issues, 24 hours for standard requests.""",
        "category": "support",
        "last_updated": "2024-02-10",
    },
    {
        "id": "doc_005",
        "title": "Data Security and Compliance",
        "content": """We are SOC 2 Type II certified and GDPR compliant. All data is 
        encrypted at rest and in transit using AES-256 and TLS 1.3. We conduct annual 
        penetration testing and maintain comprehensive audit logs. Customer data is 
        stored in geographically distributed data centers.""",
        "category": "security",
        "last_updated": "2024-01-05",
    },
    {
        "id": "doc_006",
        "title": "Product Features Overview",
        "content": """Our platform offers real-time collaboration, version control, 
        and advanced analytics. Key features include: automated workflows, customizable 
        dashboards, API access, role-based permissions, and integration with 50+ tools 
        including Slack, Salesforce, and Google Workspace.""",
        "category": "product",
        "last_updated": "2024-02-15",
    },
    {
        "id": "doc_007",
        "title": "API Documentation",
        "content": """Our REST API uses standard HTTP methods and returns JSON responses. 
        Authentication uses OAuth 2.0 or API keys. Rate limits are 1000 requests per hour 
        for standard plans, 10000 for enterprise. Complete API reference available at 
        docs.company.com/api. SDKs available for Python, JavaScript, and Java.""",
        "category": "technical",
        "last_updated": "2024-01-25",
    },
    {
        "id": "doc_008",
        "title": "Onboarding Process",
        "content": """New customer onboarding takes 2-4 weeks. Includes initial consultation, 
        data migration, team training, and configuration. Dedicated onboarding specialist 
        assigned to each enterprise customer. Training includes live sessions and 
        recorded materials. Post-launch support for 90 days.""",
        "category": "operations",
        "last_updated": "2024-02-05",
    },
    {
        "id": "doc_009",
        "title": "Service Level Agreement (SLA)",
        "content": """We guarantee 99.9% uptime for enterprise customers. Scheduled 
        maintenance windows are announced 7 days in advance. In case of outage, credits 
        are provided: 10% for 99.5-99.9% uptime, 25% for 99-99.5%, 50% for below 99%. 
        Real-time status available at status.company.com.""",
        "category": "legal",
        "last_updated": "2024-01-10",
    },
    {
        "id": "doc_010",
        "title": "Integration Capabilities",
        "content": """Native integrations with major CRM, ERP, and collaboration tools. 
        Zapier support for 1000+ apps. Webhook support for custom integrations. 
        Enterprise customers can request custom integrations as part of their contract. 
        Integration setup typically takes 1-3 days.""",
        "category": "technical",
        "last_updated": "2024-02-20",
    },
]


def prepare_demo_data():
    """
    Pre-compute embeddings for all documents.
    This makes demo fast - no API calls during presentation.
    """
    print("Loading embedding model...")
    # Using a small, fast model that runs locally
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    print(f"Processing {len(DEMO_DOCUMENTS)} documents...")

    # Extract content for embedding
    contents = [doc["content"] for doc in DEMO_DOCUMENTS]

    # Compute embeddings (this takes ~10 seconds)
    print("Computing embeddings...")
    embeddings = embedder.encode(contents, show_progress_bar=True)

    # Save documents as JSON
    print("Saving documents...")
    with open("data/documents.json", "w") as f:
        json.dump(DEMO_DOCUMENTS, f, indent=2)

    # Save embeddings as numpy array
    print("Saving embeddings...")
    np.save("data/embeddings.npy", embeddings)

    # Save model info
    metadata = {
        "model": "all-MiniLM-L6-v2",
        "embedding_dim": embeddings.shape[1],
        "num_documents": len(DEMO_DOCUMENTS),
        "created_at": "2024-11-07",
    }
    with open("data/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n Demo data prepared!")
    print(f"   Documents: {len(DEMO_DOCUMENTS)}")
    print(f"   Embedding dimension: {embeddings.shape[1]}")
    print(f"   Total size: {embeddings.nbytes / 1024:.2f} KB")


if __name__ == "__main__":
    prepare_demo_data()
