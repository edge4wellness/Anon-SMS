-- CarpenterPro Database Schema

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,          -- e.g., 'USR-001'
    business_name TEXT NOT NULL,       -- 'BECK BUILDER'
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    subscription_tier TEXT DEFAULT 'free', -- 'free' or 'individual'
    default_markup_percent REAL DEFAULT 20.0,
    region_zip_code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,        -- e.g., 'PRJ-001'
    user_id TEXT REFERENCES users(user_id),
    customer_name TEXT,
    customer_address TEXT,
    project_type TEXT,                  -- 'Deck Construction', 'Framing'
    status TEXT DEFAULT 'draft',        -- 'draft', 'sent', 'accepted'
    total_materials_cost REAL DEFAULT 0.0,
    total_labor_cost REAL DEFAULT 0.0,
    markup_percent REAL DEFAULT 20.0,
    total_bid REAL DEFAULT 0.0,
    created_at TEXT NOT NULL,
    last_modified_at TEXT NOT NULL      -- CRITICAL: Used by syncEngine.js for offline conflicts
);

-- 3. SECTIONS TABLE (Breaks down rooms or sub-areas)
CREATE TABLE IF NOT EXISTS sections (
    section_id TEXT PRIMARY KEY,        -- e.g., 'SEC-001'
    project_id TEXT REFERENCES projects(project_id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,            -- 'Main Deck', 'Steps & Landing'
    length_ft REAL,
    width_ft REAL,
    photo_url_1 TEXT,
    photo_url_2 TEXT
);

-- 4. MATERIALS TABLE (Itemized costs)
CREATE TABLE IF NOT EXISTS materials (
    material_id TEXT PRIMARY KEY,       -- e.g., 'MAT-001'
    section_id TEXT REFERENCES sections(section_id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(project_id),
    item_name TEXT NOT NULL,            -- '5/4x6x16 Composite Decking'
    category TEXT,                      -- 'Lumber', 'Hardware', 'Fasteners'
    qty REAL DEFAULT 0.0,
    unit TEXT,                          -- 'ea', 'box', 'lf'
    unit_cost REAL DEFAULT 0.0
);

-- 5. LABOR TABLE (Itemized crews and times)
CREATE TABLE IF NOT EXISTS labor (
    labor_id TEXT PRIMARY KEY,          -- e.g., 'LAB-001'
    section_id TEXT REFERENCES sections(section_id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(project_id),
    task_description TEXT NOT NULL,     -- 'Framing & joist installation'
    crew_size INTEGER DEFAULT 1,
    hours_estimated REAL DEFAULT 0.0,
    hourly_rate REAL DEFAULT 65.0
);

CREATE INDEX IF NOT EXISTS idx_projects_user        ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_project     ON sections(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_section    ON materials(section_id);
CREATE INDEX IF NOT EXISTS idx_materials_project    ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_labor_section        ON labor(section_id);
CREATE INDEX IF NOT EXISTS idx_labor_project        ON labor(project_id);
