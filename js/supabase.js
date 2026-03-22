// ✅ Supabase Client (GitHub Pages SAFE)

const SUPABASE_URL = "https://rbhadccqicswrgzzhpur.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BShyIw6xu7s_uAuqGQp6ng_sqX_i9Nx";

// Create global client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Debug check
if (!window.supabaseClient) {
    console.error("❌ Supabase failed to initialize");
} else {
    console.log("✅ Supabase initialized");
}
