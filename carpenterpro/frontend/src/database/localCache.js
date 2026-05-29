import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('carpenterpro.db');

function exec(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, err) => { reject(err); return true; }
      );
    });
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

export async function initLocalDB() {
  await exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      name        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'active',
      lump_sum    REAL,
      metadata    TEXT,
      updated_at  TEXT NOT NULL
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS project_sections (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      section_key   TEXT NOT NULL,
      material_cost REAL NOT NULL DEFAULT 0,
      labor_cost    REAL NOT NULL DEFAULT 0,
      qty           REAL NOT NULL DEFAULT 0,
      unit          TEXT,
      notes         TEXT,
      updated_at    TEXT NOT NULL
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS pending_sync (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      row_id     TEXT NOT NULL,
      queued_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function upsertProject(project) {
  const { id, templateId, name, status, lumpSum, metadata, updatedAt } = project;
  await exec(
    `INSERT OR REPLACE INTO projects (id, template_id, name, status, lump_sum, metadata, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, templateId, name, status ?? 'active', lumpSum ?? null, JSON.stringify(metadata ?? {}), updatedAt]
  );
  await markPendingSync('projects', id);
}

export async function getProjects() {
  const result = await exec('SELECT * FROM projects ORDER BY updated_at DESC');
  return Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i));
}

export async function getProjectById(id) {
  const result = await exec('SELECT * FROM projects WHERE id = ?', [id]);
  return result.rows.length ? result.rows.item(0) : null;
}

// ── Sections ──────────────────────────────────────────────────────────────────

export async function upsertSection(section) {
  const { id, projectId, sectionKey, materialCost, laborCost, qty, unit, notes, updatedAt } = section;
  await exec(
    `INSERT OR REPLACE INTO project_sections
       (id, project_id, section_key, material_cost, labor_cost, qty, unit, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, projectId, sectionKey, materialCost ?? 0, laborCost ?? 0, qty ?? 0, unit ?? null, notes ?? null, updatedAt]
  );
  await markPendingSync('project_sections', id);
}

export async function getSectionsForProject(projectId) {
  const result = await exec(
    'SELECT * FROM project_sections WHERE project_id = ? ORDER BY section_key',
    [projectId]
  );
  return Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i));
}

// ── Pending sync queue ────────────────────────────────────────────────────────

async function markPendingSync(tableName, rowId) {
  await exec(
    `INSERT OR IGNORE INTO pending_sync (table_name, row_id) VALUES (?, ?)`,
    [tableName, rowId]
  );
}

export async function getPendingSyncRows() {
  const result = await exec('SELECT * FROM pending_sync ORDER BY queued_at ASC');
  return Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i));
}

export async function clearSyncedRows(ids) {
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(',');
  await exec(`DELETE FROM pending_sync WHERE id IN (${placeholders})`, ids);
}
