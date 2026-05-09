'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.43.77:3000',
  ],
  credentials: true,
}));

app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    cluster:   process.env.CLUSTER || 'devnet',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/api', routes);

// ── 404 fallback ─────────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('════════════════════════════════════════════════');
  console.log('  Circuit Backend');
  console.log('════════════════════════════════════════════════');
  console.log(`  Port    : ${PORT}`);
  console.log(`  Cluster : ${process.env.CLUSTER || 'devnet'}`);
  console.log(`  Escrow  : ${process.env.ESCROW_PROGRAM_ID}`);
  console.log(`  Drops   : ${process.env.DROPS_PROGRAM_ID}`);
  console.log('════════════════════════════════════════════════');
});
