// Supabase Client Initialization
// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize the Supabase client
if (typeof window.supabase !== 'undefined') {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
} else {
    console.error("Supabase CDN not loaded correctly");
}
