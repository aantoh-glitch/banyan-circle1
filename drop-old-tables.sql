-- ══════════════════════════════════════════════════════
-- Banyan Circle — Drop legacy property tables
-- Run once in Supabase SQL Editor
-- landlords.property_name is now the single source of truth
-- ══════════════════════════════════════════════════════

-- Drop property_logins (was used to populate property dropdowns)
DROP TABLE IF EXISTS property_logins CASCADE;

-- Drop properties (superseded by landlords table)
DROP TABLE IF EXISTS properties CASCADE;
