import { useEffect, useState } from 'react';
import axios from 'axios';
import './Payments.css';

function Payments() {
  const [farmers,        setFarmers]        = useState([]);
  const [allEntries,     setAllEntries]      = useState([]);
  const [search,         setSearch]          = useState('');
  const [selectedFarmer, setSelectedFarmer]  = useState(null);
  const [filterDate,     setFilterDate]      = useState('');
  const [error,          setError]           = useState('');
  const [successMsg,     setSuccessMsg]      = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [f, e] = await Promise.all([
        axios.get('/api/farmers'),
        axios.get('/api/entries'),
      ]);
      setFarmers(f.data);
      setAllEntries(e.data);
    } catch {
      setError('Failed to load data');
    }
  };

  const pendingEntries = allEntries.filter(e => e.payment_status === 'pending');

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const farmerPendingEntries = selectedFarmer
    ? pendingEntries.filter(e => e.far_id === selectedFarmer.far_id)
    : [];

  const farmerTotalPending = farmerPendingEntries
    .reduce((sum, e) => sum + Number(e.total_amount), 0)
    .toFixed(2);

  const dateFilteredEntries = filterDate
    ? pendingEntries.filter(e => {
        const expected = e.expected_pay_date
          ? new Date(e.expected_pay_date).toISOString().split('T')[0]
          : null;
        return expected === filterDate;
      })
    : [];

  const dateTotalPending = dateFilteredEntries
    .reduce((sum, e) => sum + Number(e.total_amount), 0)
    .toFixed(2);

  const handleMarkPaid = async (entryId) => {
    try {
      await axios.patch(`/api/entries/${entryId}/status`, {
        payment_status: 'paid',
        paid_time: new Date().toISOString(),
      });
      setSuccessMsg('Payment marked as paid!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchData();
    } catch {
      setError('Failed to update payment');
    }
  };

  const handleMarkAllPaid = async () => {
    if (!selectedFarmer) return;
    if (!window.confirm(`Mark all pending entries for ${selectedFarmer.name} as paid?`)) return;
    try {
      await Promise.all(
        farmerPendingEntries.map(e =>
          axios.patch(`/api/entries/${e.entry_id}/status`, {
            payment_status: 'paid',
            paid_time: new Date().toISOString(),
          })
        )
      );
      setSuccessMsg(`All entries for ${selectedFarmer.name} marked as paid!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchData();
    } catch {
      setError('Failed to update payments');
    }
  };

  const getPendingCount = (far_id) =>
    pendingEntries.filter(e => e.far_id === far_id).length;

  const getPendingTotal = (far_id) =>
    pendingEntries
      .filter(e => e.far_id === far_id)
      .reduce((sum, e) => sum + Number(e.total_amount), 0)
      .toFixed(2);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>{pendingEntries.length} pending entries across all farmers</p>
        </div>
      </div>

      {error      && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      <div className="payments-layout">

        {/* LEFT — Farmer list */}
        <div className="farmer-list-panel">
          <div className="panel-header">
            <h3>Farmers</h3>
            <input
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="farmer-search"
            />
          </div>

          <div className="farmer-list">
            {filteredFarmers.length === 0 ? (
              <div className="empty-small">No farmers found</div>
            ) : filteredFarmers.map(f => {
              const count = getPendingCount(f.far_id);
              const total = getPendingTotal(f.far_id);
              const isSelected = selectedFarmer?.far_id === f.far_id;
              return (
                <div
                  key={f.far_id}
                  className={`farmer-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedFarmer(isSelected ? null : f)}
                >
                  <div className="farmer-row-info">
                    <span className="farmer-row-name">{f.name}</span>
                    <span className="farmer-row-phone">{f.phone_num || '—'}</span>
                    <span className="farmer-row-bank">
                      {f.bank_name ? `${f.bank_name}` : ''}
                      {f.acc_num ? ` · ${f.acc_num}` : ''}
                    </span>
                  </div>
                  <div className="farmer-row-right">
                    {count > 0 ? (
                      <>
                        <span className="pending-badge">{count} pending</span>
                        <span className="pending-amount">Rs. {total}</span>
                      </>
                    ) : (
                      <span className="all-clear">All paid</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Details panel */}
        <div className="details-panel">

          {/* Section 1 — Selected farmer pending entries */}
          {selectedFarmer ? (
            <div className="detail-card">
              <div className="detail-card-header">
              <div>
                <h3>{selectedFarmer.name}</h3>
                <p>{farmerPendingEntries.length} pending entries — Total: Rs. {farmerTotalPending}</p>
                {(selectedFarmer.bank_name || selectedFarmer.acc_num) && (
                  <div className="bank-info">
                    <span>Bank: {selectedFarmer.bank_name || '—'}</span>
                    <span>Account: {selectedFarmer.acc_num || '—'}</span>
                  </div>
                )}
              </div>
                {farmerPendingEntries.length > 0 && (
                  <button className="btn-pay-all" onClick={handleMarkAllPaid}>
                    Mark All Paid
                  </button>
                )}
              </div>

              {farmerPendingEntries.length === 0 ? (
                <div className="empty-small">No pending entries for this farmer</div>
              ) : (
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total (Rs.)</th>
                      <th>Method</th>
                      <th>Expected Pay</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmerPendingEntries.map(e => (
                      <tr key={e.entry_id}>
                        <td>{new Date(e.date).toLocaleDateString()}</td>
                        <td>Rs. {e.total_amount}</td>
                        <td>{e.payment_method}</td>
                        <td>
                          {e.expected_pay_date
                            ? new Date(e.expected_pay_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <button
                            className="btn-mark-paid"
                            onClick={() => handleMarkPaid(e.entry_id)}
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="detail-placeholder">
              <p>Select a farmer from the list to view their pending payments</p>
            </div>
          )}

          {/* Section 2 — Pending by date */}
          <div className="detail-card">
            <div className="detail-card-header">
              <div>
                <h3>Pending by Expected Date</h3>
                <p>Find all pending payments due on a specific date</p>
              </div>
            </div>

            <div className="date-filter-row">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button
                  className="btn-secondary"
                  onClick={() => setFilterDate('')}
                >
                  Clear
                </button>
              )}
            </div>

            {filterDate && (
              <>
                <div className="date-summary">
                  <div className="date-summary-item">
                    <span>Entries due</span>
                    <strong>{dateFilteredEntries.length}</strong>
                  </div>
                  <div className="date-summary-item">
                    <span>Total to pay out</span>
                    <strong className="big-amount">Rs. {dateTotalPending}</strong>
                  </div>
                </div>

                {dateFilteredEntries.length === 0 ? (
                  <div className="empty-small">No pending payments on this date</div>
                ) : (
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Entry Date</th>
                        <th>Total (Rs.)</th>
                        <th>Method</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateFilteredEntries.map(e => (
                        <tr key={e.entry_id}>
                          <td>{e.farmer_name}</td>
                          <td>{new Date(e.date).toLocaleDateString()}</td>
                          <td>Rs. {e.total_amount}</td>
                          <td>{e.payment_method}</td>
                          <td>
                            <button
                              className="btn-mark-paid"
                              onClick={() => handleMarkPaid(e.entry_id)}
                            >
                              Mark Paid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Payments;