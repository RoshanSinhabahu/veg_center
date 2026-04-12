const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all farmers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Farmer ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single farmer by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Farmer WHERE far_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new farmer
router.post('/', async (req, res) => {
  try {
    const { name, address, phone_num, acc_num } = req.body;
    const [result] = await db.query(
      'INSERT INTO Farmer (name, address, phone_num, acc_num) VALUES (?, ?, ?, ?)',
      [name, address, phone_num, acc_num]
    );
    res.status(201).json({ message: 'Farmer added', far_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update farmer
router.put('/:id', async (req, res) => {
  try {
    const { name, address, phone_num, acc_num } = req.body;
    await db.query(
      'UPDATE Farmer SET name=?, address=?, phone_num=?, acc_num=? WHERE far_id=?',
      [name, address, phone_num, acc_num, req.params.id]
    );
    res.json({ message: 'Farmer updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete farmer
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Farmer WHERE far_id = ?', [req.params.id]);
    res.json({ message: 'Farmer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;