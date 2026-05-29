-- CarpenterPro Seed Data
-- Demo user + three pre-built project templates with sections, materials, and labor

INSERT OR IGNORE INTO users (user_id, business_name, email, phone, subscription_tier, default_markup_percent, region_zip_code, created_at)
VALUES ('USR-001', 'BECK BUILDER', 'demo@beckbuilder.com', '555-0100', 'individual', 20.0, '90210', datetime('now'));

-- ── BLU-001: Basic Deck Build ────────────────────────────────────────────────

INSERT OR IGNORE INTO projects (project_id, user_id, customer_name, project_type, status, markup_percent, created_at, last_modified_at)
VALUES ('PRJ-TPL-001', 'USR-001', 'Template: Basic Deck Build', 'Deck Construction', 'draft', 20.0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO sections (section_id, project_id, area_name) VALUES
('SEC-T01-01', 'PRJ-TPL-001', 'Main Deck'),
('SEC-T01-02', 'PRJ-TPL-001', 'Steps & Landing');

-- Main Deck materials
INSERT OR IGNORE INTO materials (material_id, section_id, project_id, item_name, category, qty, unit, unit_cost) VALUES
('MAT-T01-01', 'SEC-T01-01', 'PRJ-TPL-001', '5/4x6x16 Composite Decking', 'Lumber',   50,  'ea',  18.50),
('MAT-T01-02', 'SEC-T01-01', 'PRJ-TPL-001', 'Double 2x10 Ledger Board',   'Lumber',    2,  'ea',  22.00),
('MAT-T01-03', 'SEC-T01-01', 'PRJ-TPL-001', '2x10x16 Joists',             'Lumber',   24,  'ea',  19.75),
('MAT-T01-04', 'SEC-T01-01', 'PRJ-TPL-001', 'Galv Joist Hangers',         'Hardware', 48,  'ea',   1.10),
('MAT-T01-05', 'SEC-T01-01', 'PRJ-TPL-001', 'Composite Deck Screws',      'Fasteners', 5, 'box',  24.00),
('MAT-T01-06', 'SEC-T01-01', 'PRJ-TPL-001', '6x6x10 Post',                'Lumber',    6,  'ea',  28.00);

-- Main Deck labor
INSERT OR IGNORE INTO labor (labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate) VALUES
('LAB-T01-01', 'SEC-T01-01', 'PRJ-TPL-001', 'Site prep & layout',           2, 4.0,  65.0),
('LAB-T01-02', 'SEC-T01-01', 'PRJ-TPL-001', 'Footings & post installation', 2, 8.0,  65.0),
('LAB-T01-03', 'SEC-T01-01', 'PRJ-TPL-001', 'Framing & joist installation', 3, 10.0, 65.0),
('LAB-T01-04', 'SEC-T01-01', 'PRJ-TPL-001', 'Decking installation',         2, 8.0,  65.0);

-- Steps & Landing materials
INSERT OR IGNORE INTO materials (material_id, section_id, project_id, item_name, category, qty, unit, unit_cost) VALUES
('MAT-T01-07', 'SEC-T01-02', 'PRJ-TPL-001', '2x12x12 Stringer',  'Lumber',   3, 'ea', 32.00),
('MAT-T01-08', 'SEC-T01-02', 'PRJ-TPL-001', '5/4x6x6 Tread',     'Lumber',  12, 'ea',  8.50),
('MAT-T01-09', 'SEC-T01-02', 'PRJ-TPL-001', 'Concrete Mix 80lb', 'Concrete', 4, 'bag', 7.25);

INSERT OR IGNORE INTO labor (labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate) VALUES
('LAB-T01-05', 'SEC-T01-02', 'PRJ-TPL-001', 'Steps & landing build-out', 2, 5.0, 65.0);

-- ── BLU-002: Interior Trim Package ──────────────────────────────────────────

INSERT OR IGNORE INTO projects (project_id, user_id, customer_name, project_type, status, markup_percent, created_at, last_modified_at)
VALUES ('PRJ-TPL-002', 'USR-001', 'Template: Interior Trim Package', 'Interior Trim', 'draft', 20.0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO sections (section_id, project_id, area_name) VALUES
('SEC-T02-01', 'PRJ-TPL-002', 'Living Room'),
('SEC-T02-02', 'PRJ-TPL-002', 'Hallway & Bedrooms');

INSERT OR IGNORE INTO materials (material_id, section_id, project_id, item_name, category, qty, unit, unit_cost) VALUES
('MAT-T02-01', 'SEC-T02-01', 'PRJ-TPL-002', 'Base Molding 3.5" MDF',    'Millwork',  80, 'lf',  1.20),
('MAT-T02-02', 'SEC-T02-01', 'PRJ-TPL-002', 'Door Casing Set',          'Millwork',   6, 'ea',  12.00),
('MAT-T02-03', 'SEC-T02-01', 'PRJ-TPL-002', 'Crown Molding 3.5"',       'Millwork',  60, 'lf',  2.40),
('MAT-T02-04', 'SEC-T02-01', 'PRJ-TPL-002', 'Painter\'s Caulk',        'Supplies',   4, 'ea',   3.50),
('MAT-T02-05', 'SEC-T02-02', 'PRJ-TPL-002', 'Base Molding 3.5" MDF',    'Millwork', 120, 'lf',  1.20),
('MAT-T02-06', 'SEC-T02-02', 'PRJ-TPL-002', 'Door Casing Set',          'Millwork',   8, 'ea',  12.00);

INSERT OR IGNORE INTO labor (labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate) VALUES
('LAB-T02-01', 'SEC-T02-01', 'PRJ-TPL-002', 'Install base & crown – living room', 2, 6.0, 55.0),
('LAB-T02-02', 'SEC-T02-02', 'PRJ-TPL-002', 'Install base & casing – hall/beds',  2, 8.0, 55.0);

-- ── BLU-003: Kitchen Cabinet Installation ────────────────────────────────────

INSERT OR IGNORE INTO projects (project_id, user_id, customer_name, project_type, status, markup_percent, created_at, last_modified_at)
VALUES ('PRJ-TPL-003', 'USR-001', 'Template: Kitchen Cabinet Install', 'Kitchen Cabinetry', 'draft', 20.0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO sections (section_id, project_id, area_name) VALUES
('SEC-T03-01', 'PRJ-TPL-003', 'Upper Cabinets'),
('SEC-T03-02', 'PRJ-TPL-003', 'Lower Cabinets & Island');

INSERT OR IGNORE INTO materials (material_id, section_id, project_id, item_name, category, qty, unit, unit_cost) VALUES
('MAT-T03-01', 'SEC-T03-01', 'PRJ-TPL-003', 'Upper Cabinet 30"W x 42"H',  'Cabinetry', 8,  'ea', 185.00),
('MAT-T03-02', 'SEC-T03-01', 'PRJ-TPL-003', 'Soft-Close Hinge Pairs',     'Hardware',  32, 'ea',   4.25),
('MAT-T03-03', 'SEC-T03-02', 'PRJ-TPL-003', 'Base Cabinet 24"W x 34.5"H', 'Cabinetry', 10, 'ea', 210.00),
('MAT-T03-04', 'SEC-T03-02', 'PRJ-TPL-003', 'Drawer Glide Pair',          'Hardware',  12, 'ea',  14.00),
('MAT-T03-05', 'SEC-T03-02', 'PRJ-TPL-003', 'Filler Panel 3" x 96"',      'Cabinetry',  4, 'ea',  28.00);

INSERT OR IGNORE INTO labor (labor_id, section_id, project_id, task_description, crew_size, hours_estimated, hourly_rate) VALUES
('LAB-T03-01', 'SEC-T03-01', 'PRJ-TPL-003', 'Demo & disposal',              1, 3.0,  55.0),
('LAB-T03-02', 'SEC-T03-01', 'PRJ-TPL-003', 'Hang upper cabinets',          2, 6.0,  65.0),
('LAB-T03-03', 'SEC-T03-02', 'PRJ-TPL-003', 'Set base cabinets & scribing', 2, 8.0,  65.0),
('LAB-T03-04', 'SEC-T03-02', 'PRJ-TPL-003', 'Countertop template & touch-up', 1, 2.0, 65.0);
