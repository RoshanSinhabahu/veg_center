const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all produce
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Produce ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new produce
router.post('/', async (req, res) => {
  try {
    const { name, price_per_unit } = req.body;
    const [result] = await db.query(
      'INSERT INTO Produce (name, price_per_unit) VALUES (?, ?)',
      [name, price_per_unit]
    );
    res.status(201).json({ message: 'Produce added', produce_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update produce price
router.put('/:id', async (req, res) => {
  try {
    const { name, price_per_unit } = req.body;
    await db.query(
      'UPDATE Produce SET name=?, price_per_unit=? WHERE produce_id=?',
      [name, price_per_unit, req.params.id]
    );
    res.json({ message: 'Produce updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete produce
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Produce WHERE produce_id = ?', [req.params.id]);
    res.json({ message: 'Produce deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;