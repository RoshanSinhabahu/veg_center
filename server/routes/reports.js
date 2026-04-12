const express = require('express');
const router = express.Router();
const db = require('../db');

// Daily summary
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const [rows] = await db.query(`
      SELECT
        COUNT(e.entry_id) AS total_entries,
        SUM(e.total_amount) AS total_amount,
        SUM(CASE WHEN e.payment_status = 'paid' THEN e.total_amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN e.payment_status = 'pending' THEN e.total_amount ELSE 0 END) AS total_pending
      FROM Entries e
      WHERE e.date = ?
    `, [date]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly summary
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const [rows] = await db.query(`
      SELECT
        COUNT(e.entry_id) AS total_entries,
        SUM(e.total_amount) AS total_amount,
        SUM(CASE WHEN e.payment_status = 'paid' THEN e.total_amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN e.payment_status = 'pending' THEN e.total_amount ELSE 0 END) AS total_pending
      FROM Entries e
      WHERE YEAR(e.date) = ? AND MONTH(e.date) = ?
    `, [year, month]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;