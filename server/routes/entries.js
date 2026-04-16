const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all entries
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, f.name AS farmer_name
      FROM Entries e
      JOIN Farmer f ON e.far_id = f.far_id
      ORDER BY e.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single entry with its items
router.get('/:id', async (req, res) => {
  try {
    const [entry] = await db.query(`
      SELECT e.*, f.name AS farmer_name
      FROM Entries e
      JOIN Farmer f ON e.far_id = f.far_id
      WHERE e.entry_id = ?
    `, [req.params.id]);

    const [items] = await db.query(`
      SELECT ei.*, p.name AS produce_name
      FROM Entry_Items ei
      JOIN Produce p ON ei.produce_id = p.produce_id
      WHERE ei.entry_id = ?
    `, [req.params.id]);

    res.json({ ...entry[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new entry with items
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { far_id, date, total_amount, expected_pay_date,
            payment_method, payment_status, items } = req.body;

    const [result] = await conn.query(`
      INSERT INTO Entries
        (far_id, date, total_amount, expected_pay_date, payment_method, payment_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [far_id, date, total_amount, expected_pay_date, payment_method, payment_status]);

    const entry_id = result.insertId;

    for (const item of items) {
      await conn.query(`
        INSERT INTO Entry_Items (entry_id, produce_id, quantity, price_per_unit, amount)
        VALUES (?, ?, ?, ?, ?)
      `, [entry_id, item.produce_id, item.quantity, item.price_per_unit, item.amount]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Entry created', entry_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Update payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { payment_status, paid_time } = req.body;
    await db.query(
      'UPDATE Entries SET payment_status=?, paid_time=? WHERE entry_id=?',
      [payment_status, paid_time, req.params.id]
    );
    res.json({ message: 'Payment status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete entry
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Entries WHERE entry_id = ?', [req.params.id]);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;