const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const farmerRoutes = require('./routes/farmers');
const produceRoutes = require('./routes/produce');
const entryRoutes = require('./routes/entries');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/farmers', farmerRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ message: 'Vegcenter API is running and DB is connected' });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});