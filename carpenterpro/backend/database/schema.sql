-- CarpenterPro Database Schema
-- Structural tables for Users and Projects

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  zip_code      TEXT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id   TEXT NOT NULL,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | complete | archived
  lump_sum      REAL,
  metadata      TEXT,  -- JSON blob for flexible per-template fields
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_sections (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_key   TEXT NOT NULL,  -- e.g. 'framing', 'flooring', 'trim'
  material_cost REAL NOT NULL DEFAULT 0,
  labor_cost    REAL NOT NULL DEFAULT 0,
  qty           REAL NOT NULL DEFAULT 0,
  unit          TEXT,
  notes         TEXT,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  project_id    TEXT,
  action        TEXT NOT NULL,  -- push | pull | conflict_resolved
  payload_hash  TEXT,
  synced_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id       ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_proj  ON project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_user          ON sync_log(user_id);
