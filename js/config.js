// API Configuration
const API_BASE_URL = window.location.origin; // Default to current origin

// Export for use in other scripts
window.API_URL = (path) => {
    // If we're on GitHub Pages, we might need a different base URL
    // But for now, we'll use relative paths or the current origin
    if (window.location.hostname.includes('github.io')) {
        // This is a hint for the user that they need a backend
        console.warn('GitHub Pages is a static host. The backend API will not work here unless you point it to a real server.');
    }
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // If we're in the AI Studio preview, we use the current origin
    return `${API_BASE_URL}${cleanPath}`;
};
