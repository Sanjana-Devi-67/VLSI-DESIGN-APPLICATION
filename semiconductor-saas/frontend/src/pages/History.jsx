import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  Clock, TrendingDown, TrendingUp, RefreshCw, FileSpreadsheet,
} from 'lucide-react';
import { getPredictions, getUploads } from '../services/api';

const COLORS = {
  defect: '#ef4444',
  noDefect: '#10b981',
  primary: '#6366f1',
  purple: '#a855f7',
};

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [predData, uploadData] = await Promise.all([
        getPredictions(0, 100).catch(() => ({ predictions: [], total: 0 })),
        getUploads(0, 50).catch(() => []),
      ]);
      setPredictions(predData.predictions || []);
      setUploads(uploadData || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Analytics computations
  const totalPredictions = predictions.length;
  const defects = predictions.filter(p => p.prediction_label === 'DEFECT');
  const passes = predictions.filter(p => p.prediction_label === 'NO_DEFECT');
  const defectRate = totalPredictions > 0 ? ((defects.length / totalPredictions) * 100).toFixed(1) : 0;
  const avgProb = totalPredictions > 0
    ? (predictions.reduce((s, p) => s + p.defect_probability, 0) / totalPredictions * 100).toFixed(1)
    : 0;

  // Timeline data (group by date)
  const timelineMap = {};
  predictions.forEach(p => {
    const date = new Date(p.timestamp).toLocaleDateString();
    if (!timelineMap[date]) {
      timelineMap[date] = { date, defects: 0, passes: 0, total: 0, avgProb: 0, sumProb: 0 };
    }
    timelineMap[date].total++;
    timelineMap[date].sumProb += p.defect_probability;
    timelineMap[date].avgProb = +(timelineMap[date].sumProb / timelineMap[date].total * 100).toFixed(1);
    if (p.prediction_label === 'DEFECT') timelineMap[date].defects++;
    else timelineMap[date].passes++;
  });
  const timelineData = Object.values(timelineMap).reverse().slice(-14);

  // Distribution buckets
  const buckets = [
    { range: '0-10%', min: 0, max: 0.1 },
    { range: '10-20%', min: 0.1, max: 0.2 },
    { range: '20-30%', min: 0.2, max: 0.3 },
    { range: '30-40%', min: 0.3, max: 0.4 },
    { range: '40-50%', min: 0.4, max: 0.5 },
    { range: '50-60%', min: 0.5, max: 0.6 },
    { range: '60-70%', min: 0.6, max: 0.7 },
    { range: '70-80%', min: 0.7, max: 0.8 },
    { range: '80-90%', min: 0.8, max: 0.9 },
    { range: '90-100%', min: 0.9, max: 1.01 },
  ];
  const distributionData = buckets.map(b => ({
    range: b.range,
    count: predictions.filter(p => p.defect_probability >= b.min && p.defect_probability < b.max).length,
    isDefect: b.min >= 0.5,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto w-10 h-10 border-[3px]"></div>
          <p className="text-dark-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Historical Analytics</h1>
          <p className="text-dark-400 mt-1">
            Trends, distributions, and upload history
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Scans', value: totalPredictions, icon: Clock, color: 'text-primary-400' },
          { label: 'Defect Rate', value: `${defectRate}%`, icon: TrendingUp, color: 'text-red-400' },
          { label: 'Pass Rate', value: `${(100 - defectRate).toFixed(1)}%`, icon: TrendingDown, color: 'text-emerald-400' },
          { label: 'Files Uploaded', value: uploads.length, icon: FileSpreadsheet, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="stat-label">{label}</span>
            </div>
            <span className={`stat-value ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold text-white mb-4">
            Daily Prediction Volume
          </h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="passes" stackId="a" fill={COLORS.noDefect} radius={[0, 0, 0, 0]} name="Pass" />
                <Bar dataKey="defects" stackId="a" fill={COLORS.defect} radius={[4, 4, 0, 0]} name="Defect" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-dark-500">
              No data available
            </div>
          )}
        </div>

        {/* Probability Distribution */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-white mb-4">
            Defect Probability Distribution
          </h3>
          {totalPredictions > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#475569" fontSize={10} angle={-30} textAnchor="end" height={50} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.isDefect ? COLORS.defect : COLORS.noDefect} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-dark-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Average Probability Trend */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
        <h3 className="text-lg font-semibold text-white mb-4">
          Average Defect Probability Over Time
        </h3>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                }}
              />
              <Area type="monotone" dataKey="avgProb" stroke={COLORS.purple} strokeWidth={2} fill="url(#avgGrad)" name="Avg Defect %" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-dark-500">
            No data available
          </div>
        )}
      </div>

      {/* Upload History Table */}
      <div className="glass-card animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="px-6 py-4 border-b border-dark-800/50">
          <h3 className="text-lg font-semibold text-white">Upload History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Rows</th>
                <th>Features</th>
                <th>Upload Time</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length > 0 ? (
                uploads.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-dark-400">#{u.id}</td>
                    <td className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary-400" />
                      <span className="text-dark-200">{u.filename}</span>
                    </td>
                    <td className="font-mono">{u.num_rows}</td>
                    <td className="font-mono">{u.num_features}</td>
                    <td className="text-dark-400 text-sm">
                      {u.upload_time ? new Date(u.upload_time).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-dark-500">
                    No uploads yet
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
