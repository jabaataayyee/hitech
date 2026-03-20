// Auth Protection and Shared Logic
async function checkAuth(requiredRole) {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = './login.html';
            return null;
        }

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            throw new Error('Server returned non-JSON response');
        }

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
