import './Bill.css';

function Bill({ entry, farmer, items }) {
  const handlePrint = () => window.print();

  return (
    <div>
      <div className="bill-wrap" id="bill">
        <div className="bill-header">
          <h2>VegCenter</h2>
          <p>Vegetable Collecting Center</p>
          <hr />
        </div>

        <div className="bill-meta">
          <div>
            <span className="label">Bill No:</span>
            <span>#{entry.entry_id || 'NEW'}</span>
          </div>
          <div>
            <span className="label">Date:</span>
            <span>{entry.date}</span>
          </div>
          <div>
            <span className="label">Farmer:</span>
            <span>{farmer?.name}</span>
          </div>
          <div>
            <span className="label">Phone:</span>
            <span>{farmer?.phone_num || '—'}</span>
          </div>
        </div>

        <hr />

        <table className="bill-table">
          <thead>
            <tr>
              <th>Produce</th>
              <th>Qty (kg)</th>
              <th>Price/kg</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
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

        <div className="bill-total">
          <span>Total Amount</span>
          <span>Rs. {entry.total_amount}</span>
        </div>

        <div className="bill-payment">
          <div>
            <span className="label">Payment Method:</span>
            <span>{entry.payment_method}</span>
          </div>
          <div>
            <span className="label">Payment Status:</span>
            <span className={`status ${entry.payment_status}`}>
              {entry.payment_status?.toUpperCase()}
            </span>
          </div>
          {entry.payment_status === 'pending' && (
            <div>
              <span className="label">Expected Pay Date:</span>
              <span>{entry.expected_pay_date}</span>
            </div>
          )}
        </div>

        <div className="bill-footer">
          <p>Thank you!</p>
          <div className="signatures">
            <div>
              <hr />
              <p>Farmer Signature</p>
            </div>
            <div>
              <hr />
              <p>Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

      <button className="btn-print" onClick={handlePrint}>
        Print Bill
      </button>
    </div>
  );
}

export default Bill;