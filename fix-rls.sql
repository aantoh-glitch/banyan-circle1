-- Drop ALL existing policies first, then recreate
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- Open all tables to everyone (anon + authenticated)
CREATE POLICY "open" ON guest_complaints FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON guest_feedback    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON properties        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON staff             FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON attendance        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON bookings          FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON housekeeping_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON laundry_movement  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON laundry_return    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON assets            FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON asset_movements   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON lost_and_found    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON community_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
