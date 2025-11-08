'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, FileText, Clock, DollarSign, ChevronDown, FileCheck } from 'lucide-react';
import type { QueryResponse } from '@/lib/api';

interface ResultDisplayProps {
  result: QueryResponse | null;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);
  const [isDocsExpanded, setIsDocsExpanded] = useState(true);

  if (!result) {
    return (
      <div className="w-full max-w-4xl mx-auto p-32 bg-gray-200 rounded-lg text-center text-sm text-gray-500">
        Submit a query to see results
      </div>
    );
  }

  const isCache = result.source === 'CACHE';
  const confidenceColor = result.confidence > 0.9 
    ? 'text-green-600' 
    : result.confidence > 0.7 
    ? 'text-yellow-600' 
    : 'text-red-600';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2">
      {/* Response */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsResponseExpanded(!isResponseExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
          aria-expanded={isResponseExpanded}
          aria-controls="response-content"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {result.confidence > 0.9 ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-yellow-600" size={20} />
            )}
            Response
          </h3>
          <ChevronDown 
            size={20} 
            className={`text-gray-400 transition-transform duration-200 ${
              isResponseExpanded ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {/* Collapsible Content */}
        {isResponseExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
            {/* Header with badges */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              {/* Source badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCache ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {result.source}
                {isCache && result.hitCount && ` (${result.hitCount} hits)`}
              </div>

              {/* Strategy badge */}
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {result.strategy}
              </div>

              {/* Confidence badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-100 ${confidenceColor}`}>
                {(result.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>

            {/* Answer */}
            <p className="text-sm text-gray-700 leading-relaxed">{result.answer}</p>

            {/* Metrics row */}
            <div className="grid grid-cols-4 gap-0">
              <div className="flex items-center gap-1 text-xs">
                <Clock size={14} className="text-gray-400" />
                <span className="font-medium">{Math.round(result.latency)}ms</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <DollarSign size={14} className="text-gray-400" />
                <span className="font-medium">{result.cost.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <FileText size={14} className="text-gray-400" />
                <span className="font-medium">{result.documents.length} docs</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <FileCheck size={14} className="text-gray-400" />
                <span className="font-medium">{((result.contextRelevance ?? 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documents */}
      {result.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Collapsible Header */}
          <button
            onClick={() => setIsDocsExpanded(!isDocsExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
            aria-expanded={isDocsExpanded}
            aria-controls="documents-content"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText size={20} className="text-gray-600" />
              Documents ({result.documents.length})
            </h3>
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform duration-200 ${
                isDocsExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>

          {/* Collapsible Content */}
          {isDocsExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-200">
              <div className="space-y-2">
                {result.documents.map((doc, idx) => (
                  <div key={doc.id} className="flex items-start gap-2 p-2 bg-gray-100 rounded">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-medium text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{doc.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{doc.contentPreview}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Relevance: {(doc.similarityScore * 100).toFixed(1)}%</span>
                        {doc.category && <span>Category: {doc.category}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cache info (if applicable) */}
      {isCache && result.originalQuery && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <p className="text-blue-800">
            <strong>Cache Hit:</strong> Similar to query from earlier: "{result.originalQuery}"
            {result.cacheSimilarity && (
              <span> (similarity: {(result.cacheSimilarity * 100).toFixed(1)}%)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}