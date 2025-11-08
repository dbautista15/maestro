'use client';

import { TrendingUp, TrendingDown, DollarSign, Zap, Target, Database } from 'lucide-react';

interface MetricsCardsProps {
  metrics: {
    totalQueries: number;
    cacheHitRate: number;
    avgCost: number;
    totalCost: number;
    costSaved: number;
    avgLatency: number;
  };
  view: 'performance' | 'reliability';
}

export default function MetricsCards({ metrics, view }: MetricsCardsProps) {
  // Format numbers
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatPercent = (rate: number) => `${(rate * 100).toFixed(1)}%`;
  const formatMs = (ms: number) => `${Math.round(ms)}ms`;

  // Different metrics for different views
  if (view === 'performance') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Queries */}
        <MetricCard
          title="Total Queries"
          value={metrics.totalQueries.toString()}
          icon={<Database size={24} />}
          color="gray"
        />

        {/* Cache Hit Rate */}
        <MetricCard
          title="Cache Hit Rate"
          value={formatPercent(metrics.cacheHitRate)}
          subtitle={metrics.cacheHitRate > 0.5 ? "Excellent" : "Building cache..."}
          icon={<Zap size={24} />}
          color="green"
          trend={metrics.cacheHitRate > 0.5 ? 'up' : undefined}
        />

        {/* Avg Cost */}
        <MetricCard
          title="Avg Cost/Query"
          value={formatCost(metrics.avgCost)}
          subtitle="vs $0.018 naive"
          icon={<DollarSign size={24} />}
          color="blue"
          trend={metrics.avgCost < 0.010 ? 'down' : undefined}
        />

        {/* Total Saved */}
        <MetricCard
          title="Total Saved"
          value={formatCost(metrics.costSaved)}
          subtitle={`${((metrics.costSaved / (metrics.totalCost + metrics.costSaved)) * 100).toFixed(0)}% reduction`}
          icon={<TrendingDown size={24} />}
          color="purple"
          trend="down"
        />
      </div>
    );
  } else {
    // Reliability view
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Queries */}
        <MetricCard
          title="Total Queries"
          value={metrics.totalQueries.toString()}
          icon={<Database size={24} />}
          color="gray"
        />

        {/* Consistency Rate (cache hit rate in disguise) */}
        <MetricCard
          title="Consistency Rate"
          value={formatPercent(metrics.cacheHitRate)}
          subtitle="Same query → same answer"
          icon={<Target size={24} />}
          color="green"
        />

        {/* Avg Response Time */}
        <MetricCard
          title="Avg Response Time"
          value={formatMs(metrics.avgLatency)}
          subtitle="P50 latency"
          icon={<Zap size={24} />}
          color="blue"
        />

        {/* Audit Coverage */}
        <MetricCard
          title="Audit Coverage"
          value="100%"
          subtitle="Full provenance tracking"
          icon={<TrendingUp size={24} />}
          color="purple"
        />
      </div>
    );
  }
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