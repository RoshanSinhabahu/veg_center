import { useEffect, useState } from 'react';
import axios from 'axios';
import './Produce.css';

const emptyForm = {
  name:           '',
  price_per_unit: '',
};

function Produce() {
  const [produceList, setProduceList] = useState([]);
  const [form,        setForm]        = useState(emptyForm);
  const [editId,      setEditId]      = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [search,      setSearch]      = useState('');
  const [error,       setError]       = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmStep,  setConfirmStep]  = useState(1);

  useEffect(() => {
    fetchProduce();
  }, []);

  const fetchProduce = async () => {
    try {
      const res = await axios.get('/api/produce');
      setProduceList(res.data);
    } catch {
      setError('Failed to load produce');
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Produce name is required');
      return;
    }
    if (!form.price_per_unit || Number(form.price_per_unit) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    try {
      if (editId) {
        await axios.put(`/api/produce/${editId}`, form);
        setSuccessMsg('Produce updated successfully');
      } else {
        await axios.post('/api/produce', form);
        setSuccessMsg('Produce added successfully');
      }
      setTimeout(() => setSuccessMsg(''), 3000);
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      setError('');
      fetchProduce();
    } catch {
      setError('Failed to save produce');
    }
  };

  const handleEdit = (item) => {
    setForm({
      name:           item.name,
      price_per_unit: item.price_per_unit,
    });
    setEditId(item.produce_id);
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const handleDeleteClick = (item) => {
    setDeleteTarget(item);
    setConfirmStep(1);
  };

  const handleConfirmStep1 = () => setConfirmStep(2);

  const handleConfirmStep2 = async () => {
    try {
      await axios.delete(`/api/produce/${deleteTarget.produce_id}`);
      setDeleteTarget(null);
      setConfirmStep(1);
      setSuccessMsg('Produce deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchProduce();
    } catch (err) {
      setDeleteTarget(null);
      setError(err.response?.data?.error || 'Failed to delete produce');
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setConfirmStep(1);
  };

  const filtered = produceList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Produce</h1>
          <p>{produceList.length} produce types registered</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Produce
        </button>
      </div>

      {error      && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      {showForm && (
        <div className="form-card">
          <h3>{editId ? 'Edit Produce' : 'Add New Produce'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Produce Name *</label>
              <input
                placeholder="e.g. Tomato, Carrot, Beans"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price per kg (Rs.) *</label>
              <div className="price-input-wrap">
                <span className="price-prefix">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price_per_unit}
                  onChange={e => setForm({ ...form, price_per_unit: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editId ? 'Update Produce' : 'Save Produce'}
            </button>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          placeholder="Search produce..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No produce found</div>
      ) : (
        <div className="produce-grid">
          {filtered.map(item => (
            <div key={item.produce_id} className="produce-card">
              <div className="produce-card-top">
                <div className="produce-icon">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="produce-card-info">
                  <h4>{item.name}</h4>
                  <span className="produce-id">ID #{item.produce_id}</span>
                </div>
              </div>
              <div className="produce-price">
                <span className="price-label">Price per kg</span>
                <span className="price-value">Rs. {Number(item.price_per_unit).toFixed(2)}</span>
              </div>
              <div className="produce-card-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteClick(item)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal">
            {confirmStep === 1 && (
              <>
                <div className="modal-icon warning">!</div>
                <h3>Delete this produce?</h3>
                <p>
                  You are about to delete
                  <strong> {deleteTarget.name}</strong> priced at
                  <strong> Rs. {Number(deleteTarget.price_per_unit).toFixed(2)}</strong> per kg.
                </p>
                <p className="modal-sub">
                  This may affect existing entries that reference this produce.
                </p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleCancelDelete}>
                    Cancel
                  </button>
                  <button className="btn-danger" onClick={handleConfirmStep1}>
                    Yes, Delete
                  </button>
                </div>
              </>
            )}
            {confirmStep === 2 && (
              <>
                <div className="modal-icon danger">✕</div>
                <h3>Are you absolutely sure?</h3>
                <p>
                  This action <strong>cannot be undone</strong>. This produce
                  type will be permanently removed from the system.
                </p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleCancelDelete}>
                    No, Keep It
                  </button>
                  <button className="btn-danger" onClick={handleConfirmStep2}>
                    Delete Permanently
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Produce;