'use client';

import { useState, useEffect } from 'react';
import QueryInput from '@/components/QueryInput';
import MetricsCards from '@/components/MetricsCards';
import ResultDisplay from '@/components/ResultDisplay';
import AuditTrail from '@/components/AuditTrail';
import { queryAPI, type QueryResponse, type Metrics, type RecentQuery } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  // State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics on mount and every 5 seconds
  useEffect(() => {
    fetchMetrics();
    fetchRecentQueries();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchRecentQueries();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await queryAPI.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchRecentQueries = async () => {
    try {
      const data = await queryAPI.getRecentQueries(5);
      setRecentQueries(data);
    } catch (err) {
      console.error('Failed to fetch recent queries:', err);
    }
  };

  const handleQuery = async (query: string, strategy?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await queryAPI.process({
        query,
        strategy: strategy as any,
      });

      setResult(response);
      
      // Refresh metrics and audit trail
      await fetchMetrics();
      await fetchRecentQueries();

    } catch (err: any) {
      console.error('Query failed:', err);
      setError(err.response?.data?.detail || err.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Maestr
              <img 
                src="/favicon.ico" 
                alt="o" 
                className="w-4.25 h-4.25 mx-0.25 inline-block"
              />
            </h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto w-full max-w-full px-4 py-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-full min-w-full">
          {/* Left Column - Interactions */}
          <div className="lg:col-span-1 space-y-2 flex flex-col h-full">
            {/* Result display */}
            <ResultDisplay result={result} />

            {/* Query input */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <QueryInput onSubmit={handleQuery} loading={loading} />
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="font-medium text-red-900">Query Failed</div>
                  <div className="text-sm text-red-700 mt-1">{error}</div>
                </div>
              </div>
            )}

            {/* Audit trail */}
            {recentQueries.length > 0 && (
              <AuditTrail queries={recentQueries} />
            )}
          </div>

          {/* Right Column - Metrics */}
          <div className="lg:col-span-2 h-full">
            <div className="lg:sticky lg:top-8">
              {metrics && (
                <MetricsCards metrics={metrics} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-2 text-center text-sm text-gray-500">
          <p>
            Built for AI ATL Hackathon • Powered by Gemini & Vertex AI
          </p>
        </div>
      </footer>
    </div>
  );
}