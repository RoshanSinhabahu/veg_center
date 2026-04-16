import { useState } from 'react';
import axios from 'axios';
import './Reports.css';

function Reports() {
  const today = new Date();
  const currentYear  = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [activeTab, setActiveTab] = useState('daily');

  const [dailyDate,   setDailyDate]   = useState(today.toISOString().split('T')[0]);
  const [dailyData,   setDailyData]   = useState(null);
  const [dailyDetail, setDailyDetail] = useState([]);

  const [monthYear,    setMonthYear]    = useState(currentYear);
  const [monthMonth,   setMonthMonth]   = useState(currentMonth);
  const [monthlyData,  setMonthlyData]  = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetchDaily = async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, detail] = await Promise.all([
        axios.get(`/api/reports/daily?date=${dailyDate}`),
        axios.get(`/api/reports/daily-detail?date=${dailyDate}`),
      ]);
      setDailyData(summary.data);
      setDailyDetail(detail.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load daily report');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, breakdown] = await Promise.all([
        axios.get(`/api/reports/monthly?year=${monthYear}&month=${monthMonth}`),
        axios.get(`/api/reports/monthly-breakdown?year=${monthYear}&month=${monthMonth}`),
      ]);
      setMonthlyData(summary.data);
      setMonthlyBreakdown(breakdown.data);
    } catch {
      setError('Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Daily and monthly summaries</p>
        </div>
        {(dailyData || monthlyData) && (
          <button className="btn-primary" onClick={handlePrint}>
            Print Report
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Tabs */}
      <div className="report-tabs">
        <button
          className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => { setActiveTab('daily'); setError(''); }}
        >
          Daily Report
        </button>
        <button
          className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => { setActiveTab('monthly'); setError(''); }}
        >
          Monthly Report
        </button>
      </div>

      <div className="report-content" id="print-area">

        {/* ── DAILY TAB ── */}
        {activeTab === 'daily' && (
          <div>
            <div className="filter-bar no-print">
              <div className="filter-group">
                <label>Select Date</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value)}
                />
              </div>
              <button
                className="btn-primary"
                onClick={fetchDaily}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>

            {dailyData && (
              <div>
                <div className="print-header">
                  <h2>VegCenter — Daily Report</h2>
                  <p>{new Date(dailyDate).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric',
                    month: 'long', day: 'numeric'
                  })}</p>
                </div>

                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="summary-label">Total Entries</span>
                    <span className="summary-value">{dailyData.total_entries}</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">Total Amount</span>
                    <span className="summary-value">Rs. {Number(dailyData.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-card paid-card">
                    <span className="summary-label">Total Paid</span>
                    <span className="summary-value">Rs. {Number(dailyData.total_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-card pending-card">
                    <span className="summary-label">Total Pending</span>
                    <span className="summary-value">Rs. {Number(dailyData.total_pending || 0).toFixed(2)}</span>
                  </div>
                </div>

                {dailyDetail.length > 0 && (
                  <div className="report-table-wrap">
                    <h3>Entry Details</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Farmer</th>
                          <th>Time</th>
                          <th>Total (Rs.)</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyDetail.map((e, i) => (
                          <tr key={e.entry_id}>
                            <td>{i + 1}</td>
                            <td>{e.farmer_name}</td>
                            <td>
                              {e.created_at
                                ? new Date(e.created_at).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit'
                                  })
                                : '—'}
                            </td>
                            <td>Rs. {Number(e.total_amount).toFixed(2)}</td>
                            <td>{e.payment_method}</td>
                            <td>
                              <span className={`status ${e.payment_status}`}>
                                {e.payment_status?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {dailyDetail.length === 0 && (
                  <div className="empty">No entries found for this date</div>
                )}
              </div>
            )}

            {!dailyData && !loading && (
              <div className="report-placeholder">
                Select a date and click Generate Report
              </div>
            )}
          </div>
        )}

        {/* ── MONTHLY TAB ── */}
        {activeTab === 'monthly' && (
          <div>
            <div className="filter-bar no-print">
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
                  onChange={e => setMonthYear(e.target.value)}
                />
              </div>
              <button
                className="btn-primary"
                onClick={fetchMonthly}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>

            {monthlyData && (
              <div>
                <div className="print-header">
                  <h2>VegCenter — Monthly Report</h2>
                  <p>{monthNames[monthMonth - 1]} {monthYear}</p>
                </div>

                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="summary-label">Total Entries</span>
                    <span className="summary-value">{monthlyData.total_entries}</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-label">Total Amount</span>
                    <span className="summary-value">Rs. {Number(monthlyData.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-card paid-card">
                    <span className="summary-label">Total Paid</span>
                    <span className="summary-value">Rs. {Number(monthlyData.total_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-card pending-card">
                    <span className="summary-label">Total Pending</span>
                    <span className="summary-value">Rs. {Number(monthlyData.total_pending || 0).toFixed(2)}</span>
                  </div>
                </div>

                {monthlyBreakdown.length > 0 && (
                  <div className="report-table-wrap">
                    <h3>Farmer Breakdown</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Farmer</th>
                          <th>Entries</th>
                          <th>Total (Rs.)</th>
                          <th>Paid (Rs.)</th>
                          <th>Pending (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyBreakdown.map((row, i) => (
                          <tr key={row.far_id}>
                            <td>{i + 1}</td>
                            <td>{row.farmer_name}</td>
                            <td>{row.total_entries}</td>
                            <td>Rs. {Number(row.total_amount).toFixed(2)}</td>
                            <td>Rs. {Number(row.total_paid).toFixed(2)}</td>
                            <td>Rs. {Number(row.total_pending).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="total-row">
                          <td colSpan="2">Total</td>
                          <td>{monthlyData.total_entries}</td>
                          <td>Rs. {Number(monthlyData.total_amount || 0).toFixed(2)}</td>
                          <td>Rs. {Number(monthlyData.total_paid || 0).toFixed(2)}</td>
                          <td>Rs. {Number(monthlyData.total_pending || 0).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {monthlyBreakdown.length === 0 && (
                  <div className="empty">No entries found for this month</div>
                )}
              </div>
            )}

            {!monthlyData && !loading && (
              <div className="report-placeholder">
                Select a month and year then click Generate Report
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;