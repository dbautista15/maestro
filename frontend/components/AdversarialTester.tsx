'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { adversarialAPI, type ChallengeQuery, type TestResult } from '@/lib/api';

export default function AdversarialTester() {
  const [expanded, setExpanded] = useState(false);
  const [challenges, setChallenges] = useState<ChallengeQuery[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [geminiStatus, setGeminiStatus] = useState<string>('');

  useEffect(() => {
    if (expanded && challenges.length === 0) {
      loadChallenges();
    }
  }, [expanded]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await adversarialAPI.healthCheck();
      setGeminiStatus(health.geminiApi);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const loadChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const data = await adversarialAPI.getChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const runTest = async (query: string) => {
    setRunningTests(prev => new Set(prev).add(query));
    try {
      const result = await adversarialAPI.runTest(query);
      setTestResults(prev => ({ ...prev, [query]: result }));
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(query);
        return next;
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cross_domain': return '🔀';
      case 'edge_case': return '⚠️';
      case 'multi_hop': return '🔗';
      case 'contradiction': return '⚡';
      default: return '🎯';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="text-purple-600" size={20} />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Adversarial Testing</h3>
            <p className="text-xs text-gray-500">
              AI-powered red team for your LLM
              {geminiStatus === 'available' && (
                <span className="ml-2 text-purple-600">
                  <Sparkles className="inline w-3 h-3" /> Gemini enabled
                </span>
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="text-gray-400" size={20} />
        ) : (
          <ChevronDown className="text-gray-400" size={20} />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Controls */}
          <div className="flex items-center justify-between pt-3">
            <div className="text-sm text-gray-600">
              {challenges.length} challenge queries
            </div>
            <button
              onClick={() => loadChallenges()}
              disabled={loadingChallenges}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={loadingChallenges ? 'animate-spin' : ''} size={14} />
              Regenerate
            </button>
          </div>

          {/* Challenge List */}
          {loadingChallenges ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <div className="text-sm">Generating challenges with Gemini AI...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {challenges.map((challenge, idx) => {
                const result = testResults[challenge.query];
                const isRunning = runningTests.has(challenge.query);

                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                  >
                    {/* Query Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getTypeIcon(challenge.type)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">
                            {challenge.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {challenge.query}
                        </div>
                        <div className="text-xs text-gray-500">
                          {challenge.description}
                        </div>
                      </div>

                      {/* Test Button */}
                      <button
                        onClick={() => runTest(challenge.query)}
                        disabled={isRunning}
                        className="flex-shrink-0 p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
                        title="Run test"
                      >
                        {isRunning ? (
                          <RefreshCw className="animate-spin" size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                    </div>

                    {/* Test Result */}
                    {result && (
                      <div className={`mt-2 p-2 rounded-md text-sm ${
                        result.passed
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {result.passed ? (
                            <>
                              <CheckCircle2 className="text-green-600" size={16} />
                              <span className="font-medium text-green-900">Passed</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="text-red-600" size={16} />
                              <span className="font-medium text-red-900">Failed</span>
                            </>
                          )}
                          <span className="text-gray-600">
                            ({(result.confidence * 100).toFixed(1)}% confidence)
                          </span>
                        </div>

                        {!result.passed && result.weakness && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                              <div>
                                <div className="font-medium text-red-900 text-xs">Weakness:</div>
                                <div className="text-red-700 text-xs">{result.weakness}</div>
                              </div>
                            </div>
                            {result.recommendation && (
                              <div className="flex items-start gap-2 mt-2">
                                <Sparkles className="text-purple-500 flex-shrink-0 mt-0.5" size={14} />
                                <div>
                                  <div className="font-medium text-purple-900 text-xs">Recommendation:</div>
                                  <div className="text-purple-700 text-xs">{result.recommendation}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary Stats */}
          {Object.keys(testResults).length > 0 && (
            <div className="pt-3 border-t border-gray-200 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(testResults).filter(r => r.passed).length}
                </div>
                <div className="text-xs text-green-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(testResults).filter(r => !r.passed).length}
                </div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {((Object.values(testResults).filter(r => r.passed).length / Object.keys(testResults).length) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Pass Rate</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
