'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (query: string, strategy?: string) => Promise<void>;
  loading: boolean;
}

export default function QueryInput({ onSubmit, loading }: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState<string>('auto');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    
    await onSubmit(
      query, 
      strategy === 'auto' ? undefined : strategy
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Query Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your query... (e.g., 'What is your refund policy?')"
            className="w-full px-6 py-4 pr-12 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
          />
          <Search className="absolute right-4 top-4 text-gray-400" size={24} />
        </div>

        {/* Strategy Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Strategy:
          </label>
          <div className="flex gap-2">
            {['auto', 'fast', 'balanced', 'comprehensive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStrategy(s)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  strategy === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            'Query'
          )}
        </button>
      </form>

      {/* Helper Text */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        Try: "What is your refund policy?" or "Explain enterprise pricing"
      </p>
    </div>
  );
}