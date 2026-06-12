import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://wwdnuajhqfajvsexszpy.supabase.co';
const SERVICE_KEY  = 'sb_secret_pU2Goib_PgEFffJBBJQDKw_-JHZEjwb';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Only allow requests from your own app (office admin)
  const origin = req.headers.get('origin') || '';
  const authHeader = req.headers.get('authorization') || '';

  try {
    const { email, password, role, assigned_properties, property_name } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'email, password and role are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build app_metadata based on role
    const app_metadata: Record<string, unknown> = { role };
    if (role === 'staff'    && assigned_properties) app_metadata.assigned_properties = assigned_properties;
    if (role === 'landlord' && property_name)        app_metadata.property_name = property_name;

    // Create the Auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata
    });

    if (error) {
      // If user already exists, update their password and metadata instead
      if (error.message?.includes('already been registered') || error.status === 422) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find(u => u.email === email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password,
            app_metadata
          });
          return new Response(JSON.stringify({ updated: true, id: existing.id }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ created: true, id: data.user?.id }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
});
