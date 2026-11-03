const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { put, get } = require('@vercel/blob');
const { Readable } = require('stream');
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
const JWT_SECRET = process.env.JWT_SECRET || 'formhaus-dev-secret';
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.get('/uploads/*', async (req, res, next) => {
  try {
    const pathname = req.params[0];
    if (!pathname || pathname.includes('..')) return res.status(404).end();
    const blob = await get(pathname, { access: 'private' });
    if (!blob || blob.statusCode !== 200 || !blob.stream) return res.status(404).end();
    res.setHeader('Content-Type', blob.blob.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    Readable.fromWeb(blob.stream).pipe(res);
  } catch (error) {
    next(error);
  }
});
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

app.post('/api/auth/login', async (req, res, next) => {
  try {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  return res.json({
    token: generateToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
  } catch (error) { return next(error); }
});

app.get('/api/site', async (_req, res, next) => {
  try { return res.json(await getWebsitePayload()); } catch (error) { return next(error); }
});

app.get('/api/admin/dashboard', authMiddleware, async (_req, res, next) => {
  try {
  const state = await require('./src/db').readState();
  const stats = {
    projects: (state.projects || []).length,
    services: (state.services || []).length,
    media: (state.media || []).length,
    users: (state.users || []).length
  };
  res.json({ stats, site: await getWebsitePayload() });
  } catch (error) { return next(error); }
});

app.get('/api/admin/settings', authMiddleware, async (_req, res) => {
  res.json({ settings: await getSettingsMap() });
});

app.put('/api/admin/settings', authMiddleware, async (req, res) => {
  const payload = req.body || {};
  if (!Object.keys(payload).length) {
    return res.status(400).json({ message: 'No settings data provided.' });
  }
  return res.json({ success: true, settings: await updateSettings(payload) });
});

app.get('/api/admin/navigation', authMiddleware, async (_req, res) => {
  res.json({ navigation: await getNavigation() });
});

app.post('/api/admin/navigation', authMiddleware, async (req, res) => {
  const { label, href, position = 0, is_visible = 1 } = req.body || {};
  if (!label || !href) {
    return res.status(400).json({ message: 'Label and href are required.' });
  }
  const item = await createNavigation({ label, href, position, is_visible });
  res.status(201).json({ success: true, item });
});

app.get('/api/admin/services', authMiddleware, async (_req, res) => {
  res.json({ services: await getServices() });
});

app.post('/api/admin/services', authMiddleware, async (req, res) => {
  const { name, description, image, price, is_visible = 1, sort_order = 0 } = req.body || {};
  if (!name || !description) {
    return res.status(400).json({ message: 'Service name and description are required.' });
  }
  const item = await createService({ name, description, image, price, is_visible, sort_order });
  res.status(201).json({ success: true, item });
});

app.put('/api/admin/services/:id', authMiddleware, async (req, res) => {
  const item = await updateService(req.params.id, req.body || {});
  if (!item) {
    return res.status(404).json({ message: 'Service not found.' });
  }
  res.json({ success: true, item });
});

app.delete('/api/admin/services/:id', authMiddleware, async (req, res) => {
  const deleted = await deleteService(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Service not found.' });
  }
  res.json({ success: true });
});

app.get('/api/admin/projects', authMiddleware, async (_req, res) => {
  res.json({ projects: await getProjects() });
});

app.post('/api/admin/projects', authMiddleware, async (req, res) => {
  const { title, category, description, cover_image, gallery, model_url, featured = 0, is_published = 1, sort_order = 0 } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ message: 'Project title and description are required.' });
  }
  const item = await createProject({ title, category, description, cover_image, gallery, model_url, featured, is_published, sort_order });
  res.status(201).json({ success: true, item });
});

app.put('/api/admin/projects/:id', authMiddleware, async (req, res) => {
  const item = await updateProject(req.params.id, req.body || {});
  if (!item) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  res.json({ success: true, item });
});

app.delete('/api/admin/projects/:id', authMiddleware, async (req, res) => {
  const deleted = await deleteProject(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Project not found.' });
  }
  res.json({ success: true });
});

app.get('/api/admin/homepage', authMiddleware, async (_req, res) => {
  res.json({ sections: await getHomepageSections() });
});

app.put('/api/admin/homepage', authMiddleware, async (req, res) => {
  const sections = Array.isArray(req.body.sections) ? req.body.sections : [];
  const saved = await saveHomepageSections(sections);
  res.json({ success: true, sections: saved });
});

app.get('/api/admin/media', authMiddleware, async (_req, res) => {
  res.json({ media: await getMedia() });
});

app.post('/api/admin/media/upload', authMiddleware, upload.array('files', 12), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ message: 'Blob storage is not configured on this deployment.' });
    }
    const uploaded = await Promise.all(req.files.map(async (file) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120) || 'upload';
      const blob = await put(`formhaus/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`, file.buffer, {
        access: 'private',
        addRandomSuffix: true,
        contentType: file.mimetype
      });
      return {
        filename: file.originalname,
        path: `/uploads/${blob.pathname}`,
        url: blob.url,
        pathname: blob.pathname,
        mimetype: file.mimetype,
        size: file.size
      };
    }));
    const files = addMedia(uploaded);
    return res.status(201).json({ success: true, files });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/about', authMiddleware, async (_req, res) => {
  res.json({ page: await getAboutPage() });
});

app.put('/api/admin/about', authMiddleware, async (req, res) => {
  const page = await saveAboutPage(req.body || {});
  res.json({ success: true, page });
});

app.get('/api/admin/me', authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id);
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
