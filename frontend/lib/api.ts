import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (some queries might be slow)
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
   */
  async process(request: QueryRequest): Promise<QueryResponse> {
    const response = await api.post('/api/query', request);
    return response.data;
  },

  /**
   * Get current metrics for dashboard
   */
  async getMetrics(): Promise<Metrics> {
    const response = await api.get('/api/metrics');
    return response.data;
  },

  /**
   * Get recent queries for audit trail
   */
  async getRecentQueries(limit: number = 10): Promise<RecentQuery[]> {
    const response = await api.get(`/api/recent-queries?limit=${limit}`);
    return response.data.queries;
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
