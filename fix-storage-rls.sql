-- ============================================================
-- BANYAN CIRCLE — FIX: Storage bucket RLS for anon uploads
-- Run in Supabase SQL Editor
-- Fixes: "new row violates row-level security policy" on
--        property-docs and utility-proofs bucket uploads
-- ============================================================

-- Open storage RLS for all Banyan Circle buckets
-- (property-docs, utility-proofs, housekeeping-photos, guest-ids)

DROP POLICY IF EXISTS "bc_storage_open" ON storage.objects;

CREATE POLICY "bc_storage_open"
ON storage.objects
FOR ALL
TO anon, authenticated
USING (
  bucket_id IN ('property-docs', 'utility-proofs', 'housekeeping-photos', 'guest-ids')
)
WITH CHECK (
  bucket_id IN ('property-docs', 'utility-proofs', 'housekeeping-photos', 'guest-ids')
);
