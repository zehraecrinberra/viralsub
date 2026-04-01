import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Simple file-based user store for MVP (replace with real DB in production)
const USERS_FILE = path.join(__dirname, '../data/users.json');

const getUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
      fs.writeFileSync(USERS_FILE, '[]');
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch { return []; }
};

const saveUsers = (users) => {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, plan: user.plan },
  process.env.JWT_SECRET || 'viralsub-secret',
  { expiresIn: '7d' }
);

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    
    const users = getUsers();
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = { id: uuidv4(), email, name, password: hashedPassword, plan: 'free', createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token: generateToken(user) });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'viralsub-secret');
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Google OAuth (mock - frontend handles Google Sign-In, sends idToken)
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;
    if (!email || !googleId) return res.status(400).json({ error: 'Invalid Google data' });
    
    const users = getUsers();
    let user = users.find(u => u.email === email);
    
    if (!user) {
      user = { id: uuidv4(), email, name, googleId, picture, plan: 'free', createdAt: new Date().toISOString() };
      users.push(user);
      saveUsers(users);
    }
    
    res.json({ user, token: generateToken(user) });
  } catch {
    res.status(500).json({ error: 'Google auth failed' });
  }
});

export default router;
