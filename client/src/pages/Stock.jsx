import { useEffect, useState } from 'react';
import axios from 'axios';
import './Stock.css';

const emptyItem = {
  produce_id: '', produce_name: '', quantity: '',
  price_per_unit: '', amount: '', available: 0,
};

const today = new Date();

function Stock() {
  const [activeTab,  setActiveTab]  = useState('inventory');
  const [stock,      setStock]      = useState([]);
  const [sales,      setSales]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [bill,       setBill]       = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmStep,  setConfirmStep]  = useState(1);

  const [form, setForm] = useState({
    party_name:   '',
    date:         today.toISOString().split('T')[0],
    notes:        '',
    total_amount: '0.00',
    items:        [{ ...emptyItem }],
  });

  const [dailyDate,  setDailyDate]  = useState(today.toISOString().split('T')[0]);
  const [monthYear,  setMonthYear]  = useState(today.getFullYear());
  const [monthMonth, setMonthMonth] = useState(today.getMonth() + 1);
  const [summary,    setSummary]    = useState(null);
  const [summaryType, setSummaryType] = useState('daily');

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  useEffect(() => {
    fetchStock();
    fetchSales();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await axios.get('/api/stock');
      setStock(res.data);
    } catch {
      setError('Failed to load stock');
    }
  };

  const fetchSales = async () => {
    try {
      const res = await axios.get('/api/stock/sales');
      setSales(res.data);
    } catch {
      setError('Failed to load sales');
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = value;

    if (field === 'produce_id') {
        const selected = stock.find(s => s.produce_id === Number(value));
        if (selected) {
        updated[index].price_per_unit = selected.price_per_unit;
        updated[index].produce_name   = selected.name;
        updated[index].available      = selected.available;
        updated[index].amount = (
            Number(updated[index].quantity) * Number(selected.price_per_unit)
        ).toFixed(2);
        }
    }

    if (field === 'quantity' || field === 'price_per_unit') {
        updated[index].amount = (
        Number(updated[index].quantity) * Number(updated[index].price_per_unit)
        ).toFixed(2);
    }

    const total = updated
        .reduce((sum, i) => sum + Number(i.amount || 0), 0)
        .toFixed(2);

    setForm(prev => ({ ...prev, items: updated, total_amount: total }));
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
    const total = updated
      .reduce((sum, i) => sum + Number(i.amount || 0), 0)
      .toFixed(2);
    setForm(prev => ({ ...prev, items: updated, total_amount: total }));
  };

  const handleSaleSubmit = async () => {
    if (!form.party_name.trim()) {
      setError('Party name is required'); return;
    }
    if (form.items.some(i => !i.produce_id || !i.quantity)) {
      setError('Please complete all items'); return;
    }
    for (const item of form.items) {
      if (Number(item.quantity) > Number(item.available)) {
        setError(`Not enough stock for ${item.produce_name}. Available: ${item.available} kg`);
        return;
      }
    }
    try {
      const res = await axios.post('/api/stock/sales', form);
      setBill({ ...form, sale_id: res.data.sale_id });
      setForm({
        party_name: '', date: today.toISOString().split('T')[0],
        notes: '', total_amount: '0.00', items: [{ ...emptyItem }],
      });
      setError('');
      fetchStock();
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create sale');
    }
  };

  const handleDeleteClick = (sale) => {
    setDeleteTarget(sale);
    setConfirmStep(1);
  };

  const handleConfirmStep2 = async () => {
    try {
      await axios.delete(`/api/stock/sales/${deleteTarget.sale_id}`);
      setDeleteTarget(null);
      setConfirmStep(1);
      setSuccessMsg('Sale deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchStock();
      fetchSales();
    } catch (err) {
      setDeleteTarget(null);
      setError(err.response?.data?.error || 'Failed to delete sale');
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      let url = summaryType === 'daily'
        ? `/api/stock/summary/daily?date=${dailyDate}`
        : `/api/stock/summary/monthly?year=${monthYear}&month=${monthMonth}`;
      const res = await axios.get(url);
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const stockLevel = (available) => {
    if (available <= 0)  return 'out';
    if (available <= 100) return 'low';
    return 'good';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Stock</h1>
          <p>Inventory, sales and summaries</p>
        </div>
      </div>

      {error      && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      {/* Tabs */}
      <div className="stock-tabs">
        {['inventory','sell','history','summary'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setError(''); setBill(null); }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── INVENTORY TAB ── */}
      {activeTab === 'inventory' && (
        <div>
          <div className="stock-grid">
            {stock.length === 0 ? (
              <div className="empty">No produce found. Add produce first.</div>
            ) : stock.map(item => (
              <div key={item.produce_id} className={`stock-card level-${stockLevel(item.available)}`}>
                <div className="stock-card-top">
                  <div className="stock-icon">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{item.name}</h4>
                    <span className="stock-price">Rs. {Number(item.price_per_unit).toFixed(2)} / kg</span>
                  </div>
                </div>
                <div className="stock-stats">
                  <div className="stock-stat">
                    <span>Total In</span>
                    <strong>{Number(item.total_in).toFixed(2)} kg</strong>
                  </div>
                  <div className="stock-stat">
                    <span>Total Out</span>
                    <strong>{Number(item.total_out).toFixed(2)} kg</strong>
                  </div>
                  <div className="stock-stat available">
                    <span>Available</span>
                    <strong>{Number(item.available).toFixed(2)} kg</strong>
                  </div>
                </div>
                <div className={`stock-status-bar ${stockLevel(item.available)}`}>
                  {item.available <= 0
                    ? 'Out of stock'
                    : item.available <= 50
                      ? 'Low stock'
                      : 'In stock'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SELL TAB ── */}
      {activeTab === 'sell' && (
        <div>
          {bill ? (
            <div>
              <div className="success-msg">Sale recorded! Print the bill below.</div>
              <div className="sale-bill" id="sale-bill">
                <div className="bill-header-print">
                  <h2>VegCenter</h2>
                  <p>Stock Sale Bill</p>
                  <hr />
                </div>
                <div className="bill-meta-print">
                  <div><span>Bill No:</span><span>#{bill.sale_id}</span></div>
                  <div><span>Date:</span><span>{bill.date}</span></div>
                  <div><span>Party:</span><span>{bill.party_name}</span></div>
                  {bill.notes && <div><span>Notes:</span><span>{bill.notes}</span></div>}
                </div>
                <hr />
                <table className="bill-table-print">
                  <thead>
                    <tr>
                      <th>Produce</th>
                      <th>Qty (kg)</th>
                      <th>Price/kg</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.produce_name}</td>
                        <td>{item.quantity}</td>
                        <td>Rs. {item.price_per_unit}</td>
                        <td>Rs. {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <hr />
                <div className="bill-total-print">
                  <span>Total Amount</span>
                  <span>Rs. {bill.total_amount}</span>
                </div>
                <div className="bill-footer-print">
                  <p>Thank you for your business!</p>
                  <div className="bill-sigs">
                    <div><hr /><p>Buyer Signature</p></div>
                    <div><hr /><p>Authorized Signature</p></div>
                  </div>
                </div>
              </div>
              <div className="bill-btns no-print">
                <button className="btn-primary" onClick={handlePrint}>Print Bill</button>
                <button className="btn-secondary" onClick={() => setBill(null)}>New Sale</button>
              </div>
            </div>
          ) : (
            <div className="form-card">
              <h3>New Sale to Third Party</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Party Name *</label>
                  <input
                    placeholder="Enter buyer / company name"
                    value={form.party_name}
                    onChange={e => setForm({ ...form, party_name: e.target.value })}
                  />
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
                  <label>Notes</label>
                  <input
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <h4>Produce Items</h4>
                  <button className="btn-add-item" onClick={addItem}>+ Add Row</button>
                </div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Produce</th>
                      <th>Available (kg)</th>
                      <th>Qty to Sell (kg)</th>
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
                            {stock.filter(s => s.available > 0).map(s => (
                              <option key={s.produce_id} value={s.produce_id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="available-col">
                          {item.available ? `${Number(item.available).toFixed(2)} kg` : '—'}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            placeholder="0.000"
                            value={item.quantity}
                            max={item.available}
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
                          <button className="btn-remove" onClick={() => removeItem(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="entry-summary">
                <div className="summary-row">
                  <span>Total Amount</span>
                  <span className="total-amount">Rs. {form.total_amount}</span>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleSaleSubmit}>
                  Save & Print Bill
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Party Name</th>
                <th>Date</th>
                <th>Total (Rs.)</th>
                <th>Notes</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan="7" className="empty">No sales yet</td></tr>
              ) : sales.map((s, i) => (
                <tr key={s.sale_id}>
                  <td>{i + 1}</td>
                  <td>{s.party_name}</td>
                  <td>{new Date(s.date).toLocaleDateString()}</td>
                  <td>Rs. {Number(s.total_amount).toFixed(2)}</td>
                  <td>{s.notes || '—'}</td>
                  <td>
                    {new Date(s.created_at).toLocaleString([], {
                      year: 'numeric', month: 'short', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDeleteClick(s)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {activeTab === 'summary' && (
        <div>
          <div className="filter-bar no-print">
            <div className="summary-type-toggle">
              <button
                className={`tab ${summaryType === 'daily' ? 'active' : ''}`}
                onClick={() => { setSummaryType('daily'); setSummary(null); }}
              >Daily</button>
              <button
                className={`tab ${summaryType === 'monthly' ? 'active' : ''}`}
                onClick={() => { setSummaryType('monthly'); setSummary(null); }}
              >Monthly</button>
            </div>

            {summaryType === 'daily' && (
              <div className="filter-group">
                <label>Date</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value)}
                />
              </div>
            )}

            {summaryType === 'monthly' && (
              <>
                <div className="filter-group">
                  <label>Month</label>
                  <select
                    value={monthMonth}
                    onChange={e => setMonthMonth(e.target.value)}
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Year</label>
                  <input
                    type="number"
                    value={monthYear}
                    min="2020"
                    max="2100"
                    style={{ width: '100px' }}
                    onChange={e => setMonthYear(e.target.value)}
                  />
                </div>
              </>
            )}

            <button className="btn-primary" onClick={fetchSummary} disabled={loading}>
              {loading ? 'Loading...' : 'Generate'}
            </button>
            {summary && (
              <button className="btn-secondary" onClick={handlePrint}>Print</button>
            )}
          </div>

          {summary && (
            <div id="summary-print">
              <div className="print-header-stock">
                <h2>VegCenter — Stock {summaryType === 'daily' ? 'Daily' : 'Monthly'} Summary</h2>
                <p>
                  {summaryType === 'daily'
                    ? new Date(dailyDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })
                    : `${monthNames[monthMonth - 1]} ${monthYear}`}
                </p>
              </div>

              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Stock Added (kg)</span>
                  <span className="summary-value">{Number(summary.total_qty_in).toFixed(2)}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total Sales</span>
                  <span className="summary-value">{summary.total_sales}</span>
                </div>
                <div className="summary-card sold-card">
                  <span className="summary-label">Stock Sold (kg)</span>
                  <span className="summary-value">{Number(summary.total_qty_sold).toFixed(2)}</span>
                </div>
                <div className="summary-card revenue-card">
                  <span className="summary-label">Revenue (Rs.)</span>
                  <span className="summary-value">Rs. {Number(summary.total_amount_sold).toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-tables">
                <div className="report-table-wrap">
                  <h3>Stock Added (from farmer entries)</h3>
                  {summary.stock_in.length === 0 ? (
                    <div className="empty">No stock added on this date</div>
                  ) : (
                    <table className="report-table">
                      <thead>
                        <tr><th>Produce</th><th>Quantity Added (kg)</th></tr>
                      </thead>
                      <tbody>
                        {summary.stock_in.map((row, i) => (
                          <tr key={i}>
                            <td>{row.produce_name}</td>
                            <td>{Number(row.qty_in).toFixed(2)} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="report-table-wrap">
                  <h3>Stock Sold (to third parties)</h3>
                  {summary.stock_out.length === 0 ? (
                    <div className="empty">No stock sold on this date</div>
                  ) : (
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Produce</th>
                          <th>Qty Sold (kg)</th>
                          <th>Revenue (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.stock_out.map((row, i) => (
                          <tr key={i}>
                            <td>{row.produce_name}</td>
                            <td>{Number(row.qty_out).toFixed(2)} kg</td>
                            <td>Rs. {Number(row.amount_out).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {summaryType === 'monthly' && summary.available && (
                  <div className="report-table-wrap">
                    <h3>Current Available Stock</h3>
                    <table className="report-table">
                      <thead>
                        <tr><th>Produce</th><th>Available (kg)</th></tr>
                      </thead>
                      <tbody>
                        {summary.available.map((row, i) => (
                          <tr key={i}>
                            <td>{row.produce_name}</td>
                            <td>{Number(row.available).toFixed(2)} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {!summary && !loading && (
            <div className="report-placeholder">
              Select a date or month and click Generate
            </div>
          )}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal">
            {confirmStep === 1 && (
              <>
                <div className="modal-icon warning">!</div>
                <h3>Delete this sale?</h3>
                <p>
                  Sale to <strong>{deleteTarget.party_name}</strong> on{' '}
                  <strong>{new Date(deleteTarget.date).toLocaleDateString()}</strong>{' '}
                  worth <strong>Rs. {Number(deleteTarget.total_amount).toFixed(2)}</strong>.
                </p>
                <p className="modal-sub">Stock levels will be restored.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                  <button className="btn-danger" onClick={() => setConfirmStep(2)}>Yes, Delete</button>
                </div>
              </>
            )}
            {confirmStep === 2 && (
              <>
                <div className="modal-icon danger">✕</div>
                <h3>Are you absolutely sure?</h3>
                <p>This action <strong>cannot be undone</strong>.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => { setDeleteTarget(null); setConfirmStep(1); }}>
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

export default Stock;