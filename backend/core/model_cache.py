"""
Singleton model cache to avoid re-downloading models.
Speeds up cold starts significantly.
"""

import os
from sentence_transformers import SentenceTransformer


class ModelCache:
    """
    Singleton to cache expensive model loads.

    WHY: SentenceTransformer downloads ~120MB on first load.
    Loading once and reusing saves 10-30 seconds per cold start.

    Railway persistence: Model is saved to ./models/ directory which
    persists between deploys but not between container restarts.
    Still faster than re-downloading from HuggingFace.
    """
    _instance = None
    _embedder = None
    _model_path = "./models/sentence-transformer"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelCache, cls).__new__(cls)
        return cls._instance

    def get_embedder(self):
        """Get or create the sentence transformer model"""
        if self._embedder is None:
            # Check if model exists locally
            if os.path.exists(self._model_path):
                print(f"Loading cached model from {self._model_path}...")
                self._embedder = SentenceTransformer(self._model_path)
                print("✓ Cached model loaded (fast startup)")
            else:
                print("Downloading SentenceTransformer model (first run, ~10-30s)...")
                self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
                # Save for next time
                os.makedirs(os.path.dirname(self._model_path), exist_ok=True)
                self._embedder.save(self._model_path)
                print(f"✓ Model downloaded and cached to {self._model_path}")
        return self._embedder


# Global instance
model_cache = ModelCache()
