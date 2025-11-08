'use client';

import { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

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
        <div className="flex items-center gap-3">
          {/* Strategy Selector */}
          <select
            id="strategy-select"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            disabled={loading}
            className="w-1/5 px-2 py-4 border-2 border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="auto">Auto</option>
            <option value="fast">Fast</option>
            <option value="balanced">Balanced</option>
            <option value="comprehensive">Comprehensive</option>
          </select>

          {/* Query Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What would you like to know?"
              className="w-full px-2 py-4 pr-14 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loading}
            />
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ArrowUp size={20} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}