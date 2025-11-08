import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds (handles cold starts when backend wakes up + model loading)
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface QueryRequest {
  query: string;
  strategy?: 'fast' | 'balanced' | 'comprehensive';
  useCache?: boolean;
}

export interface Document {
  id: string;
  title: string;
  category?: string;
  similarityScore: number;
  contentPreview: string;
}

export interface QueryResponse {
  answer: string;
  documents: Document[];
  confidence: number;
  cost: number;
  latency: number;
  source: 'CACHE' | 'RETRIEVAL';
  strategy: string;
  complexity: string;
  numDocumentsRetrieved?: number;
  cacheSimilarity?: number;
  originalQuery?: string;
  hitCount?: number;
}

export interface Metrics {
  totalQueries: number;
  cacheHitRate: number;
  avgCost: number;
  avgLatency: number;
  totalCost: number;
  costSaved: number;
  breakdownByStrategy?: Record<string, number>;
  cacheSize?: number;
}

export interface RecentQuery {
  timestamp: number;
  query: string;
  source: string;
  strategy: string;
  latency: number;
  cost: number;
  confidence: number;
}

export const queryAPI = {
  /**
   * Submit a query to the orchestrator
   * Retries once on timeout (for cold starts)
   */
  async process(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await api.post('/api/query', request);
      const data = response.data;

      // Transform snake_case to camelCase
      return {
        answer: data.answer,
        documents: data.documents.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          similarityScore: doc.similarity_score ?? doc.similarityScore,
          contentPreview: doc.content_preview ?? doc.contentPreview,
        })),
        confidence: data.confidence,
        cost: data.cost,
        latency: data.latency_ms ?? data.latency, // Backend sends latency_ms
        source: data.source,
        strategy: data.strategy,
        complexity: data.complexity,
        numDocumentsRetrieved: data.num_documents_retrieved ?? data.numDocumentsRetrieved,
        cacheSimilarity: data.cache_similarity ?? data.cacheSimilarity,
        originalQuery: data.original_query ?? data.originalQuery,
        hitCount: data.hit_count ?? data.hitCount,
      };
    } catch (error: any) {
      // If timeout on first attempt (cold start), retry once
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        console.log('First request timed out (likely cold start), retrying...');
        const response = await api.post('/api/query', request);
        const data = response.data;

        return {
          answer: data.answer,
          documents: data.documents.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            category: doc.category,
            similarityScore: doc.similarity_score ?? doc.similarityScore,
            contentPreview: doc.content_preview ?? doc.contentPreview,
          })),
          confidence: data.confidence,
          cost: data.cost,
          latency: data.latency_ms ?? data.latency,
          source: data.source,
          strategy: data.strategy,
          complexity: data.complexity,
          numDocumentsRetrieved: data.num_documents_retrieved ?? data.numDocumentsRetrieved,
          cacheSimilarity: data.cache_similarity ?? data.cacheSimilarity,
          originalQuery: data.original_query ?? data.originalQuery,
          hitCount: data.hit_count ?? data.hitCount,
        };
      }
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Get current metrics for dashboard
   */
  async getMetrics(): Promise<Metrics> {
    const response = await api.get('/api/metrics');
    const data = response.data;

    // Transform snake_case to camelCase
    return {
      totalQueries: data.total_queries ?? data.totalQueries ?? 0,
      cacheHitRate: data.cache_hit_rate ?? data.cacheHitRate ?? 0,
      avgCost: data.avg_cost ?? data.avgCost ?? 0,
      avgLatency: data.avg_latency_ms ?? data.avgLatency ?? 0, // Backend sends avg_latency_ms
      totalCost: data.total_cost ?? data.totalCost ?? 0,
      costSaved: data.cost_saved ?? data.costSaved ?? 0,
      breakdownByStrategy: data.breakdown_by_strategy ?? data.breakdownByStrategy,
      cacheSize: data.cache_size ?? data.cacheSize,
    };
  },

  /**
   * Get recent queries for audit trail
   */
  async getRecentQueries(limit: number = 10): Promise<RecentQuery[]> {
    const response = await api.get(`/api/recent-queries?limit=${limit}`);
    const queries = response.data.queries;

    // Transform snake_case to camelCase
    return queries.map((q: any) => ({
      timestamp: q.timestamp,
      query: q.query,
      source: q.source,
      strategy: q.strategy,
      latency: q.latency_ms ?? q.latency, // Backend sends latency_ms
      cost: q.cost,
      confidence: q.confidence,
    }));
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await api.get('/api/health');
    return response.data;
  },
};

export default api;
