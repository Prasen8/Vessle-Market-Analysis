import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  vessel: '', date: new Date().toISOString().split('T')[0],
  market_rate: '', hire_rate: '', hs_code: '', notes: '',
};

export default function DataEntry() {
  const { isAdmin } = useAuth();
  const [vessels, setVessels] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Data Entry';
    if (!isAdmin) return;
    fetchVessels();
    fetchRecent();
  }, [isAdmin]);

  const fetchVessels = async () => {
    const res = await api.get('/vessels/');
    const list = res.data.results || res.data;
    setVessels(list);
    if (list.length) setForm(f => ({ ...f, vessel: String(list[0].id) }));
  };

  const fetchRecent = async () => {
    const res = await api.get('/rates/?ordering=-date');
    setRecentEntries((res.data.results || res.data).slice(0, 12));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.vessel || !form.date || !form.market_rate || !form.hire_rate) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true);
    try {
      await api.post('/rates/', {
        vessel: parseInt(form.vessel),
        date: form.date,
        market_rate: parseFloat(form.market_rate),
        hire_rate: parseFloat(form.hire_rate),
        hs_code: form.hs_code || null,
        notes: form.notes || null,
      });
      setSuccess('Entry saved successfully!');
      setForm(f => ({ ...emptyForm, vessel: f.vessel }));
      fetchRecent();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rates/${id}/`);
      setRecentEntries(prev => prev.filter(r => r.id !== id));
      setDeleteId(null);
    } catch {
      setError('Failed to delete entry.');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h3 style={{ color: '#0B1E3D', marginBottom: 8 }}>Access Restricted</h3>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Data entry is available to administrators only.<br />
          Contact your admin to update records.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Daily data entry</div>

        {success && <div style={{ padding: '10px 14px', background: '#e1f5ee', color: '#0f4d38', borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid #9FE1CB' }}>{success}</div>}
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="filter-group">
              <label>Date *</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="filter-group">
              <label>Vessel *</label>
              <select name="vessel" value={form.vessel} onChange={handleChange} required>
                {vessels.map(v => <option key={v.id} value={v.id}>{v.name} ({v.region_name})</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Market Rate *</label>
              <input type="number" name="market_rate" value={form.market_rate} onChange={handleChange} placeholder="e.g. 109.50" step="0.01" min="0" required />
            </div>
            <div className="filter-group">
              <label>Hire Rate *</label>
              <input type="number" name="hire_rate" value={form.hire_rate} onChange={handleChange} placeholder="e.g. 112.00" step="0.01" min="0" required />
            </div>
            <div className="filter-group">
              <label>HS Code</label>
              <input type="text" name="hs_code" value={form.hs_code} onChange={handleChange} placeholder="e.g. HS1_38" />
            </div>
            <div className="filter-group">
              <label>Notes</label>
              <input type="text" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Saving…' : '✓ Save Entry'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setForm(emptyForm); setError(''); }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Recent entries</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Vessel</th><th>Region</th><th>Market Rate</th><th>Hire Rate</th><th>HS Code</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {recentEntries.map(r => {
                const diff = parseFloat(r.hire_rate) - parseFloat(r.market_rate);
                return (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{r.date}</td>
                    <td style={{ fontWeight: 500 }}>{r.vessel_name}</td>
                    <td><span className="badge badge-neutral">{r.region_name}</span></td>
                    <td>{parseFloat(r.market_rate).toFixed(2)}</td>
                    <td>{parseFloat(r.hire_rate).toFixed(2)}</td>
                    <td style={{ color: '#6b7280' }}>{r.hs_code || '—'}</td>
                    <td style={{ color: '#9ca3af', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                    <td>
                      {deleteId === r.id ? (
                        <span style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => handleDelete(r.id)}>Confirm</button>
                          <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setDeleteId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 11, color: '#E24B4A' }} onClick={() => setDeleteId(r.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!recentEntries.length && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
