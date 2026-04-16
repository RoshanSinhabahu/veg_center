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

// Daily detail
router.get('/daily-detail', async (req, res) => {
  try {
    const { date } = req.query;
    const [rows] = await db.query(`
      SELECT e.*, f.name AS farmer_name
      FROM Entries e
      JOIN Farmer f ON e.far_id = f.far_id
      WHERE e.date = ?
      ORDER BY e.created_at ASC
    `, [date]);
    res.json(rows);
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

// Monthly breakdown per farmer
router.get('/monthly-breakdown', async (req, res) => {
  try {
    const { year, month } = req.query;
    const [rows] = await db.query(`
      SELECT
        f.far_id,
        f.name AS farmer_name,
        COUNT(e.entry_id) AS total_entries,
        SUM(e.total_amount) AS total_amount,
        SUM(CASE WHEN e.payment_status = 'paid' THEN e.total_amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN e.payment_status = 'pending' THEN e.total_amount ELSE 0 END) AS total_pending
      FROM Entries e
      JOIN Farmer f ON e.far_id = f.far_id
      WHERE YEAR(e.date) = ? AND MONTH(e.date) = ?
      GROUP BY f.far_id, f.name
      ORDER BY total_amount DESC
    `, [year, month]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;