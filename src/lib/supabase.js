import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_URL || 
  '';

// Ambil publishable/anon key yang aman untuk browser
function resolveClientKey() {
  const candidates = [
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.VITE_PUBLISHABLE_KEY,
    import.meta.env.VITE_ANON_KEY
  ];

  for (const k of candidates) {
    // Secret key (sb_secret_...) dilarang di browser untuk keamanan
    if (k && !k.startsWith('sb_secret_') && !k.includes('YOUR_SUPABASE')) {
      return k;
    }
  }
  return '';
}

const supabaseAnonKey = resolveClientKey();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_PROJECT_ID')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
