// Supabase Configuration
// Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.supabase = client;
