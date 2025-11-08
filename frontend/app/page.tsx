'use client';

import { useState, useEffect } from 'react';
import QueryInput from '@/components/QueryInput';
import MetricsCards from '@/components/MetricsCards';
import ResultDisplay from '@/components/ResultDisplay';
import ViewToggle from '@/components/ViewToggle';
import AuditTrail from '@/components/AuditTrail';
import { queryAPI, type QueryResponse, type Metrics, type RecentQuery } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  // State
  const [view, setView] = useState<'performance' | 'reliability'>('performance');
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
      const data = await queryAPI.getRecentQueries(10);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {view === 'performance' ? 'Maestro' : 'Maestro'}
              </h1>
              <p className="text-gray-600 mt-1">
                {view === 'performance' 
                  ? 'Enterprise RAG Infrastructure That Ships'
                  : 'Production-Grade Reliability Framework'
                }
              </p>
            </div>
            <ViewToggle currentView={view} onToggle={setView} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics cards */}
        {metrics && (
          <MetricsCards metrics={metrics} view={view} />
        )}

        {/* Query input */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
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

        {/* Result display */}
        <ResultDisplay result={result} view={view} />

        {/* Audit trail */}
        {recentQueries.length > 0 && (
          <AuditTrail queries={recentQueries} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          <p>
            Built for {view === 'performance' ? 'Google Track' : 'Reliability Track'} • 
            Powered by Gemini & Vertex AI
          </p>
        </div>
      </footer>
    </div>
  );
}