// Auth Protection and Shared Logic
async function checkAuth(requiredRole) {
    const { data: { user } } = await window.supabase.auth.getUser();

    if (!user) {
        window.location.href = './login.html';
        return null;
    }

    const { data: userData, error } = await window.supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error || !userData) {
        window.location.href = './login.html';
        return null;
    }

    if (requiredRole && userData.role !== requiredRole) {
        window.location.href = `./${userData.role}.html`;
        return null;
    }

    return { user, role: userData.role };
}

async function logout() {
    await window.supabase.auth.signOut();
    window.location.href = './login.html';
}

window.checkAuth = checkAuth;
window.logout = logout;
