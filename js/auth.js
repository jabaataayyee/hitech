// Auth Protection and Shared Logic
async function checkAuth(requiredRole) {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = './login.html';
            return null;
        }

        const data = await response.json();
        const user = data.user;

        if (requiredRole && user.role !== requiredRole) {
            window.location.href = `./${user.role}.html`;
            return null;
        }

        return { user, role: user.role };
    } catch (err) {
        window.location.href = './login.html';
        return null;
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = './login.html';
}

window.checkAuth = checkAuth;
window.logout = logout;
