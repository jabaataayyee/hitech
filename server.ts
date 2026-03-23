import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
    const app = express();
    const PORT = 3000;

    // Request logging
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { 
                middlewareMode: true,
                hmr: false // Explicitly disable HMR to stop WebSocket connection attempts
            },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
