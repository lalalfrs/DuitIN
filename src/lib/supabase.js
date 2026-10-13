import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://uhabhiowszwccwpbxbaz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_rSbBNZLHBSxAxgtCy6LoXg_Cx10fTz2';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_URL || 
  DEFAULT_SUPABASE_URL;

// Ambil publishable/anon key yang aman untuk browser
function resolveClientKey() {
  const candidates = [
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.VITE_PUBLISHABLE_KEY,
    import.meta.env.VITE_ANON_KEY,
    DEFAULT_SUPABASE_KEY
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
