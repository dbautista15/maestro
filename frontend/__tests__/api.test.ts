/**
 * Frontend integration tests for Maestro API client.
 * Tests API integration, response handling, and error scenarios.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import api, { queryAPI } from '../lib/api';
import type { QueryResponse, Metrics, RecentQuery } from '../lib/api';

// Note: These are TypeScript/Jest tests for the API client
// In a real project, you'd also have component tests

describe('QueryAPI', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Create a new mock adapter before each test
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    // Restore the original adapter after each test
    mock.restore();
  });

  // Mock response from backend (snake_case format)
  const mockBackendResponse = {
    answer: '30 days for full refund',
    documents: [
      {
        id: 'doc_001',
        title: 'Refund Policy',
        category: 'policy',
        similarity_score: 0.95,  // Backend uses snake_case
        content_preview: 'Our refund policy allows...',
      },
    ],
    confidence: 0.95,
    cost: 0.01,
    latency_ms: 150.0,  // Backend sends latency_ms
    source: 'RETRIEVAL',
    strategy: 'fast',
    complexity: 'simple',
    num_documents_retrieved: 1,
  };

  // Expected frontend response (camelCase format)
  const mockResponse: QueryResponse = {
    answer: '30 days for full refund',
    documents: [
      {
        id: 'doc_001',
        title: 'Refund Policy',
        category: 'policy',
        similarityScore: 0.95,
        contentPreview: 'Our refund policy allows...',
      },
    ],
    confidence: 0.95,
    cost: 0.01,
    latency: 150.0,
    source: 'RETRIEVAL',
    strategy: 'fast',
    complexity: 'simple',
    numDocumentsRetrieved: 1,
  };

  // Mock metrics from backend (snake_case format)
  const mockBackendMetrics = {
    total_queries: 5,
    cache_hit_rate: 0.6,
    avg_cost: 0.0042,
    avg_latency_ms: 125.5,  // Backend sends avg_latency_ms
    total_cost: 0.021,
    cost_saved: 0.063,
    breakdown_by_strategy: { fast: 2, balanced: 2, comprehensive: 1 },
    cache_size: 3,
  };

  // Expected frontend metrics (camelCase format)
  const mockMetrics: Metrics = {
    totalQueries: 5,
    cacheHitRate: 0.6,
    avgCost: 0.0042,
    avgLatency: 125.5,
    totalCost: 0.021,
    costSaved: 0.063,
    breakdownByStrategy: { fast: 2, balanced: 2, comprehensive: 1 },
    cacheSize: 3,
  };

  // ============================================================================
  // Query Processing Tests
  // ============================================================================

  describe('process', () => {
    it('should process query successfully', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const request = { query: 'What is your refund policy?' };
      const result = await queryAPI.process(request);

      expect(result.answer).toBe(mockResponse.answer);
      expect(result.source).toBe('RETRIEVAL');
      expect(result.confidence).toBe(0.95);
      expect(result.latency).toBe(150.0);  // Verify transformation from latency_ms
    });

    it('should process query with strategy override', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const request = { query: 'What is your refund policy?', strategy: 'fast' as const };
      const result = await queryAPI.process(request);

      expect(result.answer).toBeTruthy();
    });

    it('should call correct API endpoint', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const request = { query: 'Test query' };
      await queryAPI.process(request);

      expect(mock.history.post.length).toBe(1);
      expect(mock.history.post[0].url).toBe('/api/query');
    });

    it('should handle API errors', async () => {
      mock.onPost('/api/query').networkError();

      const request = { query: 'What is your refund policy?' };

      await expect(queryAPI.process(request)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mock.onPost('/api/query').timeout();

      const request = { query: 'What is your refund policy?' };

      await expect(queryAPI.process(request)).rejects.toThrow();
    });

    it('should return correct response types', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const result = await queryAPI.process({ query: 'Test' });

      expect(typeof result.answer).toBe('string');
      expect(Array.isArray(result.documents)).toBe(true);
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.cost).toBe('number');
      expect(typeof result.latency).toBe('number');
      expect(typeof result.source).toBe('string');
    });

    it('should validate document structure', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const result = await queryAPI.process({ query: 'Test' });

      result.documents.forEach((doc) => {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('similarityScore');
        expect(doc).toHaveProperty('contentPreview');
      });
    });

    it('should handle empty query', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const result = await queryAPI.process({ query: '' });
      expect(result).toBeTruthy();
    });

    it('should handle very long query', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const longQuery = 'a'.repeat(10000);
      const result = await queryAPI.process({ query: longQuery });
      expect(result).toBeTruthy();
    });

    it('should handle special characters in query', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const query = 'What is your refund policy? 🚀 @#$%^&*()';
      const result = await queryAPI.process({ query });
      expect(result).toBeTruthy();
    });

    it('should handle multiple concurrent queries', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const queries = [
        { query: 'What is refund policy?' },
        { query: 'Tell me about shipping' },
        { query: 'Explain pricing' },
      ];

      const results = await Promise.all(queries.map((q) => queryAPI.process(q)));

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.answer)).toBe(true);
    });

    it('should send request with correct structure', async () => {
      mock.onPost('/api/query').reply(200, mockBackendResponse);

      const request = {
        query: 'What is refund policy?',
        strategy: 'fast' as const,
        useCache: true,
      };

      await queryAPI.process(request);

      expect(mock.history.post.length).toBe(1);
      expect(JSON.parse(mock.history.post[0].data)).toEqual(request);
    });
  });

  // ============================================================================
  // Metrics Endpoint Tests
  // ============================================================================

  describe('getMetrics', () => {
    it('should retrieve metrics successfully', async () => {
      mock.onGet('/api/metrics').reply(200, mockBackendMetrics);

      const result = await queryAPI.getMetrics();

      expect(result.totalQueries).toBe(5);
      expect(result.cacheHitRate).toBe(0.6);
      expect(result.totalCost).toBe(0.021);
      expect(result.avgLatency).toBe(125.5);  // Verify transformation from avg_latency_ms
    });

    it('should call correct metrics endpoint', async () => {
      mock.onGet('/api/metrics').reply(200, mockBackendMetrics);

      await queryAPI.getMetrics();

      expect(mock.history.get.length).toBe(1);
      expect(mock.history.get[0].url).toBe('/api/metrics');
    });

    it('should have all required metrics fields', async () => {
      mock.onGet('/api/metrics').reply(200, mockBackendMetrics);

      const result = await queryAPI.getMetrics();

      const requiredFields = [
        'totalQueries',
        'cacheHitRate',
        'avgCost',
        'avgLatency',
        'totalCost',
        'costSaved',
      ];

      requiredFields.forEach((field) => {
        expect(result).toHaveProperty(field);
      });
    });
  });

  // ============================================================================
  // Recent Queries (Audit Trail) Tests
  // ============================================================================

  describe('getRecentQueries', () => {
    it('should retrieve recent queries successfully', async () => {
      // Backend returns snake_case format
      const mockBackendQueries = {
        queries: [
          {
            timestamp: 1699000000,
            query: 'What is refund policy?',
            source: 'CACHE',
            strategy: 'fast',
            latency_ms: 5.0,  // Backend sends latency_ms
            cost: 0.0001,
            confidence: 0.95,
          },
          {
            timestamp: 1699000100,
            query: 'Tell me about shipping',
            source: 'RETRIEVAL',
            strategy: 'balanced',
            latency_ms: 150.0,  // Backend sends latency_ms
            cost: 0.007,
            confidence: 0.88,
          },
        ],
      };

      mock.onGet(/\/api\/recent-queries\?limit=10/).reply(200, mockBackendQueries);

      const result = await queryAPI.getRecentQueries(10);

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('What is refund policy?');
      expect(result[0].source).toBe('CACHE');
      expect(result[0].latency).toBe(5.0);  // Verify transformation from latency_ms
    });

    it('should respect limit parameter', async () => {
      mock.onGet(/\/api\/recent-queries/).reply(200, { queries: [] });

      await queryAPI.getRecentQueries(20);

      expect(mock.history.get.length).toBe(1);
      expect(mock.history.get[0].url).toContain('limit=20');
    });

    it('should use default limit', async () => {
      mock.onGet(/\/api\/recent-queries/).reply(200, { queries: [] });

      await queryAPI.getRecentQueries();

      expect(mock.history.get.length).toBe(1);
      expect(mock.history.get[0].url).toContain('limit=10');
    });
  });

  // ============================================================================
  // Health Check Tests
  // ============================================================================

  describe('healthCheck', () => {
    it('should perform health check successfully', async () => {
      const mockHealth = { status: 'healthy' };
      mock.onGet('/api/health').reply(200, mockHealth);

      const result = await queryAPI.healthCheck();

      expect(result.status).toBe('healthy');
    });
  });
});

// ============================================================================
// API Configuration Tests
// ============================================================================

describe('API Configuration', () => {
  it('should have base URL configured', () => {
    expect(api.defaults.baseURL).toBeTruthy();
  });

  it('should have timeout configured to 30 seconds', () => {
    expect(api.defaults.timeout).toBe(30000); // 30 seconds
  });
});
