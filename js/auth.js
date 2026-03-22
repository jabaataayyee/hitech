// Auth Protection and Shared Logic
async function checkAuth(requiredRole) {
    // Safe fallback check
    if (!window.supabaseClient || !window.supabaseClient.auth) {
        console.error("Supabase not loaded correctly");
        // Try to wait a bit or redirect to login
        window.location.href = './login.html';
        return null;
    }

    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error || !session) {
            window.location.href = './login.html';
            return null;
        }

        const user = session.user;
        const role = user.user_metadata?.role || 'student'; // Default to student if no role found

        if (requiredRole && role !== requiredRole) {
            window.location.href = `./${role}.html`;
            return null;
        }

        return { user, role };
    } catch (err) {
        console.error('Auth check error:', err);
        window.location.href = './login.html';
        return null;
    }
}

async function logout() {
    if (!window.supabaseClient || !window.supabaseClient.auth) {
        console.error("Supabase not loaded correctly");
        window.location.href = './login.html';
        return;
    }
    await window.supabaseClient.auth.signOut();
    window.location.href = './login.html';
}

window.checkAuth = checkAuth;
window.logout = logout;
