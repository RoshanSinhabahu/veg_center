const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, f.name AS farmer_name
      FROM Payment p
      JOIN Farmer f ON p.far_id = f.far_id
      ORDER BY p.pay_id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending entries per farmer (for Tuesday/Friday payments)
router.get('/pending', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.far_id, f.name AS farmer_name,
             COUNT(e.entry_id) AS pending_entries,
             SUM(e.total_amount) AS total_pending
      FROM Entries e
      JOIN Farmer f ON e.far_id = f.far_id
      WHERE e.payment_status = 'pending'
      GROUP BY f.far_id, f.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new payment
router.post('/', async (req, res) => {
  try {
    const { far_id, amount, status, notes } = req.body;
    const [result] = await db.query(
      'INSERT INTO Payment (far_id, amount, status, notes) VALUES (?, ?, ?, ?)',
      [far_id, amount, status, notes]
    );
    res.status(201).json({ message: 'Payment recorded', pay_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;