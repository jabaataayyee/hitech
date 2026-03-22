// Supabase Client Initialization
// These values should be provided in the .env file or GitHub Secrets
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize the Supabase client
// Note: 'supabase' is available globally after importing the CDN script
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
