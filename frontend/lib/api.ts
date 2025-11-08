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

export interface QueryTimeSeriesDataPoint {
  timestamp: number;
  queries: number;
}

export interface CacheHitRateTimeSeriesDataPoint {
  timestamp: number;
  hitRate: number;
  totalQueries: number;
}

export interface AvgCostTimeSeriesDataPoint {
  timestamp: number;
  avgCost: number;
  queryCount: number;
}

export interface AvgLatencyTimeSeriesDataPoint {
  timestamp: number;
  avgLatency: number;
  queryCount: number;
}

export interface CumulativeCostTimeSeriesDataPoint {
  timestamp: number;
  naiveCost: number;
  actualCost: number;
  saved: number;
  queryCount: number;
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
   * Get time-series data for query volume (non-cumulative)
   */
  async getQueryTimeSeries(bucketSeconds: number = 60, numBuckets: number = 20): Promise<QueryTimeSeriesDataPoint[]> {
    const response = await api.get(`/api/metrics/timeseries/queries?bucket_seconds=${bucketSeconds}&num_buckets=${numBuckets}`);
    const data = response.data.data;

    return data.map((point: any) => ({
      timestamp: point.timestamp,
      queries: point.queries,
    }));
  },

  /**
   * Get time-series data for cache hit rate
   */
  async getCacheHitRateTimeSeries(bucketSeconds: number = 60, numBuckets: number = 20): Promise<CacheHitRateTimeSeriesDataPoint[]> {
    const response = await api.get(`/api/metrics/timeseries/cache-hit-rate?bucket_seconds=${bucketSeconds}&num_buckets=${numBuckets}`);
    const data = response.data.data;

    return data.map((point: any) => ({
      timestamp: point.timestamp,
      hitRate: point.hit_rate ?? point.hitRate,
      totalQueries: point.total_queries ?? point.totalQueries,
    }));
  },

  /**
   * Get time-series data for average cost per query
   */
  async getAvgCostTimeSeries(bucketSeconds: number = 60, numBuckets: number = 20): Promise<AvgCostTimeSeriesDataPoint[]> {
    const response = await api.get(`/api/metrics/timeseries/avg-cost?bucket_seconds=${bucketSeconds}&num_buckets=${numBuckets}`);
    const data = response.data.data;

    return data.map((point: any) => ({
      timestamp: point.timestamp,
      avgCost: point.avg_cost ?? point.avgCost,
      queryCount: point.query_count ?? point.queryCount,
    }));
  },

  /**
   * Get time-series data for average response time (latency)
   */
  async getAvgLatencyTimeSeries(bucketSeconds: number = 60, numBuckets: number = 20): Promise<AvgLatencyTimeSeriesDataPoint[]> {
    const response = await api.get(`/api/metrics/timeseries/avg-latency?bucket_seconds=${bucketSeconds}&num_buckets=${numBuckets}`);
    const data = response.data.data;

    return data.map((point: any) => ({
      timestamp: point.timestamp,
      avgLatency: point.avg_latency ?? point.avgLatency,
      queryCount: point.query_count ?? point.queryCount,
    }));
  },

  /**
   * Get time-series data for cumulative cost comparison (naive vs actual)
   */
  async getCumulativeCostTimeSeries(bucketSeconds: number = 60, numBuckets: number = 20): Promise<CumulativeCostTimeSeriesDataPoint[]> {
    const response = await api.get(`/api/metrics/timeseries/cumulative-cost?bucket_seconds=${bucketSeconds}&num_buckets=${numBuckets}`);
    const data = response.data.data;

    return data.map((point: any) => ({
      timestamp: point.timestamp,
      naiveCost: point.naive_cost ?? point.naiveCost,
      actualCost: point.actual_cost ?? point.actualCost,
      saved: point.saved,
      queryCount: point.query_count ?? point.queryCount,
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

// ========== ADVERSARIAL TESTING API ==========

export interface ChallengeQuery {
  query: string;
  type: string;
  expectedCategories: string[];
  difficulty: string;
  description: string;
}

export interface TestResult {
  query: string;
  passed: boolean;
  confidence: number;
  weakness: string | null;
  recommendation: string | null;
}

export interface AdversarialReport {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  results: Array<{
    query: string;
    type: string;
    difficulty: string;
    description: string;
    passed: boolean;
    confidence: number;
    weakness: string | null;
    recommendation: string | null;
  }>;
  weaknessesDetected: Array<any>;
  failuresByType: Record<string, any[]>;
  recommendations: string[];
}

export const adversarialAPI = {
  /**
   * Get AI-generated challenge queries
   */
  async getChallenges(regenerate: boolean = false): Promise<ChallengeQuery[]> {
    const response = await api.get(`/api/adversarial/challenges?regenerate=${regenerate}`);
    const data = response.data;

    return data.challenges.map((c: any) => ({
      query: c.query,
      type: c.type,
      expectedCategories: c.expected_categories ?? c.expectedCategories,
      difficulty: c.difficulty,
      description: c.description,
    }));
  },

  /**
   * Run a single adversarial test
   */
  async runTest(query: string): Promise<TestResult> {
    const response = await api.post('/api/adversarial/test', { query });
    return response.data;
  },

  /**
   * Run full adversarial test suite and get report
   * Note: This can take 30-60 seconds
   */
  async getReport(): Promise<AdversarialReport> {
    const response = await api.get('/api/adversarial/report', {
      timeout: 120000, // 2 minutes for full suite
    });
    const data = response.data;

    return {
      summary: {
        totalTests: data.summary.total_tests ?? data.summary.totalTests,
        passed: data.summary.passed,
        failed: data.summary.failed,
        passRate: data.summary.pass_rate ?? data.summary.passRate,
      },
      results: data.results,
      weaknessesDetected: data.weaknesses_detected ?? data.weaknessesDetected,
      failuresByType: data.failures_by_type ?? data.failuresByType,
      recommendations: data.recommendations,
    };
  },

  /**
   * Check adversarial system health
   */
  async healthCheck(): Promise<{
    status: string;
    geminiApi: string;
    cachedQueries: number;
    message: string;
  }> {
    const response = await api.get('/api/adversarial/health');
    const data = response.data;

    return {
      status: data.status,
      geminiApi: data.gemini_api ?? data.geminiApi,
      cachedQueries: data.cached_queries ?? data.cachedQueries,
      message: data.message,
    };
  },
};

export default api;
