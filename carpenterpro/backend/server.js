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

const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
db.exec(schema);

const seedPath = path.join(__dirname, 'database', 'seed_data.sql');
if (fs.existsSync(seedPath)) {
  db.exec(fs.readFileSync(seedPath, 'utf8'));
}

// ── Auth helpers (JWT-lite placeholder) ───────────────────────────────────────

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // TODO: replace with real JWT verification
  req.userId = token;
  next();
}

// ── User endpoints ────────────────────────────────────────────────────────────

app.post('/users/register', (req, res) => {
  const { email, businessName, zipCode } = req.body;
  if (!email || !businessName || !zipCode) {
    return res.status(400).json({ error: 'email, businessName, and zipCode are required' });
  }
  const id = uuidv4();
  try {
    db.prepare(
      'INSERT INTO users (id, email, business_name, zip_code) VALUES (?, ?, ?, ?)'
    ).run(id, email.toLowerCase(), businessName, zipCode);
    res.status(201).json({ id, email, businessName, zipCode });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

app.get('/users/:id', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── Template endpoints ────────────────────────────────────────────────────────

app.get('/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM project_templates').all();
  res.json(templates.map(t => ({ ...t, sections: JSON.parse(t.sections) })));
});

// ── Project endpoints ─────────────────────────────────────────────────────────

app.get('/projects', requireAuth, (req, res) => {
  const projects = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.userId);
  res.json(projects);
});

app.post('/projects', requireAuth, (req, res) => {
  const { templateId, name } = req.body;
  if (!templateId || !name) {
    return res.status(400).json({ error: 'templateId and name are required' });
  }
  const id = uuidv4();
  db.prepare(
    'INSERT INTO projects (id, user_id, template_id, name) VALUES (?, ?, ?, ?)'
  ).run(id, req.userId, templateId, name);
  res.status(201).json({ id, userId: req.userId, templateId, name, status: 'active' });
});

// ── Cloud sync endpoint ───────────────────────────────────────────────────────
// Accepts a batch of project_sections from the device, applies last-write-wins
// using the client-supplied updated_at timestamp.

app.post('/sync', requireAuth, (req, res) => {
  const { sections = [] } = req.body;
  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: 'sections must be an array' });
  }

  const upsert = db.prepare(`
    INSERT INTO project_sections (id, project_id, section_key, material_cost, labor_cost, qty, unit, notes, updated_at)
    VALUES (@id, @project_id, @section_key, @material_cost, @labor_cost, @qty, @unit, @notes, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      material_cost = excluded.material_cost,
      labor_cost    = excluded.labor_cost,
      qty           = excluded.qty,
      unit          = excluded.unit,
      notes         = excluded.notes,
      updated_at    = excluded.updated_at
    WHERE excluded.updated_at > project_sections.updated_at
  `);

  const syncMany = db.transaction((rows) => rows.forEach(r => upsert.run(r)));
  syncMany(sections);

  db.prepare(
    'INSERT INTO sync_log (user_id, action, payload_hash) VALUES (?, ?, ?)'
  ).run(req.userId, 'push', String(sections.length));

  res.json({ synced: sections.length });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`CarpenterPro server listening on port ${PORT}`));

module.exports = app;
