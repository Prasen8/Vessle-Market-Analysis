import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';

const CHART_COLORS = { hire: '#0B1E3D', market: '#E8A923' };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Dashboard';
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const from = new Date(today); from.setDate(today.getDate() - 30);
      const fmt = d => d.toISOString().split('T')[0];

      const [sumRes, aggRes] = await Promise.all([
        api.get('/dashboard/'),
        api.get(`/aggregated/?date_from=${fmt(from)}&date_to=${fmt(today)}`),
      ]);
      setSummary(sumRes.data);
      setChartData(aggRes.data.map(d => ({
        date: d.date.slice(5),
        'Hire Rate Sum': parseFloat(d.hire_rate_sum),
        'Market Rate Sum': parseFloat(d.market_rate_sum),
      })));
    } catch (e) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Vessels</div>
          <div className="metric-value">{summary?.total_vessels ?? '—'}</div>
          <div className="metric-sub">Across 3 regions</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Hire Rate</div>
          <div className="metric-value">{summary?.avg_hire_rate?.toFixed(1) ?? '—'}</div>
          <div className={`metric-sub ${summary?.performance_pct >= 0 ? 'positive' : 'negative'}`}>
            {summary?.performance_pct >= 0 ? '↑' : '↓'} {Math.abs(summary?.performance_pct ?? 0).toFixed(1)}% vs market
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Market Rate</div>
          <div className="metric-value">{summary?.avg_market_rate?.toFixed(1) ?? '—'}</div>
          <div className="metric-sub">Today's benchmark</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Above Market</div>
          <div className={`metric-value ${summary?.performance_pct >= 0 ? 'positive' : 'negative'}`}>
            {summary?.above_market_count ?? '—'} / {summary?.total_vessels ?? '—'}
          </div>
          <div className="metric-sub">Vessels outperforming</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Fleet-wide hire vs market rate — last 30 days</div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: CHART_COLORS.hire }} />Hire Rate Sum</span>
          <span><span className="legend-dot" style={{ background: CHART_COLORS.market, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 3px, #fff 3px, #fff 4px)' }} />Market Rate Sum</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="Hire Rate Sum" stroke={CHART_COLORS.hire} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Market Rate Sum" stroke={CHART_COLORS.market} strokeWidth={2} dot={false} strokeDasharray="5 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Vessel snapshot</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vessel</th><th>Region</th><th>Hire Rate</th>
                <th>Market Rate</th><th>Variance</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.vessel_snapshots ?? []).map((v, i) => {
                const diff = v.variance;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{v.vessel}</td>
                    <td><span className="badge badge-neutral">{v.region}</span></td>
                    <td>{v.hire_rate.toFixed(1)}</td>
                    <td>{v.market_rate.toFixed(1)}</td>
                    <td className={diff >= 0 ? 'positive' : 'negative'}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                    </td>
                    <td>
                      <span className={`badge ${diff >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {diff >= 0 ? 'Above market' : 'Below market'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
