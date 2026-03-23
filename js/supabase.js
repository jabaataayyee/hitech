// Supabase Client Initialization
// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://rbhadccqicswrgzzhpur.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BShyIw6xu7s_uAuqGQp6ng_sqX_i9Nx';

// Initialize the Supabase client
if (typeof window.supabase !== 'undefined') {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
} else {
    console.error("Supabase CDN not loaded correctly");
}
