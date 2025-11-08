'use client';

import { CheckCircle, AlertCircle, FileText, Clock, DollarSign } from 'lucide-react';
import type { QueryResponse } from '@/lib/api';

interface ResultDisplayProps {
  result: QueryResponse | null;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with badges */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Source badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCache ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {result.source}
          {isCache && result.hitCount && ` (${result.hitCount} hits)`}
        </div>

        {/* Strategy badge */}
        <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          {result.strategy}
        </div>

        {/* Confidence badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-100 ${confidenceColor}`}>
          {(result.confidence * 100).toFixed(0)}% confidence
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-gray-400" />
          <span className="font-medium">{Math.round(result.latency)}ms</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign size={16} className="text-gray-400" />
          <span className="font-medium">${result.cost.toFixed(4)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText size={16} className="text-gray-400" />
          <span className="font-medium">{result.documents.length} docs</span>
        </div>
      </div>

      {/* Answer */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          {result.confidence > 0.9 ? (
            <CheckCircle className="text-green-600" size={20} />
          ) : (
            <AlertCircle className="text-yellow-600" size={20} />
          )}
          Response
        </h3>
        <p className="text-gray-700 leading-relaxed">{result.answer}</p>
      </div>

      {/* Documents */}
      {result.documents.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            Source Documents
          </h3>
          <div className="space-y-3">
            {result.documents.map((doc, idx) => (
              <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-medium text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{doc.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{doc.contentPreview}</div>
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