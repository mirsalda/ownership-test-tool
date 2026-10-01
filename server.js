import express from 'express';
import crypto from 'node:crypto';
import * as db from './db.js';
import { normalizeDomain } from './domain.js';
import * as dns from './methods/dns.js';

// Each verification method is a module exporting { label, instructions(), check() }.
const METHODS = { dns };

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Attach the "what to add" instructions to a DB row before sending it to the browser.
function present(row) {
  const method = METHODS[row.method];
  return {
    ...row,
    methodLabel: method?.label ?? row.method,
    instructions: method?.instructions(row.domain, row.token) ?? null,
  };
}

app.get('/api/methods', (req, res) => {
  res.json(Object.entries(METHODS).map(([id, m]) => ({ id, label: m.label })));
});

app.get('/api/verifications', (req, res) => {
  res.json(db.listVerifications().map(present));
});

app.post('/api/verifications', (req, res) => {
  const domain = normalizeDomain(req.body?.domain);
  const method = req.body?.method;
  if (!domain) return res.status(400).json({ error: 'Please enter a valid domain, e.g. example.com' });
  if (!METHODS[method]) return res.status(400).json({ error: `Unknown method: ${method}` });

  const token = crypto.randomBytes(24).toString('hex'); // 48 hex chars = 192 bits
  res.status(201).json(present(db.createVerification(domain, method, token)));
});

app.post('/api/verifications/:id/check', async (req, res) => {
  const row = db.getVerification(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Not found' });

  let result;
  try {
    result = await METHODS[row.method].check(row.domain, row.token);
  } catch (err) {
    result = { status: 'error', reason: `Unexpected error: ${err.message}` };
  }
  res.json(present(db.saveResult(row.id, result.status, result.reason)));
});

app.delete('/api/verifications/:id', (req, res) => {
  db.deleteVerification(Number(req.params.id));
  res.status(204).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
