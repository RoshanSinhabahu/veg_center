import { useEffect, useState } from 'react';
import axios from 'axios';
import './Farmers.css';

const emptyForm = {
  name:      '',
  address:   '',
  phone_num: '',
  acc_num:   '',
  bank_name: '',
};

function Farmers() {
  const [farmers, setFarmers]   = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/farmers');
      setFarmers(res.data);
    } catch {
      setError('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Farmer name is required');
      return;
    }
    try {
      if (editId) {
        await axios.put(`/api/farmers/${editId}`, form);
      } else {
        await axios.post('/api/farmers', form);
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      setError('');
      fetchFarmers();
    } catch {
      setError('Failed to save farmer');
    }
  };

  const handleEdit = (farmer) => {
    setForm({
      name:      farmer.name,
      address:   farmer.address,
      phone_num: farmer.phone_num,
      acc_num:   farmer.acc_num,
      bank_name: farmer.bank_name,
    });
    setEditId(farmer.far_id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this farmer?')) return;
    try {
      await axios.delete(`/api/farmers/${id}`);
      fetchFarmers();
    } catch {
      setError('Failed to delete farmer');
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const filtered = farmers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.phone_num?.includes(search)
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Farmers</h1>
          <p>{farmers.length} registered farmers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Farmer
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>{editId ? 'Edit Farmer' : 'Add New Farmer'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                placeholder="Enter phone number"
                value={form.phone_num}
                onChange={e => setForm({ ...form, phone_num: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                placeholder="Enter address"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input
                placeholder="Enter bank account number"
                value={form.acc_num}
                onChange={e => setForm({ ...form, acc_num: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Bank Name</label>
              <input
                placeholder="e.g. Bank of Ceylon, People's Bank"
                value={form.bank_name}
                onChange={e => setForm({ ...form, bank_name: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editId ? 'Update Farmer' : 'Save Farmer'}
            </button>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading farmers...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">No farmers found</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Account No</th>
                <th>Bank</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.far_id}>
                  <td>{i + 1}</td>
                  <td>{f.name}</td>
                  <td>{f.phone_num || '—'}</td>
                  <td>{f.address || '—'}</td>
                  <td>{f.acc_num || '—'}</td>
                  <td>{f.bank_name || '—'}</td>
                  <td>{new Date(f.reg_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(f)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(f.far_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Farmers;