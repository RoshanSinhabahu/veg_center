const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Get all stock levels
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.produce_id,
        p.name,
        p.price_per_unit,
        COALESCE(SUM(ei.quantity), 0)                          AS total_in,
        COALESCE(SUM(si.qty_out), 0)                           AS total_out,
        COALESCE(SUM(ei.quantity), 0) - COALESCE(SUM(si.qty_out), 0) AS available
      FROM Produce p
      LEFT JOIN entry_items ei ON p.produce_id = ei.produce_id
      LEFT JOIN (
        SELECT produce_id, SUM(quantity) AS qty_out
        FROM stock_sale_items
        GROUP BY produce_id
      ) si ON p.produce_id = si.produce_id
      GROUP BY p.produce_id, p.name, p.price_per_unit
      ORDER BY p.name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
router.get('/sales', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM stock_sales
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single sale with items
router.get('/sales/:id', async (req, res) => {
  try {
    const [sale] = await db.query(
      'SELECT * FROM stock_sales WHERE sale_id = ?',
      [req.params.id]
    );
    const [items] = await db.query(`
      SELECT ssi.*, p.name AS produce_name
      FROM stock_sale_items ssi
      JOIN Produce p ON ssi.produce_id = p.produce_id
      WHERE ssi.sale_id = ?
    `, [req.params.id]);
    res.json({ ...sale[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new sale
router.post('/sales', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { party_name, date, total_amount, notes, items } = req.body;

    const [result] = await conn.query(`
      INSERT INTO stock_sales (party_name, date, total_amount, notes)
      VALUES (?, ?, ?, ?)
    `, [party_name, date, total_amount, notes]);

    const sale_id = result.insertId;

    for (const item of items) {
      await conn.query(`
        INSERT INTO stock_sale_items (sale_id, produce_id, quantity, price_per_unit, amount)
        VALUES (?, ?, ?, ?, ?)
      `, [sale_id, item.produce_id, item.quantity, item.price_per_unit, item.amount]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Sale created', sale_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Delete sale
router.delete('/sales/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM stock_sales WHERE sale_id = ?', [req.params.id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily summary
router.get('/summary/daily', async (req, res) => {
  try {
    const { date } = req.query;

    const [stockIn] = await db.query(`
      SELECT
        p.name AS produce_name,
        COALESCE(SUM(ei.quantity), 0) AS qty_in
      FROM Produce p
      LEFT JOIN entry_items ei ON p.produce_id = ei.produce_id
      LEFT JOIN Entries e      ON ei.entry_id  = e.entry_id AND e.date = ?
      GROUP BY p.produce_id, p.name
      HAVING qty_in > 0
    `, [date]);

    const [stockOut] = await db.query(`
      SELECT
        p.name AS produce_name,
        COALESCE(SUM(ssi.quantity), 0) AS qty_out,
        COALESCE(SUM(ssi.amount),   0) AS amount_out
      FROM Produce p
      LEFT JOIN stock_sale_items ssi ON p.produce_id = ssi.produce_id
      LEFT JOIN stock_sales ss       ON ssi.sale_id  = ss.sale_id AND ss.date = ?
      GROUP BY p.produce_id, p.name
      HAVING qty_out > 0
    `, [date]);

    const [totals] = await db.query(`
      SELECT
        COALESCE(SUM(ssi.quantity), 0) AS total_qty_sold,
        COALESCE(SUM(ssi.amount),   0) AS total_amount_sold,
        COUNT(DISTINCT ss.sale_id)     AS total_sales
      FROM stock_sales ss
      LEFT JOIN stock_sale_items ssi ON ss.sale_id = ssi.sale_id
      WHERE ss.date = ?
    `, [date]);

    const [inTotals] = await db.query(`
      SELECT COALESCE(SUM(ei.quantity), 0) AS total_qty_in
      FROM entry_items ei
      JOIN Entries e ON ei.entry_id = e.entry_id
      WHERE e.date = ?
    `, [date]);

    res.json({
      stock_in:   stockIn,
      stock_out:  stockOut,
      total_sales:      totals[0].total_sales,
      total_qty_sold:   totals[0].total_qty_sold,
      total_amount_sold: totals[0].total_amount_sold,
      total_qty_in:     inTotals[0].total_qty_in,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly summary
router.get('/summary/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;

    const [stockIn] = await db.query(`
      SELECT
        p.name AS produce_name,
        COALESCE(SUM(ei.quantity), 0) AS qty_in
      FROM Produce p
      LEFT JOIN entry_items ei ON p.produce_id = ei.produce_id
      LEFT JOIN Entries e ON ei.entry_id = e.entry_id
        AND YEAR(e.date) = ? AND MONTH(e.date) = ?
      GROUP BY p.produce_id, p.name
      HAVING qty_in > 0
    `, [year, month]);

    const [stockOut] = await db.query(`
      SELECT
        p.name AS produce_name,
        COALESCE(SUM(ssi.quantity), 0) AS qty_out,
        COALESCE(SUM(ssi.amount),   0) AS amount_out
      FROM Produce p
      LEFT JOIN stock_sale_items ssi ON p.produce_id = ssi.produce_id
      LEFT JOIN stock_sales ss ON ssi.sale_id = ss.sale_id
        AND YEAR(ss.date) = ? AND MONTH(ss.date) = ?
      GROUP BY p.produce_id, p.name
      HAVING qty_out > 0
    `, [year, month]);

    const [totals] = await db.query(`
      SELECT
        COALESCE(SUM(ssi.quantity), 0) AS total_qty_sold,
        COALESCE(SUM(ssi.amount),   0) AS total_amount_sold,
        COUNT(DISTINCT ss.sale_id)     AS total_sales
      FROM stock_sales ss
      LEFT JOIN stock_sale_items ssi ON ss.sale_id = ssi.sale_id
      WHERE YEAR(ss.date) = ? AND MONTH(ss.date) = ?
    `, [year, month]);

    const [inTotals] = await db.query(`
      SELECT COALESCE(SUM(ei.quantity), 0) AS total_qty_in
      FROM entry_items ei
      JOIN Entries e ON ei.entry_id = e.entry_id
      WHERE YEAR(e.date) = ? AND MONTH(e.date) = ?
    `, [year, month]);

    const [available] = await db.query(`
      SELECT
        p.name AS produce_name,
        COALESCE(SUM(ei.quantity), 0) -
        COALESCE((
          SELECT SUM(ssi2.quantity)
          FROM stock_sale_items ssi2
          WHERE ssi2.produce_id = p.produce_id
        ), 0) AS available
      FROM Produce p
      LEFT JOIN entry_items ei ON p.produce_id = ei.produce_id
      GROUP BY p.produce_id, p.name
      HAVING available > 0
    `);

    res.json({
      stock_in:          stockIn,
      stock_out:         stockOut,
      available,
      total_sales:       totals[0].total_sales,
      total_qty_sold:    totals[0].total_qty_sold,
      total_amount_sold: totals[0].total_amount_sold,
      total_qty_in:      inTotals[0].total_qty_in,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;