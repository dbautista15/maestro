'use client';

import { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface PerformanceRadarProps {
  metrics: {
    avgLatency: number;
    avgCost: number;
    avgConfidence: number;
  };
}

/**
 * Normalizes metrics to a 0-1 scale for the radar chart
 * 
 * Low Latency Score: Lower latency is better
 * - Uses inverse sigmoid function: 1 / (1 + latency / scale)
 * - Scale = 500ms (so 0ms = 1.0, 500ms = 0.5, 2000ms ≈ 0.2)
 * 
 * Low Cost Score: Lower cost is better
 * - Uses inverse sigmoid function: 1 / (1 + cost / scale)
 * - Scale = 0.01 (so $0.00 = 1.0, $0.01 = 0.5, $0.04 ≈ 0.2)
 * 
 * Quality Score: Higher confidence is better
 * - Confidence is already 0-1, use as is
 */
export default function PerformanceRadar({ metrics }: PerformanceRadarProps) {
  const normalizedData = useMemo(() => {
    // Normalization for Low Latency (inverse sigmoid - lower is better)
    // Using 500ms as the reference point (0.5 score)
    const latencyScale = 500;
    const lowLatencyScore = 1 / (1 + metrics.avgLatency / latencyScale);
    
    // Normalization for Low Cost (inverse sigmoid - lower is better)
    // Using $0.01 as the reference point (0.5 score)
    const costScale = 0.01;
    const lowCostScore = 1 / (1 + metrics.avgCost / costScale);
    
    // Quality score is just the confidence (already 0-1)
    const qualityScore = metrics.avgConfidence;
    
    return [
      {
        metric: 'Low Latency',
        value: lowLatencyScore,
        fullMark: 1,
        displayValue: `${Math.round(metrics.avgLatency)}ms`,
      },
      {
        metric: 'Low Cost',
        value: lowCostScore,
        fullMark: 1,
        displayValue: `$${metrics.avgCost.toFixed(4)}`,
      },
      {
        metric: 'Quality',
        value: qualityScore,
        fullMark: 1,
        displayValue: `${(metrics.avgConfidence * 100).toFixed(1)}%`,
      },
    ];
  }, [metrics.avgLatency, metrics.avgCost, metrics.avgConfidence]);

  // Calculate overall performance score (average of the three)
  const overallScore = useMemo(() => {
    const avg = normalizedData.reduce((sum, item) => sum + item.value, 0) / normalizedData.length;
    return (avg * 100).toFixed(1);
  }, [normalizedData]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="text-purple-600" size={20} />
          <h2 className="text-md font-semibold text-gray-900">Performance Profile</h2>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Overall Score</div>
          <div className="text-2xl font-bold text-purple-600">{overallScore}</div>
        </div>
      </div>

      {/* Chart and Legend Side by Side */}
      <div className="flex gap-3 items-center">
        {/* Radar Chart - Left */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={250} >
            <RadarChart data={normalizedData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 1]}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.4}
                strokeWidth={1}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                }}
                formatter={(value: number, name: string, props: any) => {
                  return [
                    <div key="tooltip" className="text-xs">
                      <div className="text-xs font-semibold">
                        Score: {(value * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        Actual: {props.payload.displayValue}
                      </div>
                    </div>,
                  ];
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '2px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Right */}
        <div className="flex flex-col gap-2 w-72">
          <div className="bg-blue-50 p-2 rounded-lg">
            <div className="font-semibold text-blue-900">Low Latency</div>
            <div className="text-xs text-blue-700 mt-1">
              Fast response times ({Math.round(metrics.avgLatency)}ms)
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Score: {((normalizedData[0].value) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="font-semibold text-green-900">Low Cost</div>
            <div className="text-xs text-green-700 mt-1">
              Cost efficiency (${metrics.avgCost.toFixed(4)})
            </div>
            <div className="text-xs text-green-600 mt-1">
              Score: {((normalizedData[1].value) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg">
            <div className="font-semibold text-purple-900">Quality</div>
            <div className="text-xs text-purple-700 mt-1">
              Answer confidence ({(metrics.avgConfidence * 100).toFixed(1)}%)
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Score: {((normalizedData[2].value) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
      {/* Description */}
      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
        <p className="font-semibold mb-1">How scores are calculated:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li><strong>Low Latency:</strong> Normalized using 1/(1 + latency/500ms). Lower latency = higher score.</li>
          <li><strong>Low Cost:</strong> Normalized using 1/(1 + cost/$0.01). Lower cost = higher score.</li>
          <li><strong>Quality:</strong> Direct confidence score (0-1). Higher confidence = higher score.</li>
        </ul>
      </div>
    </div>
  );
}

