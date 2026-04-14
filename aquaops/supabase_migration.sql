-- ============================================================
-- AquaOps - Migration: Fix ID columns (INTEGER → BIGINT)
-- Run this in Supabase SQL Editor if you already ran supabase_setup.sql
-- This fixes the bug where new tasks created by the admin
-- didn't appear for workers (Date.now() IDs overflow INTEGER).
-- ============================================================

ALTER TABLE tasks         ALTER COLUMN id TYPE BIGINT;
ALTER TABLE tickets       ALTER COLUMN id TYPE BIGINT;
ALTER TABLE customers     ALTER COLUMN id TYPE BIGINT;
ALTER TABLE meter_readings ALTER COLUMN id TYPE BIGINT;
ALTER TABLE users         ALTER COLUMN id TYPE BIGINT;

-- ============================================================
-- Done! New tasks/tickets will now sync correctly in real-time.
-- ============================================================
