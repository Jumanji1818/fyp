// Procura local database (SQLite, built into Electron's Node - no native add-ons to compile).
// Collections of records (requests, tenders, bids, ...) are stored one row per record; singletons in `kv`.
const { DatabaseSync } = require('node:sqlite');

function openDatabase(file) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS collections (name TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL,
      id         TEXT NOT NULL,
      pos        INTEGER NOT NULL,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (collection, id)
    );
    CREATE INDEX IF NOT EXISTS records_order ON records (collection, pos);
    CREATE TABLE IF NOT EXISTS kv (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const q = {
    names: db.prepare('SELECT name FROM collections'),
    rows: db.prepare('SELECT data FROM records WHERE collection = ? ORDER BY pos'),
    ids: db.prepare('SELECT id FROM records WHERE collection = ?'),
    upsert: db.prepare(`INSERT INTO records (collection, id, pos, data) VALUES (?, ?, ?, ?)
      ON CONFLICT (collection, id) DO UPDATE SET data = excluded.data, pos = excluded.pos, updated_at = datetime('now')
      WHERE records.data != excluded.data OR records.pos != excluded.pos`),
    delRow: db.prepare('DELETE FROM records WHERE collection = ? AND id = ?'),
    delColl: db.prepare('DELETE FROM records WHERE collection = ?'),
    addColl: db.prepare('INSERT OR IGNORE INTO collections (name) VALUES (?)'),
    delCollName: db.prepare('DELETE FROM collections WHERE name = ?'),
    kvAll: db.prepare('SELECT key, value FROM kv'),
    kvSet: db.prepare(`INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = datetime('now') WHERE kv.value != excluded.value`),
    kvDel: db.prepare('DELETE FROM kv WHERE key = ?'),
  };

  const tx = (fn) => {
    db.exec('BEGIN');
    try { fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
  };
  const isRecordList = (v) => Array.isArray(v) && v.every((x) => x && typeof x === 'object' && !Array.isArray(x) && typeof x.id === 'string');

  return {
    file,
    loadAll() {
      const out = {};
      for (const { name } of q.names.all()) {
        out[name] = '[' + q.rows.all(name).map((r) => r.data).join(',') + ']';
      }
      for (const { key, value } of q.kvAll.all()) out[key] = value;
      return out;
    },
    setItem(key, json) {
      let value;
      try { value = JSON.parse(json); } catch { value = undefined; }
      tx(() => {
        if (isRecordList(value)) {
          q.kvDel.run(key);
          q.addColl.run(key);
          const keep = new Set(value.map((r) => r.id));
          for (const { id } of q.ids.all(key)) if (!keep.has(id)) q.delRow.run(key, id);
          value.forEach((r, i) => q.upsert.run(key, r.id, i, JSON.stringify(r)));
        } else {
          q.delColl.run(key);
          q.delCollName.run(key);
          q.kvSet.run(key, json);
        }
      });
    },
    removeItem(key) {
      tx(() => { q.delColl.run(key); q.delCollName.run(key); q.kvDel.run(key); });
    },
    clear() {
      tx(() => { db.exec('DELETE FROM records; DELETE FROM collections; DELETE FROM kv;'); });
    },
    backupTo(dest) {
      db.exec(`VACUUM INTO '${String(dest).replace(/'/g, "''")}'`);
    },
    close() { db.close(); },
  };
}

module.exports = { openDatabase };
