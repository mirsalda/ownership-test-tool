# Ownership Test Tool

A tiny tool for testing domain ownership verification: DNS TXT (file upload and meta tag coming next).

## Run locally

Requires Node 24+ (uses the built-in `node:sqlite`).

```
npm install
npm run dev        # http://localhost:4000, restarts on file changes
```

Data is stored in `data.db` (override with `DB_PATH`).

## Project layout

| File | What it does |
|---|---|
| `server.js` | Express routes: create token, list, check, delete |
| `db.js` | SQLite table + queries |
| `domain.js` | Cleans up user input into a bare domain |
| `methods/dns.js` | DNS TXT instructions + real lookup |
| `public/index.html` | The whole UI (plain HTML + JS) |

Each method module exports `label`, `instructions(domain, token)` and `check(domain, token)`,
returning `{ status: 'verified' | 'not_found' | 'error', reason }`.

## Deploy to Render (free)

1. Push this folder to a GitHub repo.
2. In Render: **New > Blueprint**, select the repo, click **Apply**. It reads `render.yaml`.
3. You get `https://ownership-test-tool-xxxx.onrender.com` with HTTPS. No env vars needed.

Free plan caveats: the SQLite file is wiped on every redeploy/restart, and the app sleeps after
~15 min idle (the first request then takes ~30–60s to wake it up).

To keep data, switch to a paid plan, add a disk mounted at `/var/data`, and set `DB_PATH=/var/data/data.db`.
