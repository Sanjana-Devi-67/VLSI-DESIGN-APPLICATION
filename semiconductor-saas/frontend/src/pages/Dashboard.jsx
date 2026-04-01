import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Upload, TrendingUp, Activity, Cpu,
} from 'lucide-react';
import { getPredictions, healthCheck } from '../services/api';

const COLORS = {
  defect: '#ef4444',
  noDefect: '#10b981',
  primary: '#6366f1',
  purple: '#a855f7',
  cyan: '#06b6d4',
};

export default function Dashboard() {
  const [predictions, setPredictions] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predData, healthData] = await Promise.all([
          getPredictions(0, 20).catch(() => ({ predictions: [], total: 0 })),
          healthCheck().catch(() => null),
        ]);
        setPredictions(predData.predictions || []);
        setHealth(healthData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Computed stats
  const totalPredictions = predictions.length;
  const defectCount = predictions.filter(p => p.prediction_label === 'DEFECT').length;
  const noDefectCount = totalPredictions - defectCount;
  const avgProb = totalPredictions > 0
    ? (predictions.reduce((s, p) => s + p.defect_probability, 0) / totalPredictions * 100).toFixed(1)
    : 0;

  const pieData = [
    { name: 'Defect', value: defectCount || 0 },
    { name: 'No Defect', value: noDefectCount || 0 },
  ];

  const trendData = predictions
    .slice(0, 10)
    .reverse()
    .map((p, i) => ({
      name: `#${i + 1}`,
      probability: +(p.defect_probability * 100).toFixed(1),
    }));

  const stats = [
    {
      label: 'Total Predictions',
      value: totalPredictions,
      icon: Activity,
      color: 'text-primary-400',
      bgColor: 'from-primary-600/20 to-primary-600/5',
    },
    {
      label: 'Defects Detected',
      value: defectCount,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'from-red-600/20 to-red-600/5',
    },
    {
      label: 'Pass Rate',
      value: totalPredictions > 0 ? `${((noDefectCount / totalPredictions) * 100).toFixed(0)}%` : '—',
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'from-emerald-600/20 to-emerald-600/5',
    },
    {
      label: 'Avg Defect Prob',
      value: `${avgProb}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'from-amber-600/20 to-amber-600/5',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="spinner mx-auto w-10 h-10 border-[3px]"></div>
          <p className="text-dark-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">
          Real-time overview of semiconductor defect detection
        </p>
      </div>

      {/* System health banner */}
      {health && (
        <div className="glass-card p-4 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-sm text-dark-300">
              <strong className="text-dark-100">{health.service}</strong> •
              Model: {health.model_loaded ? (
                <span className="text-emerald-400">Loaded</span>
              ) : (
                <span className="text-red-400">Not loaded</span>
              )} •
              Database: <span className="text-emerald-400">{health.database}</span>
            </span>
          </div>
          <span className="text-xs text-dark-500">v{health.version}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color, bgColor }, i) => (
          <div
            key={label}
            className="glass-card-hover p-6 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{label}</p>
                <p className={`stat-value mt-1 ${color}`}>{value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${bgColor}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Defect Probability Trend */}
        <div className="lg:col-span-2 glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Defect Probability Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="probability"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill="url(#probGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-dark-500">
              <div className="text-center space-y-2">
                <Cpu className="w-10 h-10 mx-auto text-dark-600" />
                <p>No prediction data yet</p>
                <p className="text-xs text-dark-600">Upload sensor data to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Defect Distribution Pie */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Classification</h3>
          {totalPredictions > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={COLORS.defect} />
                  <Cell fill={COLORS.noDefect} />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-dark-500">
              No data available
            </div>
          )}
          <div className="flex justify-center gap-6 mt-2">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Defect
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Pass
            </span>
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="glass-card animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="px-6 py-4 border-b border-dark-800/50">
          <h3 className="text-lg font-semibold text-white">Recent Predictions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Defect Probability</th>
                <th>Classification</th>
                <th>Samples</th>
              </tr>
            </thead>
            <tbody>
              {predictions.length > 0 ? (
                predictions.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-dark-300">#{p.id}</td>
                    <td className="text-dark-400">
                      {new Date(p.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(p.defect_probability * 100).toFixed(0)}%`,
                              background: p.defect_probability >= 0.5
                                ? COLORS.defect
                                : COLORS.noDefect,
                            }}
                          />
                        </div>
                        <span className="font-mono text-sm">
                          {(p.defect_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={p.prediction_label === 'DEFECT' ? 'badge-defect' : 'badge-ok'}>
                        {p.prediction_label === 'DEFECT' ? '⚠ DEFECT' : '✓ PASS'}
                      </span>
                    </td>
                    <td className="text-dark-400">{p.num_samples}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-dark-500">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-dark-600" />
                    No predictions yet. Upload sensor data to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
