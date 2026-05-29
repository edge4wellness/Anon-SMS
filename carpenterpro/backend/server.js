const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database', 'carpenterpro.db');

app.use(cors());
app.use(express.json());

// ── Database bootstrap ────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8'));
db.exec(fs.readFileSync(path.join(__dirname, 'database', 'seed_data.sql'), 'utf8'));

// ── Auth middleware (JWT placeholder) ─────────────────────────────────────────

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = token; // TODO: verify real JWT
  next();
}

// ── Users ─────────────────────────────────────────────────────────────────────

app.post('/users/register', (req, res) => {
  const { businessName, email, phone, zipCode } = req.body;
  if (!businessName || !email || !zipCode) {
    return res.status(400).json({ error: 'businessName, email, and zipCode are required' });
  }
  const userId = `USR-${Date.now()}`;
  const now = new Date().toISOString();
  try {
    db.prepare(
      `INSERT INTO users (user_id, business_name, email, phone, region_zip_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, businessName, email.toLowerCase(), phone ?? null, zipCode, now);
    res.status(201).json({ userId, businessName, email, zipCode });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

app.get('/users/:userId', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── Projects ──────────────────────────────────────────────────────────────────

app.get('/projects', requireAuth, (req, res) => {
  const projects = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY last_modified_at DESC')
    .all(req.userId);
  res.json(projects);
});

app.post('/projects', requireAuth, (req, res) => {
  const { customerName, customerAddress, projectType, markupPercent } = req.body;
  const projectId = `PRJ-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (project_id, user_id, customer_name, customer_address, project_type, markup_percent, created_at, last_modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(projectId, req.userId, customerName ?? null, customerAddress ?? null,
        projectType ?? null, markupPercent ?? 20.0, now, now);
  res.status(201).json({ projectId, status: 'draft' });
});

app.get('/projects/:projectId', requireAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE project_id = ? AND user_id = ?')
    .get(req.params.projectId, req.userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const sections = db.prepare('SELECT * FROM sections WHERE project_id = ?')
    .all(project.project_id);
  const materials = db.prepare('SELECT * FROM materials WHERE project_id = ?')
    .all(project.project_id);
  const laborRows = db.prepare('SELECT * FROM labor WHERE project_id = ?')
    .all(project.project_id);

  res.json({ ...project, sections, materials, labor: laborRows });
});

// ── Sections ──────────────────────────────────────────────────────────────────

app.post('/projects/:projectId/sections', requireAuth, (req, res) => {
  const { areaName, lengthFt, widthFt } = req.body;
  if (!areaName) return res.status(400).json({ error: 'areaName is required' });
  const sectionId = `SEC-${Date.now()}`;
  db.prepare(
    `INSERT INTO sections (section_id, project_id, area_name, length_ft, width_ft)
     VALUES (?, ?, ?, ?, ?)`
  ).run(sectionId, req.params.projectId, areaName, lengthFt ?? null, widthFt ?? null);
  res.status(201).json({ sectionId });
});

// ── Cloud sync ────────────────────────────────────────────────────────────────
// Accepts full project payload from device. Uses last_modified_at for
// last-write-wins conflict resolution — the server only updates a project
// if the incoming timestamp is newer.

app.post('/sync', requireAuth, (req, res) => {
  const { projects: incoming = [] } = req.body;
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: 'projects must be an array' });
  }

  const upsertProject = db.prepare(`
    INSERT INTO projects
      (project_id, user_id, customer_name, customer_address, project_type, status,
       total_materials_cost, total_labor_cost, markup_percent, total_bid, created_at, last_modified_at)
    VALUES
      (@project_id, @user_id, @customer_name, @customer_address, @project_type, @status,
       @total_materials_cost, @total_labor_cost, @markup_percent, @total_bid, @created_at, @last_modified_at)
    ON CONFLICT(project_id) DO UPDATE SET
      customer_name        = excluded.customer_name,
      customer_address     = excluded.customer_address,
      project_type         = excluded.project_type,
      status               = excluded.status,
      total_materials_cost = excluded.total_materials_cost,
      total_labor_cost     = excluded.total_labor_cost,
      markup_percent       = excluded.markup_percent,
      total_bid            = excluded.total_bid,
      last_modified_at     = excluded.last_modified_at
    WHERE excluded.last_modified_at > projects.last_modified_at
  `);

  const upsertMaterial = db.prepare(`
    INSERT OR REPLACE INTO materials
      (material_id, section_id, project_id, item_name, category, qty, unit, unit_cost)
    VALUES
      (@material_id, @section_id, @project_id, @item_name, @category, @qty, @unit, @unit_cost)
  `);

  const upsertLabor = db.prepare(`
    INSERT OR REPLACE INTO labor
      (labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate)
    VALUES
      (@labor_id, @section_id, @project_id, @task_description, @crew_size, @hours_estimated, @hourly_rate)
  `);

  const syncBatch = db.transaction((rows) => {
    let synced = 0;
    for (const p of rows) {
      upsertProject.run({ ...p, user_id: req.userId });
      (p.materials ?? []).forEach(m => upsertMaterial.run(m));
      (p.labor ?? []).forEach(l => upsertLabor.run(l));
      synced++;
    }
    return synced;
  });

  const synced = syncBatch(incoming);
  res.json({ synced });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`CarpenterPro server listening on port ${PORT}`));
module.exports = app;
