import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const JWT_SECRET = process.env.JWT_SECRET || 'hi-tech-academy-secret-key';
const USERS_FILE = path.join(process.cwd(), 'users.json');
const POSTS_FILE = path.join(process.cwd(), 'posts.json');

// Ensure files exist
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, JSON.stringify([]));

function getUsers() { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
function saveUsers(users: any[]) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }
function getPosts() { return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8')); }
function savePosts(posts: any[]) { fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2)); }

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json());
    app.use(cookieParser());

    // Middleware to verify token
    const authenticate = (req: any, res: any, next: any) => {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Invalid token' });
        }
    };

    // Auth API
    app.post('/api/auth/signup', async (req, res) => {
        const { email, password, role } = req.body;
        const users = getUsers();
        if (users.find((u: any) => u.email === email)) return res.status(400).json({ message: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now().toString(), email, password: hashedPassword, role };
        users.push(newUser);
        saveUsers(users);
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
        res.json({ user: { id: newUser.id, email: newUser.email, role: newUser.role } });
    });

    app.post('/api/auth/login', async (req, res) => {
        const { email, password } = req.body;
        const users = getUsers();
        const user = users.find((u: any) => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
        res.json({ user: { id: user.id, email: user.email, role: user.role } });
    });

    app.get('/api/auth/me', authenticate, (req: any, res) => {
        res.json({ user: req.user });
    });

    app.post('/api/auth/logout', (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logged out' });
    });

    // Posts API
    app.get('/api/posts', authenticate, (req: any, res) => {
        const posts = getPosts();
        if (req.user.role === 'admin') return res.json(posts);
        const filtered = posts.filter((p: any) => p.audience === 'all' || p.audience === req.user.role);
        res.json(filtered);
    });

    app.post('/api/posts', authenticate, (req: any, res) => {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
        const { title, type, audience, file_url } = req.body;
        const posts = getPosts();
        const newPost = { id: Date.now().toString(), title, type, audience, file_url, created_at: new Date().toISOString() };
        posts.push(newPost);
        savePosts(posts);
        res.json(newPost);
    });

    app.delete('/api/posts/:id', authenticate, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        const posts = getPosts();
        const filtered = posts.filter((p: any) => p.id !== req.params.id);
        savePosts(filtered);
        res.json({ message: 'Deleted' });
    });

    // Users API (Admin only)
    app.get('/api/users', authenticate, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        const users = getUsers().map(({ password, ...u }: any) => u);
        res.json(users);
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
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
