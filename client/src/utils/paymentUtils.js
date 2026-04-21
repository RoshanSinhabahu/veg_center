export function getSettings() {
  return {
    deferLimit:  Number(localStorage.getItem('deferLimit') || 5000),
    paymentDays: JSON.parse(localStorage.getItem('paymentDays') || '[3, 6]'),
  };
}

export function getNextPaymentDay() {
  const { paymentDays } = getSettings();
  const today   = new Date();
  const todayDay = today.getDay();

  let minDays = 7;
  for (const day of paymentDays) {
    let diff = (day - todayDay + 7) % 7 || 7;
    if (diff < minDays) minDays = diff;
  }

  const next = new Date(today);
  next.setDate(today.getDate() + minDays);
  return next.toISOString().split('T')[0];
}

// Now checks total AMOUNT (Rs.) not quantity (kg)
export function shouldDefer(totalAmount) {
  const { deferLimit } = getSettings();
  return Number(totalAmount) > deferLimit;
}

export function calcItemAmount(quantity, price) {
  return (Number(quantity) * Number(price)).toFixed(2);
}

export function calcTotal(items) {
  return items
    .reduce((sum, item) => sum + Number(item.amount), 0)
    .toFixed(2);
}