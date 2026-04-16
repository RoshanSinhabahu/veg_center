import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import './Dashboard.css';

function toLocalDate(iso) {
  return new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
}

function lastNDates(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString('en-CA');
  });
}

export default function Dashboard() {
  const [farmers, setFarmers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([axios.get('/api/farmers'), axios.get('/api/entries')])
      .then(([f, e]) => {
        setFarmers(f.data);
        setEntries(e.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  // ── derived stats ─────────────────────────────────────────────────────────

  const pendingEntries = entries.filter(e => e.payment_status === 'pending');
  const totalPending = pendingEntries.reduce((s, e) => s + Number(e.total_amount), 0);

  // ── Revenue last 7 days ───────────────────────────────────────────────────

  const last7 = lastNDates(7);
  const revenueByDay = last7.map(date => {
    const rev = entries
      .filter(e => toLocalDate(e.date) === date && e.payment_status === 'paid')
      .reduce((s, e) => s + Number(e.total_amount), 0);
    return { date: date.slice(5), revenue: parseFloat(rev.toFixed(2)) };
  });

  // ── Upcoming payments (next 3 days) ──────────────────────────────────────

  const todayStr = new Date().toLocaleDateString('en-CA');
  const upcoming = pendingEntries
    .filter(e => {
      if (!e.expected_pay_date) return false;
      const diff = Math.ceil(
        (new Date(toLocalDate(e.expected_pay_date)) - new Date(todayStr)) /
        (1000 * 60 * 60 * 24)
      );
      return diff >= 0 && diff <= 3;
    })
    .sort((a, b) => new Date(a.expected_pay_date) - new Date(b.expected_pay_date));

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="page dash-page">

      {/* header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* main layout */}
      <div className="dash-layout">
        {/* LEFT — stat cards on top, chart below */}
        <div className="dash-left">

          {/* stat cards */}
          <div className="dash-cards">
            <StatCard
              label="Total Farmers"
              value={farmers.length}
              icon="👨‍🌾"
              color="blue"
            />
            <StatCard
              label="Pending Amount"
              value={`Rs. ${totalPending.toFixed(2)}`}
              sub={`${pendingEntries.length} pending entries`}
              icon="⏳"
              color="red"
            />
          </div>

          {/* Revenue line chart */}
          <div className="chart-card dash-chart">
            <h3>Revenue — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height="90%" style={{ flex: 1, minHeight: 0 }}>
              <LineChart data={revenueByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#aaa' }} />
                <YAxis tick={{ fontSize: 12, fill: '#aaa' }} tickFormatter={v => `Rs.${v}`} />
                <Tooltip formatter={v => [`Rs. ${v}`, 'Revenue']} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#34c97b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#34c97b' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* RIGHT — upcoming payments spanning full height */}
        <div className="chart-card-2 dash-right">
          <h3 className='table-header'>
            Upcoming Payments
            <span className="badge-sub">next 3 days</span>
          </h3>
          {upcoming.length === 0 ? (
            <div className="chart-empty">No payments due in the next 3 days 🎉</div>
          ) : (
            <div className="upcoming-list">
              {upcoming.map(e => {
                const due = toLocalDate(e.expected_pay_date);
                const diff = Math.ceil(
                  (new Date(due) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
                );
                const label =
                  diff === 0 ? 'Today' :
                    diff === 1 ? 'Tomorrow' :
                      `In ${diff} days`;
                return (
                  <div key={e.entry_id} className="upcoming-row">
                    <div className="upcoming-info">
                      <span className="upcoming-farmer">{e.farmer_name}</span>
                      <span className="upcoming-date">{due}</span>
                    </div>
                    <div className="upcoming-right">
                      <span className="upcoming-amount">Rs. {e.total_amount}</span>
                      <span className={`upcoming-badge ${diff === 0 ? 'due-today' : ''}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}
