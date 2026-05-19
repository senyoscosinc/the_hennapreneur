// Supabase configuration for The Hennapreneur
// Supabase credentials are now stored in js/config.js and exposed via window.CONFIG.
// This file is kept for legacy compatibility only.
if (window.CONFIG) {
  window.SUPABASE_URL = window.CONFIG.SUPABASE_URL;
  window.SUPABASE_ANON_KEY = window.CONFIG.SUPABASE_ANON_KEY;
  window.HENNA_BUCKET = window.CONFIG.HENNA_BUCKET;
}
