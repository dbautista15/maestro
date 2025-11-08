'use client';

import { useState } from 'react';
import { Database, Clock, DollarSign, Zap, ChevronDown, FileCheck } from 'lucide-react';
import type { RecentQuery } from '@/lib/api';

interface AuditTrailProps {
  queries: RecentQuery[];
}

export default function AuditTrail({ queries }: AuditTrailProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (queries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
        No queries yet. Submit a query to see the audit trail.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
        aria-expanded={isExpanded}
        aria-controls="audit-trail-content"
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Database size={20} className="text-gray-600" />
          Recent Queries
        </h3>
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Collapsible Content */}
      {isExpanded && (
        <div className="divide-y divide-gray-200 border-t border-gray-200">
          {queries.map((query, idx) => (
            <div key={idx} className="px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-900 font-medium mb-1">
                    {query.query}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      query.source === 'cache' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {query.source}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Clock size={14} />
                      {Math.round(query.latency)}ms
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <DollarSign size={14} />
                      {query.cost.toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Zap size={14} />
                      {(query.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(query.timestamp * 1000).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}