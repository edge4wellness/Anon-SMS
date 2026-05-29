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
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      subscription_tier TEXT DEFAULT 'free',
      default_markup_percent REAL DEFAULT 20.0,
      region_zip_code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      user_id TEXT,
      customer_name TEXT,
      customer_address TEXT,
      project_type TEXT,
      status TEXT DEFAULT 'draft',
      total_materials_cost REAL DEFAULT 0.0,
      total_labor_cost REAL DEFAULT 0.0,
      markup_percent REAL DEFAULT 20.0,
      total_bid REAL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      last_modified_at TEXT NOT NULL
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS sections (
      section_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      area_name TEXT NOT NULL,
      length_ft REAL,
      width_ft REAL,
      photo_url_1 TEXT,
      photo_url_2 TEXT
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS materials (
      material_id TEXT PRIMARY KEY,
      section_id TEXT,
      project_id TEXT,
      item_name TEXT NOT NULL,
      category TEXT,
      qty REAL DEFAULT 0.0,
      unit TEXT,
      unit_cost REAL DEFAULT 0.0
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS labor (
      labor_id TEXT PRIMARY KEY,
      section_id TEXT,
      project_id TEXT,
      task_description TEXT NOT NULL,
      crew_size INTEGER DEFAULT 1,
      hours_estimated REAL DEFAULT 0.0,
      hourly_rate REAL DEFAULT 65.0
    )
  `);

  // Tracks rows modified offline that need a cloud push
  await exec(`
    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      row_id TEXT NOT NULL,
      queued_at TEXT DEFAULT (datetime('now')),
      UNIQUE(table_name, row_id)
    )
  `);
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function upsertProject(project) {
  const {
    project_id, user_id, customer_name, customer_address, project_type, status,
    total_materials_cost, total_labor_cost, markup_percent, total_bid,
    created_at, last_modified_at,
  } = project;
  await exec(
    `INSERT OR REPLACE INTO projects
       (project_id, user_id, customer_name, customer_address, project_type, status,
        total_materials_cost, total_labor_cost, markup_percent, total_bid, created_at, last_modified_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [project_id, user_id, customer_name, customer_address, project_type, status ?? 'draft',
     total_materials_cost ?? 0, total_labor_cost ?? 0, markup_percent ?? 20, total_bid ?? 0,
     created_at, last_modified_at]
  );
  await markPending('projects', project_id);
}

export async function getProjects(userId) {
  const r = await exec(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY last_modified_at DESC',
    [userId]
  );
  return rowsToArray(r);
}

export async function getProjectById(projectId) {
  const r = await exec('SELECT * FROM projects WHERE project_id = ?', [projectId]);
  return r.rows.length ? r.rows.item(0) : null;
}

// ── Sections ──────────────────────────────────────────────────────────────────

export async function upsertSection(section) {
  const { section_id, project_id, area_name, length_ft, width_ft, photo_url_1, photo_url_2 } = section;
  await exec(
    `INSERT OR REPLACE INTO sections (section_id, project_id, area_name, length_ft, width_ft, photo_url_1, photo_url_2)
     VALUES (?,?,?,?,?,?,?)`,
    [section_id, project_id, area_name, length_ft ?? null, width_ft ?? null,
     photo_url_1 ?? null, photo_url_2 ?? null]
  );
}

export async function getSectionsForProject(projectId) {
  const r = await exec('SELECT * FROM sections WHERE project_id = ? ORDER BY section_id', [projectId]);
  return rowsToArray(r);
}

// ── Materials ─────────────────────────────────────────────────────────────────

export async function upsertMaterial(material) {
  const { material_id, section_id, project_id, item_name, category, qty, unit, unit_cost } = material;
  await exec(
    `INSERT OR REPLACE INTO materials (material_id, section_id, project_id, item_name, category, qty, unit, unit_cost)
     VALUES (?,?,?,?,?,?,?,?)`,
    [material_id, section_id, project_id, item_name, category ?? null, qty ?? 0, unit ?? null, unit_cost ?? 0]
  );
  await markPending('materials', material_id);
}

export async function getMaterialsForProject(projectId) {
  const r = await exec('SELECT * FROM materials WHERE project_id = ? ORDER BY section_id, material_id', [projectId]);
  return rowsToArray(r);
}

// ── Labor ─────────────────────────────────────────────────────────────────────

export async function upsertLabor(laborRow) {
  const { labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate } = laborRow;
  await exec(
    `INSERT OR REPLACE INTO labor (labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate)
     VALUES (?,?,?,?,?,?,?)`,
    [labor_id, section_id, project_id, task_description, crew_size ?? 1, hours_estimated ?? 0, hourly_rate ?? 65]
  );
  await markPending('labor', labor_id);
}

export async function getLaborForProject(projectId) {
  const r = await exec('SELECT * FROM labor WHERE project_id = ? ORDER BY section_id, labor_id', [projectId]);
  return rowsToArray(r);
}

// ── Pending sync queue ────────────────────────────────────────────────────────

async function markPending(tableName, rowId) {
  await exec(
    'INSERT OR IGNORE INTO pending_sync (table_name, row_id) VALUES (?, ?)',
    [tableName, rowId]
  );
}

export async function getPendingSyncRows() {
  const r = await exec('SELECT * FROM pending_sync ORDER BY queued_at ASC');
  return rowsToArray(r);
}

export async function clearSyncedRows(ids) {
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(',');
  await exec(`DELETE FROM pending_sync WHERE id IN (${placeholders})`, ids);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowsToArray(result) {
  return Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i));
}
