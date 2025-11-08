"""
Mock vector database adapter that simulates Pinecone/Weaviate.
In production, this would be swapped for real vector DB client.
"""

import numpy as np
import json
import time
from typing import List, Dict
from sentence_transformers import SentenceTransformer


class MockVectorDB:
    """
    Simulates a vector database for demo purposes.

    WHY: We're demonstrating the orchestration layer, not building
    a vector DB. This mock lets us show realistic behavior without
    external dependencies that could fail during demo.
    """

    def __init__(self, data_path: str = "data"):
        """Load pre-computed embeddings and documents"""
        print("Initializing MockVectorDB...")

        # Load documents
        with open(f"{data_path}/documents.json", "r") as f:
            self.documents = json.load(f)

        # Load pre-computed embeddings
        self.embeddings = np.load(f"{data_path}/embeddings.npy")

        # Load embedding model (for query embedding)
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

        print(f" Loaded {len(self.documents)} documents")

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Simulate vector search with realistic latency.

        Args:
            query: User's search query
            top_k: Number of results to return

        Returns:
            List of documents with similarity scores
        """
        # Simulate network latency (real vector DB has this)
        # Remove this in production, but keeps demo realistic
        time.sleep(0.05 + (top_k * 0.01))  # 50-150ms depending on k

        # Embed the query
        query_embedding = self.embedder.encode(query)

        # Compute cosine similarity
        # This is the actual vector search math
        similarities = np.dot(self.embeddings, query_embedding) / (
            np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        )

        # Get top-k indices
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        # Return documents with scores
        results = []
        for idx in top_indices:
            doc = self.documents[idx].copy()
            doc["similarity_score"] = float(similarities[idx])
            results.append(doc)

        return results

    def health_check(self) -> Dict:
        """Simulate health check endpoint"""
        return {
            "status": "healthy",
            "num_documents": len(self.documents),
            "embedding_dim": self.embeddings.shape[1],
        }


class PineconeAdapter:
    """
    Real Pinecone adapter (if you want to show multi-provider support).
    In demo, you'd use MockVectorDB, but this shows you could swap it.
    """

    def __init__(self, api_key: str, environment: str, index_name: str):
        """
        Initialize Pinecone client.

        NOTE: For hackathon, don't implement this fully unless you have
        time. The mock is sufficient to prove the concept.
        """
        # from pinecone import Pinecone
        # self.client = Pinecone(api_key=api_key, environment=environment)
        # self.index = self.client.Index(index_name)
        pass

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search Pinecone index"""
        # query_embedding = embed(query)
        # results = self.index.query(vector=query_embedding, top_k=top_k)
        # return results
        pass
