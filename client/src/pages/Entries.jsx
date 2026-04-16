import { useEffect, useState } from 'react';
import axios from 'axios';
import Bill from '../components/Bill';
import {
  getNextPaymentDay,
  shouldDefer,
  calcItemAmount,
  calcTotal,
} from '../utils/paymentUtils';
import './Entries.css';

const emptyItem = {
  produce_id: '',
  produce_name: '',
  quantity: '',
  price_per_unit: '',
  amount: '',
};

function Entries() {
  const [farmers,       setFarmers]       = useState([]);
  const [produce,       setProduce]       = useState([]);
  const [entries,       setEntries]       = useState([]);
  const [showForm,      setShowForm]      = useState(false);
  const [bill,          setBill]          = useState(null);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [confirmStep,   setConfirmStep]   = useState(1);

  const [form, setForm] = useState({
    far_id:            '',
    date:              new Date().toISOString().split('T')[0],
    payment_method:    'cash',
    payment_status:    'pending',
    expected_pay_date: '',
    total_amount:      '0.00',
    items:             [{ ...emptyItem }],
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [f, p, e] = await Promise.all([
        axios.get('/api/farmers'),
        axios.get('/api/produce'),
        axios.get('/api/entries'),
      ]);
      setFarmers(f.data);
      setProduce(p.data);
      setEntries(e.data);
    } catch {
      setError('Failed to load data');
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = value;

    if (field === 'produce_id') {
      const selected = produce.find(p => p.produce_id === Number(value));
      if (selected) {
        updated[index].price_per_unit = selected.price_per_unit;
        updated[index].produce_name   = selected.name;
        updated[index].amount = calcItemAmount(
          updated[index].quantity,
          selected.price_per_unit
        );
      }
    }

    if (field === 'quantity') {
      updated[index].amount = calcItemAmount(value, updated[index].price_per_unit);
    }

    const total    = calcTotal(updated);
    const deferred = shouldDefer(updated);

    setForm(prev => ({
      ...prev,
      items:             updated,
      total_amount:      total,
      payment_status:    deferred ? 'pending' : 'paid',
      expected_pay_date: deferred ? getNextPaymentDay() : '',
    }));
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;
    const updated = form.items.filter((_, i) => i !== index);
    setForm(prev => ({
      ...prev,
      items:        updated,
      total_amount: calcTotal(updated),
    }));
  };

  const handleSubmit = async () => {
    if (!form.far_id) {
      setError('Please select a farmer');
      return;
    }
    if (form.items.some(i => !i.produce_id || !i.quantity)) {
      setError('Please complete all produce items');
      return;
    }
    try {
      const res = await axios.post('/api/entries', form);
      const farmer = farmers.find(f => f.far_id === Number(form.far_id));
      setBill({
        entry:  { ...form, entry_id: res.data.entry_id },
        farmer,
        items:  form.items,
      });
      setShowForm(false);
      setError('');
      fetchAll();
    } catch {
      setError('Failed to save entry');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm({
      far_id:            '',
      date:              new Date().toISOString().split('T')[0],
      payment_method:    'cash',
      payment_status:    'pending',
      expected_pay_date: '',
      total_amount:      '0.00',
      items:             [{ ...emptyItem }],
    });
    setBill(null);
    setError('');
  };

  const handleDeleteClick = (entry) => {
    setDeleteTarget(entry);
    setConfirmStep(1);
  };

  const handleConfirmStep1 = () => {
    setConfirmStep(2);
  };

  const handleConfirmStep2 = async () => {
    try {
        await axios.delete(`/api/entries/${deleteTarget.entry_id}`);
        setDeleteTarget(null);
        setConfirmStep(1);
        setSuccessMsg('Entry deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchAll();
    } catch (err) {
        setDeleteTarget(null);
        setError(err.response?.data?.error || err.message || 'Failed to delete entry');
    }
    };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setConfirmStep(1);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Entries</h1>
          <p>{entries.length} total entries</p>
        </div>
        {!showForm && !bill && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Entry
          </button>
        )}
      </div>

      {error      && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      {/* Bill view after saving */}
      {bill && (
        <div>
          <div className="bill-success">
            Entry saved successfully! Print the bill below.
          </div>
          <Bill
            entry={bill.entry}
            farmer={bill.farmer}
            items={bill.items}
          />
          <button className="btn-secondary mt-16" onClick={handleCancel}>
            Back to Entries
          </button>
        </div>
      )}

      {/* New entry form */}
      {showForm && !bill && (
        <div className="form-card">
          <h3>New Entry</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Farmer *</label>
              <select
                value={form.far_id}
                onChange={e => setForm({ ...form, far_id: e.target.value })}
              >
                <option value="">Select farmer</option>
                {farmers.map(f => (
                  <option key={f.far_id} value={f.far_id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Produce items table */}
          <div className="items-section">
            <div className="items-header">
              <h4>Produce Items</h4>
              <button className="btn-add-item" onClick={addItem}>+ Add Produce</button>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Produce</th>
                  <th>Qty (kg)</th>
                  <th>Price/kg</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <select
                        value={item.produce_id}
                        onChange={e => handleItemChange(i, 'produce_id', e.target.value)}
                      >
                        <option value="">Select</option>
                        {produce.map(p => (
                          <option key={p.produce_id} value={p.produce_id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="0.000"
                        value={item.quantity}
                        onChange={e => handleItemChange(i, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price_per_unit}
                        onChange={e => handleItemChange(i, 'price_per_unit', e.target.value)}
                      />
                    </td>
                    <td className="amount-col">Rs. {item.amount || '0.00'}</td>
                    <td>
                      <button
                        className="btn-remove"
                        onClick={() => removeItem(i)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Entry summary */}
          <div className="entry-summary">
            <div className="summary-row">
              <span>Total Amount</span>
              <span className="total-amount">Rs. {form.total_amount}</span>
            </div>
            <div className="summary-row">
              <span>Payment Status</span>
              <span className={`status ${form.payment_status}`}>
                {form.payment_status?.toUpperCase()}
              </span>
            </div>
            {form.payment_status === 'pending' && (
              <div className="summary-row">
                <span>Expected Pay Date</span>
                <input
                  type="date"
                  style={{ width: 'auto' }}
                  value={form.expected_pay_date}
                  onChange={e =>
                    setForm({ ...form, expected_pay_date: e.target.value })
                  }
                />
              </div>
            )}
            {form.payment_status === 'paid' && (
              <div className="summary-row">
                <span>Expected Pay Date</span>
                <span className="status paid">Already Paid</span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              Save & Print Bill
            </button>
          </div>
        </div>
      )}

      {/* Entries table */}
      {!showForm && !bill && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Farmer</th>
                <th>Entry Date</th>
                <th>Time</th>
                <th>Total (Rs.)</th>
                <th>Method</th>
                <th>Status</th>
                <th>Expected Pay</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
              <tr key={e.entry_id}>
                <td>{i + 1}</td>
                <td>{e.farmer_name}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>
                  {e.created_at
                    ? new Date(e.created_at).toLocaleTimeString([], {
                        hour:   '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td>Rs. {e.total_amount}</td>
                <td>{e.payment_method}</td>
                <td>
                  <span className={`status ${e.payment_status}`}>
                    {e.payment_status?.toUpperCase()}
                  </span>
                </td>
                <td>
                  {e.payment_status === 'paid'
                    ? <span className="status paid">Already Paid</span>
                    : e.expected_pay_date
                      ? new Date(e.expected_pay_date).toLocaleDateString()
                      : '—'}
                </td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(e)}
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

      {/* Double confirmation delete modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal">

            {confirmStep === 1 && (
              <>
                <div className="modal-icon warning">!</div>
                <h3>Delete this entry?</h3>
                <p>
                  You are about to delete the entry for
                  <strong> {deleteTarget.farmer_name}</strong> on
                  <strong> {new Date(deleteTarget.date).toLocaleDateString()}</strong> worth
                  <strong> Rs. {deleteTarget.total_amount}</strong>.
                </p>
                <p className="modal-sub">
                  This will also delete all produce items in this entry.
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
                  This action <strong>cannot be undone</strong>. The entry and
                  all its produce items will be permanently removed from the
                  database.
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

export default Entries;
