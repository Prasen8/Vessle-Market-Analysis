import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../api/axios';

const today = () => new Date().toISOString().split('T')[0];
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().split('T')[0]; };

export default function AggregatedView() {
  const [dateFrom, setDateFrom] = useState(monthsAgo(8));
  const [dateTo, setDateTo] = useState(today());
  const [region, setRegion] = useState('');
  const [regions, setRegions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ hire: 0, market: 0, variance: 0, vessels: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Aggregated View';
    api.get('/regions/').then(res => setRegions(res.data.results || res.data));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/aggregated/?date_from=${dateFrom}&date_to=${dateTo}`;
      if (region) url += `&region=${encodeURIComponent(region)}`;
      const res = await api.get(url);
      const data = res.data;
      const cd = data.map(d => ({
        date: d.date.slice(5),
        'Hire Rate Sum': parseFloat(d.hire_rate_sum),
        'Market Rate Sum': parseFloat(d.market_rate_sum),
        vessels: d.vessel_count,
      }));
      setChartData(cd);
      if (data.length) {
        const lastHire = data.reduce((s, d) => s + parseFloat(d.hire_rate_sum), 0) / data.length;
        const lastMkt = data.reduce((s, d) => s + parseFloat(d.market_rate_sum), 0) / data.length;
        setStats({
          hire: lastHire.toFixed(1),
          market: lastMkt.toFixed(1),
          variance: (lastHire - lastMkt).toFixed(1),
          vessels: data[data.length - 1]?.vessel_count || 0,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="filters-bar">
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Region</label>
          <select value={region} onChange={e => setRegion(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={fetchData}>Apply</button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Avg Hire Rate Sum</div>
          <div className="metric-value">{stats.hire}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Market Rate Sum</div>
          <div className="metric-value">{stats.market}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Variance</div>
          <div className={`metric-value ${parseFloat(stats.variance) >= 0 ? 'positive' : 'negative'}`}>
            {parseFloat(stats.variance) >= 0 ? '+' : ''}{stats.variance}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Vessels</div>
          <div className="metric-value">{stats.vessels}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Aggregated hire vs market rate — all vessels
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            &nbsp; (HS codes not shown)
          </span>
        </div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: '#0B1E3D' }} />Hire Rate Sum</span>
          <span><span className="legend-dot" style={{ background: '#E8A923' }} />Market Rate Sum</span>
        </div>
        {loading ? <div className="loading">Loading…</div> : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="Hire Rate Sum" stroke="#0B1E3D" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Market Rate Sum" stroke="#E8A923" strokeWidth={2} dot={false} strokeDasharray="5 4" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <div className="card-title">Daily aggregated comparison</div>
        {loading ? <div className="loading">Loading…</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.slice(-30)} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="Hire Rate Sum" fill="#0B1E3D" opacity={0.85} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Market Rate Sum" fill="#E8A923" opacity={0.85} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
