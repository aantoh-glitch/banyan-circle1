import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 🔧 REPLACE THESE WITH YOUR SUPABASE PROJECT VALUES
// Found at: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = 'https://wwdnuajhqfajvsexszpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51YWpocWZhanZzZXhzenB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzM3NjgsImV4cCI6MjA5NDUwOTc2OH0.gtPmoxyBgk6feOghdouE4BW1TQwLQjeJ2C0ZXSaZYU4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth helpers
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}
