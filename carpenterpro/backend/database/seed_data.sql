-- CarpenterPro Seed Data
-- Pre-built carpentry project templates

INSERT OR IGNORE INTO project_templates (id, name, description, sections) VALUES
(
  'BLU-001',
  'Basic Deck Build',
  'Standard residential deck with ledger board, posts, joists, decking, and railing.',
  '[
    {"key":"site_prep",    "label":"Site Prep & Layout",   "default_unit":"hr"},
    {"key":"footings",     "label":"Footings & Posts",     "default_unit":"ea"},
    {"key":"framing",      "label":"Framing & Joists",     "default_unit":"lf"},
    {"key":"decking",      "label":"Decking Boards",       "default_unit":"sqft"},
    {"key":"railing",      "label":"Railing System",       "default_unit":"lf"},
    {"key":"stairs",       "label":"Stairs",               "default_unit":"riser"},
    {"key":"hardware",     "label":"Hardware & Fasteners", "default_unit":"lot"},
    {"key":"finish",       "label":"Finish & Cleanup",     "default_unit":"hr"}
  ]'
),
(
  'BLU-002',
  'Interior Trim Package',
  'Full interior trim-out: base, casing, crown molding, and door/window surrounds.',
  '[
    {"key":"base_molding", "label":"Base Molding",         "default_unit":"lf"},
    {"key":"casing",       "label":"Door & Window Casing", "default_unit":"lf"},
    {"key":"crown",        "label":"Crown Molding",        "default_unit":"lf"},
    {"key":"shoe_molding", "label":"Shoe Molding",         "default_unit":"lf"},
    {"key":"hardware",     "label":"Nails & Adhesive",     "default_unit":"lot"},
    {"key":"paint_prep",   "label":"Caulk & Paint Prep",   "default_unit":"hr"}
  ]'
),
(
  'BLU-003',
  'Kitchen Cabinet Installation',
  'Supply and install upper and lower cabinets with hardware and adjustments.',
  '[
    {"key":"demo",         "label":"Demo & Disposal",      "default_unit":"hr"},
    {"key":"uppers",       "label":"Upper Cabinets",       "default_unit":"lf"},
    {"key":"lowers",       "label":"Lower Cabinets",       "default_unit":"lf"},
    {"key":"fillers",      "label":"Filler Panels & Trim", "default_unit":"ea"},
    {"key":"hardware",     "label":"Hinges & Pulls",       "default_unit":"ea"},
    {"key":"countertop",   "label":"Countertop Template",  "default_unit":"sqft"}
  ]'
);

-- Separate template table required by seed (schema.sql adds project_templates lazily)
CREATE TABLE IF NOT EXISTS project_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  sections    TEXT NOT NULL  -- JSON array of section definitions
);
