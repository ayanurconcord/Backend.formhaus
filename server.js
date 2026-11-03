const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const morgan = require('morgan');
const dotenv = require('dotenv');
const {
  defaultSettings,
  getSettingsMap,
  updateSettings,
  getNavigation,
  createNavigation,
  getServices,
  createService,
  updateService,
  deleteService,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getHomepageSections,
  saveHomepageSections,
  getMedia,
  addMedia,
  getAboutPage,
  saveAboutPage,
  getUserByEmail,
  getUserById,
  getWebsitePayload
} = require('./src/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'formhaus-dev-secret');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}
const uploadDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'model/gltf-binary', 'application/octet-stream'];
    if (allowed.includes(file.mimetype) || /\.(glb|gltf|stl|obj|svg)$/i.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported file type'));
  }
});

const configuredClientOrigins = (process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set([
  ...configuredClientOrigins,
  'https://frontendformhaus-1q7l7i9rz-formhaus1.vercel.app',
  ...(!isProduction ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
]);

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow non-browser clients such as health checks and server-to-server requests.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadDir));
app.get('/admin', (_req, res) => res.redirect(302, '/admin/'));
app.use('/admin', express.static(path.join(publicDir, 'admin')));

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const generateToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'formhaus-backend', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  return res.json({
    token: generateToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.get('/api/site', (_req, res) => {
  return res.json(getWebsitePayload());
});

app.get('/api/admin/dashboard', authMiddleware, (_req, res) => {
  const state = require('./src/db').readState();
  const stats = {
    projects: (state.projects || []).length,
    services: (state.services || []).length,
    media: (state.media || []).length,
    users: (state.users || []).length
  };
  res.json({ stats, site: getWebsitePayload() });
});

app.get('/api/admin/settings', authMiddleware, (_req, res) => {
  res.json({ settings: getSettingsMap() });
});

app.put('/api/admin/settings', authMiddleware, (req, res) => {
  const payload = req.body || {};
  if (!Object.keys(payload).length) {
    return res.status(400).json({ message: 'No settings data provided.' });
  }
  return res.json({ success: true, settings: updateSettings(payload) });
});

app.get('/api/admin/navigation', authMiddleware, (_req, res) => {
  res.json({ navigation: getNavigation() });
});

app.post('/api/admin/navigation', authMiddleware, (req, res) => {
  const { label, href, position = 0, is_visible = 1 } = req.body || {};
  if (!label || !href) {
    return res.status(400).json({ message: 'Label and href are required.' });
  }
  const item = createNavigation({ label, href, position, is_visible });
  res.status(201).json({ success: true, item });
});

app.get('/api/admin/services', authMiddleware, (_req, res) => {
  res.json({ services: getServices() });
});

app.post('/api/admin/services', authMiddleware, (req, res) => {
  const { name, description, image, price, is_visible = 1, sort_order = 0 } = req.body || {};
  if (!name || !description) {
    return res.status(400).json({ message: 'Service name and description are required.' });
  }
  const item = createService({ name, description, image, price, is_visible, sort_order });
  res.status(201).json({ success: true, item });
});

app.put('/api/admin/services/:id', authMiddleware, (req, res) => {
  const item = updateService(req.params.id, req.body || {});
  if (!item) {
    return res.status(404).json({ message: 'Service not found.' });
  }
  res.json({ success: true, item });
});

app.delete('/api/admin/services/:id', authMiddleware, (req, res) => {
  const deleted = deleteService(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Service not found.' });
  }
  res.json({ success: true });
});

app.get('/api/admin/projects', authMiddleware, (_req, res) => {
  res.json({ projects: getProjects() });
});

app.post('/api/admin/projects', authMiddleware, (req, res) => {
  const { title, category, description, cover_image, gallery, model_url, featured = 0, is_published = 1, sort_order = 0 } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ message: 'Project title and description are required.' });
  }
  const item = createProject({ title, category, description, cover_image, gallery, model_url, featured, is_published, sort_order });
  res.status(201).json({ success: true, item });
});

app.put('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const item = updateProject(req.params.id, req.body || {});
  if (!item) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  res.json({ success: true, item });
});

app.delete('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  res.json({ success: true });
});

app.get('/api/admin/homepage', authMiddleware, (_req, res) => {
  res.json({ sections: getHomepageSections() });
});

app.put('/api/admin/homepage', authMiddleware, (req, res) => {
  const sections = Array.isArray(req.body.sections) ? req.body.sections : [];
  const saved = saveHomepageSections(sections);
  res.json({ success: true, sections: saved });
});

app.get('/api/admin/media', authMiddleware, (_req, res) => {
  res.json({ media: getMedia() });
});

app.post('/api/admin/media/upload', authMiddleware, upload.array('files', 12), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }
  const files = addMedia(req.files);
  res.status(201).json({ success: true, files });
});

app.get('/api/admin/about', authMiddleware, (_req, res) => {
  res.json({ page: getAboutPage() });
});

app.put('/api/admin/about', authMiddleware, (req, res) => {
  const page = saveAboutPage(req.body || {});
  res.json({ success: true, page });
});

app.get('/api/admin/me', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Formhaus backend listening on http://localhost:${PORT}`);
});
