import { useState, useEffect } from 'react';
import './Settings.css';

const DAY_NAMES = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function Settings() {
  const [deferLimit,   setDeferLimit]   = useState(5);
  const [paymentDays,  setPaymentDays]  = useState([3, 6]);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const storedLimit = localStorage.getItem('deferLimit');
    const storedDays  = localStorage.getItem('paymentDays');
    if (storedLimit) setDeferLimit(Number(storedLimit));
    if (storedDays)  setPaymentDays(JSON.parse(storedDays));
  }, []);

  const toggleDay = (value) => {
    setPaymentDays(prev =>
      prev.includes(value)
        ? prev.filter(d => d !== value)
        : [...prev, value].sort()
    );
  };

  const handleSave = () => {
    if (deferLimit <= 0) {
      setError('Limit must be greater than 0');
      return;
    }
    if (paymentDays.length === 0) {
      setError('Please select at least one payment day');
      return;
    }
    localStorage.setItem('deferLimit',  deferLimit);
    localStorage.setItem('paymentDays', JSON.stringify(paymentDays));
    setError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setDeferLimit(5);
    setPaymentDays([3, 6]);
    localStorage.setItem('deferLimit',  5);
    localStorage.setItem('paymentDays', JSON.stringify([3, 6]));
    setError('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure system behaviour</p>
        </div>
      </div>

      {error  && <div className="error-msg">{error}</div>}
      {saved  && <div className="success-msg">Settings saved successfully!</div>}

      <div className="settings-grid">

        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Payment Threshold</h3>
            <p>
              Entries below this quantity (kg) are paid immediately.
              Entries above are marked as pending.
            </p>
          </div>
          <div className="settings-card-body">
            <label>Quantity limit (kg)</label>
            <div className="limit-input-wrap">
              <input
                type="number"
                min="1"
                step="0.5"
                value={deferLimit}
                onChange={e => setDeferLimit(e.target.value)}
              />
              <span className="unit">kg</span>
            </div>
            <div className="threshold-hint">
              <div className="hint-row">
                <span className="status paid">PAID</span>
                <span>Total quantity ≤ {deferLimit} kg → paid instantly</span>
              </div>
              <div className="hint-row">
                <span className="status pending">PENDING</span>
                <span>Total quantity &gt; {deferLimit} kg → collect on payment day</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Payment Collection Days</h3>
            <p>
              Farmers with pending payments can collect their money on these days.
              The system auto-calculates the next available day when creating entries.
            </p>
          </div>
          <div className="settings-card-body">
            <label>Select payment days</label>
            <div className="days-grid">
              {DAY_NAMES.map(day => (
                <div
                  key={day.value}
                  className={`day-chip ${paymentDays.includes(day.value) ? 'selected' : ''}`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </div>
              ))}
            </div>
            {paymentDays.length > 0 && (
              <div className="selected-days">
                <span>Selected: </span>
                {paymentDays
                  .map(d => DAY_NAMES.find(n => n.value === d)?.label)
                  .join(', ')}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="settings-actions">
        <button className="btn-secondary" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className="btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default Settings;