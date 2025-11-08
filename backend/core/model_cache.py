"""
Singleton model cache to avoid re-downloading models.
Speeds up cold starts significantly.
"""

from sentence_transformers import SentenceTransformer


class ModelCache:
    """
    Singleton to cache expensive model loads.

    WHY: SentenceTransformer downloads ~120MB on first load.
    Loading once and reusing saves 10-30 seconds per cold start.
    """
    _instance = None
    _embedder = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelCache, cls).__new__(cls)
        return cls._instance

    def get_embedder(self):
        """Get or create the sentence transformer model"""
        if self._embedder is None:
            print("Loading SentenceTransformer model (this may take 10-30s on first run)...")
            self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
            print("✓ Model loaded and cached")
        return self._embedder


# Global instance
model_cache = ModelCache()
