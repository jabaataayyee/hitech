import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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

    app.use(cors());
    
    // Request logging - move to very top
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });

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

    // Auth API Router
    const authRouter = express.Router();

    authRouter.post(['/signup', '/signup/'], async (req, res) => {
        console.log('Signup attempt:', req.body.email);
        try {
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
        } catch (err: any) {
            console.error('Signup error:', err);
            res.status(500).json({ message: 'Signup failed', error: err.message });
        }
    });

    authRouter.post(['/login', '/login/'], async (req, res) => {
        console.log('Login attempt:', req.body.email);
        try {
            const { email, password } = req.body;
            const users = getUsers();
            const user = users.find((u: any) => u.email === email);
            if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
            res.json({ user: { id: user.id, email: user.email, role: user.role } });
        } catch (err: any) {
            console.error('Login error:', err);
            res.status(500).json({ message: 'Login failed', error: err.message });
        }
    });

    authRouter.get('/me', authenticate, (req: any, res) => {
        res.json({ user: req.user });
    });

    authRouter.post(['/logout', '/logout/'], (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logged out' });
    });

    app.use('/api/auth', authRouter);

    // Posts API
    const postsRouter = express.Router();
    postsRouter.use(authenticate);

    postsRouter.get('/', (req: any, res) => {
        const posts = getPosts();
        if (req.user.role === 'admin') return res.json(posts);
        const filtered = posts.filter((p: any) => p.audience === 'all' || p.audience === req.user.role);
        res.json(filtered);
    });

    postsRouter.post('/', (req: any, res) => {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
        const { title, type, audience, file_url } = req.body;
        const posts = getPosts();
        const newPost = { id: Date.now().toString(), title, type, audience, file_url, created_at: new Date().toISOString() };
        posts.push(newPost);
        savePosts(posts);
        res.json(newPost);
    });

    postsRouter.delete('/:id', (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        const posts = getPosts();
        const filtered = posts.filter((p: any) => p.id !== req.params.id);
        savePosts(filtered);
        res.json({ message: 'Deleted' });
    });

    app.use('/api/posts', postsRouter);

    // Users API (Admin only)
    app.get('/api/users', authenticate, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        const users = getUsers().map(({ password, ...u }: any) => u);
        res.json(users);
    });

    // API 404 Handler - prevent falling through to Vite for non-existent API routes
    app.use('/api/*all', (req, res) => {
        console.log(`API 404: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ message: `API route ${req.method} ${req.originalUrl} not found` });
    });

    // Global Error Handler
    app.use((err: any, req: any, res: any, next: any) => {
        console.error('Unhandled Error:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
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
