import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Search, RefreshCw, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import { getPredictions } from '../services/api';

const COLORS = {
  defect: '#ef4444',
  noDefect: '#10b981',
  primary: '#6366f1',
};

export default function Results() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await getPredictions(0, 100);
      setPredictions(data.predictions || []);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const filtered = predictions.filter(p => {
    if (filter === 'defect') return p.prediction_label === 'DEFECT';
    if (filter === 'pass') return p.prediction_label === 'NO_DEFECT';
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Prediction Results</h1>
          <p className="text-dark-400 mt-1">
            View defect probabilities and sensor feature importance
          </p>
        </div>
        <button
          onClick={fetchPredictions}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {[
          { key: 'all', label: 'All' },
          { key: 'defect', label: '⚠ Defects' },
          { key: 'pass', label: '✓ Passed' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/40'
                : 'bg-dark-800/40 text-dark-400 border border-dark-700/50 hover:border-dark-600'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-dark-500 self-center">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-dark-600 mb-3" />
          <p className="text-dark-400">No prediction results found</p>
          <p className="text-sm text-dark-600 mt-1">Upload sensor data and run predictions first</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const isDefect = p.prediction_label === 'DEFECT';
            const isExpanded = expandedId === p.id;
            const importances = p.feature_importances || {};
            const importanceData = Object.entries(importances)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([name, value]) => ({
                name: name.length > 16 ? name.slice(0, 14) + '..' : name,
                importance: +(value * 100).toFixed(1),
              }));

            return (
              <div key={p.id} className="glass-card-hover overflow-hidden animate-slide-up">
                {/* Summary row */}
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-5">
                    <span className={`text-2xl`}>{isDefect ? '🔴' : '🟢'}</span>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-dark-400">#{p.id}</span>
                        <span className={isDefect ? 'badge-defect' : 'badge-ok'}>
                          {isDefect ? 'DEFECT' : 'PASS'}
                        </span>
                      </div>
                      <p className="text-xs text-dark-500 mt-1">
                        {new Date(p.timestamp).toLocaleString()} •{' '}
                        {p.num_samples} sample{p.num_samples !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isDefect ? 'text-red-400' : 'text-emerald-400'}`}>
                        {(p.defect_probability * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-dark-500">defect probability</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-dark-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-dark-400" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-5 border-t border-dark-800/50 pt-5 animate-fade-in">
                    {/* Feature Importance Chart */}
                    {importanceData.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-dark-300 mb-3">
                          Sensor Feature Importance
                        </h4>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={importanceData} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                            <XAxis type="number" stroke="#475569" fontSize={11} unit="%" />
                            <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} width={130} />
                            <Tooltip
                              contentStyle={{
                                background: '#0f172a',
                                border: '1px solid rgba(99,102,241,0.3)',
                                borderRadius: '12px',
                                color: '#e2e8f0',
                              }}
                            />
                            <Bar dataKey="importance" radius={[0, 6, 6, 0]} maxBarSize={20}>
                              {importanceData.map((_, i) => (
                                <Cell key={i} fill={i === 0 ? '#a855f7' : i < 3 ? '#6366f1' : '#334155'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Sensor Summary */}
                    {p.sensor_summary && Object.keys(p.sensor_summary).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-dark-300 mb-3">
                          Sensor Summary
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Sensor</th>
                                <th>Mean</th>
                                <th>Std</th>
                                <th>Min</th>
                                <th>Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(p.sensor_summary).slice(0, 10).map(([name, stats]) => (
                                <tr key={name}>
                                  <td className="font-mono text-xs text-dark-300">{name}</td>
                                  <td className="font-mono text-xs">{stats.mean}</td>
                                  <td className="font-mono text-xs">{stats.std}</td>
                                  <td className="font-mono text-xs">{stats.min}</td>
                                  <td className="font-mono text-xs">{stats.max}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
