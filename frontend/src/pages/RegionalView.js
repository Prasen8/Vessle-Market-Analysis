import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const today = () => new Date().toISOString().split('T')[0];
const monthsAgo = (n) => {
  const d = new Date(); d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const hire = payload.find(p => p.dataKey === 'Hire Rate');
  const mkt = payload.find(p => p.dataKey === 'Market Rate');
  const hs = payload[0]?.payload?.hs_code;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#0B1E3D' }}>{label}</div>
      {hire && <div style={{ color: '#0B1E3D' }}>Hire Rate: <strong>{hire.value?.toFixed(2)}</strong></div>}
      {mkt && <div style={{ color: '#E8A923' }}>Market Rate: <strong>{mkt.value?.toFixed(2)}</strong></div>}
      {hs && <div style={{ color: '#6b7280', marginTop: 4 }}>HS Code: {hs}</div>}
    </div>
  );
};

export default function RegionalView() {
  const [vessels, setVessels] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState('');
  const [dateFrom, setDateFrom] = useState(monthsAgo(4));
  const [dateTo, setDateTo] = useState(today());
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Regional View';
    api.get('/vessels/').then(res => {
      setVessels(res.data.results || res.data);
      if (res.data.results?.length || res.data?.length) {
        const first = (res.data.results || res.data)[0];
        setSelectedVessel(String(first.id));
      }
    });
  }, []);

  useEffect(() => {
    if (selectedVessel) fetchRates();
  }, [selectedVessel]);

  const fetchRates = async () => {
    if (!selectedVessel) return;
    setLoading(true);
    try {
      const res = await api.get(`/rates/?vessel=${selectedVessel}&date_from=${dateFrom}&date_to=${dateTo}`);
      const items = (res.data.results || res.data).slice().reverse();
      const cd = items.map(d => ({
        date: d.date.slice(5),
        'Hire Rate': parseFloat(d.hire_rate),
        'Market Rate': parseFloat(d.market_rate),
        hs_code: d.hs_code,
      }));
      setChartData(cd);
      setTableData((res.data.results || res.data).slice(0, 15));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const vesselName = vessels.find(v => String(v.id) === selectedVessel)?.name || '';

  return (
    <div>
      <div className="filters-bar">
        <div className="filter-group">
          <label>Select Vessel</label>
          <select value={selectedVessel} onChange={e => setSelectedVessel(e.target.value)}>
            {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={fetchRates}>Apply</button>
      </div>

      <div className="card">
        <div className="card-title">
          Hire vs market rate — {vesselName}
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            &nbsp; Hover to see HS code
          </span>
        </div>
        <div className="legend">
          <span><span className="legend-dot" style={{ background: '#0B1E3D' }} />Hire Rate</span>
          <span><span className="legend-dot" style={{ background: '#E8A923' }} />Market Rate</span>
        </div>
        {loading ? <div className="loading">Loading…</div> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Hire Rate" stroke="#0B1E3D" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Market Rate" stroke="#E8A923" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} strokeDasharray="5 4" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <div className="card-title">Daily rate log</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Hire Rate</th><th>Market Rate</th><th>HS Code</th><th>Variance</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {tableData.map((r, i) => {
                const diff = parseFloat(r.hire_rate) - parseFloat(r.market_rate);
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{r.date}</td>
                    <td>{parseFloat(r.hire_rate).toFixed(2)}</td>
                    <td>{parseFloat(r.market_rate).toFixed(2)}</td>
                    <td style={{ color: '#6b7280' }}>{r.hs_code || '—'}</td>
                    <td className={diff >= 0 ? 'positive' : 'negative'}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</td>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{r.notes || '—'}</td>
                  </tr>
                );
              })}
              {!tableData.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No data for selected filters</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
