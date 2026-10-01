// Tiny SQLite layer using Node's built-in sqlite module (no native deps).
import { DatabaseSync } from 'node:sqlite';

// On Render, point DB_PATH at the persistent disk, e.g. /var/data/data.db
const db = new DatabaseSync(process.env.DB_PATH || 'data.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    domain     TEXT NOT NULL,
    method     TEXT NOT NULL,              -- 'dns' | 'file' | 'meta'
    token      TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending', -- pending | verified | not_found | error
    reason     TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    checked_at TEXT
  )
`);

export function createVerification(domain, method, token) {
  return db
    .prepare('INSERT INTO verifications (domain, method, token) VALUES (?, ?, ?) RETURNING *')
    .get(domain, method, token);
}

export function getVerification(id) {
  return db.prepare('SELECT * FROM verifications WHERE id = ?').get(id);
}

export function listVerifications() {
  return db.prepare('SELECT * FROM verifications ORDER BY id DESC LIMIT 50').all();
}

export function saveResult(id, status, reason) {
  return db
    .prepare(
      "UPDATE verifications SET status = ?, reason = ?, checked_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(status, reason, id);
}

export function deleteVerification(id) {
  db.prepare('DELETE FROM verifications WHERE id = ?').run(id);
}
