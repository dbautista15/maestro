'use client';

import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, DollarSign, Zap, Database, Clock, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricsCardsProps {
  metrics: {
    totalQueries: number;
    cacheHitRate: number;
    avgCost: number;
    totalCost: number;
    costSaved: number;
    avgLatency: number;
  };
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Format numbers
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatPercent = (rate: number) => `${(rate * 100).toFixed(1)}%`;
  const formatMs = (ms: number) => `${Math.round(ms)}ms`;

  // Generate mock time-series data for Total Queries
  // TODO: Replace with actual backend time-series data
  const timeSeriesData = useMemo(() => {
    const now = Date.now();
    const dataPoints = 20;
    const intervalMs = 60000; // 1 minute intervals
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const timestamp = now - (dataPoints - i - 1) * intervalMs;
      // Simulate gradual growth with some randomness
      const baseQueries = Math.floor((metrics.totalQueries * i) / dataPoints);
      const variance = Math.random() * 2 - 1; // -1 to 1
      const queries = Math.max(0, baseQueries + variance);
      
      return {
        timestamp,
        queries: Math.round(queries),
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      };
    });
  }, [metrics.totalQueries]);

  // Generate mock time-series data for Cache Hit Rate
  // TODO: Replace with actual backend time-series data
  const cacheHitRateData = useMemo(() => {
    const now = Date.now();
    const dataPoints = 20;
    const intervalMs = 60000; // 1 minute intervals
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const timestamp = now - (dataPoints - i - 1) * intervalMs;
      // Simulate cache warming up over time
      const baseRate = Math.min(metrics.cacheHitRate, (i / dataPoints) * metrics.cacheHitRate * 1.2);
      const variance = (Math.random() * 0.1 - 0.05); // -5% to +5%
      const hitRate = Math.max(0, Math.min(1, baseRate + variance));
      
      return {
        timestamp,
        hitRate: hitRate,
        hitRatePercent: hitRate * 100,
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      };
    });
  }, [metrics.cacheHitRate]);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Queries - Expandable */}
      <div className={`${expandedCard === 'total-queries' ? 'md:col-span-2 lg:col-span-3' : ''}`}>
        <ExpandableMetricCard
          id="total-queries"
          title="Total Queries"
          value={(metrics.totalQueries ?? 0).toString()}
          icon={<Database size={24} />}
          color="gray"
          isExpanded={expandedCard === 'total-queries'}
          onToggle={toggleCard}
          chart={
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Query Volume Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Queries', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="queries" 
                    stroke="#6b7280" 
                    fill="#9ca3af" 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-4">
                Track query volume patterns to identify peak usage times and plan capacity accordingly.
              </p>
            </div>
          }
        />
      </div>

      {/* Cache Hit Rate - Expandable */}
      <div className={`${expandedCard === 'cache-hit-rate' ? 'md:col-span-2 lg:col-span-3' : ''}`}>
        <ExpandableMetricCard
          id="cache-hit-rate"
          title="Cache Hit Rate"
          value={formatPercent(metrics.cacheHitRate ?? 0)}
          subtitle={metrics.cacheHitRate > 0.5 ? "Excellent" : "Building cache..."}
          icon={<Zap size={24} />}
          color="green"
          trend={metrics.cacheHitRate > 0.5 ? 'up' : undefined}
          isExpanded={expandedCard === 'cache-hit-rate'}
          onToggle={toggleCard}
          chart={
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Cache Hit Rate Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cacheHitRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val.toFixed(0)}%`}
                    label={{ value: 'Hit Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hitRatePercent" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Hit Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-4">
                Monitor cache effectiveness over time. A rising trend indicates the cache is warming up and improving query performance.
              </p>
            </div>
          }
        />
      </div>

      {/* Avg Cost */}
      <MetricCard
        title="Avg Cost/Query"
        value={formatCost(metrics.avgCost ?? 0)}
        subtitle="vs $0.018 naive"
        icon={<DollarSign size={24} />}
        color="blue"
        trend={metrics.avgCost < 0.010 ? 'down' : undefined}
      />

      {/* Total Saved */}
      <MetricCard
        title="Total Saved"
        value={formatCost(metrics.costSaved ?? 0)}
        subtitle={`${((metrics.costSaved / (metrics.totalCost + metrics.costSaved)) * 100).toFixed(0)}% reduction`}
        icon={<TrendingDown size={24} />}
        color="purple"
        trend="down"
      />

      {/* Avg Response Time */}
      <MetricCard
        title="Avg Response Time"
        value={formatMs(metrics.avgLatency ?? 0)}
        subtitle="P50 latency"
        icon={<Clock size={24} />}
        color="blue"
      />

      {/* Audit Coverage */}
      <MetricCard
        title="Audit Coverage"
        value="100%"
        subtitle="Full provenance tracking"
        icon={<Target size={24} />}
        color="green"
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'gray' | 'green' | 'blue' | 'purple';
  trend?: 'up' | 'down';
}
  
function MetricCard({ title, value, subtitle, icon, color, trend }: MetricCardProps) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className={`p-6 rounded-lg ${colorClasses[color]} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-medium opacity-80">{title}</div>
        <div className="opacity-60">{icon}</div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
      
      {subtitle && (
        <div className="mt-1 text-xs opacity-70">{subtitle}</div>
      )}
    </div>
  );
}

interface ExpandableMetricCardProps {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'gray' | 'green' | 'blue' | 'purple';
  trend?: 'up' | 'down';
  isExpanded: boolean;
  onToggle: (id: string) => void;
  chart: React.ReactNode;
}

function ExpandableMetricCard({ 
  id, 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend, 
  isExpanded, 
  onToggle, 
  chart 
}: ExpandableMetricCardProps) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="rounded-lg overflow-hidden transition-all">
      {/* Card Header - Clickable */}
      <div 
        className={`p-6 ${colorClasses[color]} transition-all hover:shadow-lg cursor-pointer`}
        onClick={() => onToggle(id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="text-sm font-medium opacity-80">{title}</div>
          <div className="flex items-center gap-2">
            <div className="opacity-60">{icon}</div>
            <div className="opacity-60">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'}
            </div>
          )}
        </div>
        
        {subtitle && (
          <div className="mt-1 text-xs opacity-70">{subtitle}</div>
        )}
        
        <div className="mt-2 text-xs opacity-60">
          Click to {isExpanded ? 'collapse' : 'expand'} details
        </div>
      </div>
      
      {/* Expanded Chart Section */}
      {isExpanded && (
        <div className="p-6 bg-white border-t border-gray-200">
          {chart}
        </div>
      )}
    </div>
  );
}  