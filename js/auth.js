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
        
        // Fetch role from users table
        let role = 'student'; // Default
        const { data: userData, error: userError } = await window.supabaseClient
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();
            
        if (!userError && userData) {
            role = userData.role;
        } else {
            role = user.user_metadata?.role || 'student';
        }

        if (requiredRole && role !== requiredRole) {
            window.location.href = `./${role}.html`;
            return null;
        }

        setupProfileUI(user, role);

        return { user, role };
    } catch (err) {
        console.error('Auth check error:', err);
        window.location.href = './login.html';
        return null;
    }
}

function setupProfileUI(user, role) {
    const emailEl = document.getElementById('user-email');
    const roleEl = document.getElementById('user-role');
    const iconEl = document.getElementById('profile-icon');

    if (emailEl) emailEl.innerText = user.email;
    if (roleEl) roleEl.innerText = role;
    if (iconEl && user.email) {
        iconEl.innerText = user.email.charAt(0).toUpperCase();
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
