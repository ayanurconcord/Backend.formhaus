const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'store.json');

const defaultSettings = {
  site_name: 'FORMHAUS.STUDIO',
  logo_url: '',
  favicon_url: '',
  accent_color: '#d85c2d',
  charcoal_color: '#111111',
  bone_color: '#f3efe8',
  steel_color: '#b8b8b3',
  contact_email: 'hello@formhaus.studio',
  contact_phone: '+61 400 000 000',
  contact_address: '12 River Street, Melbourne VIC',
  social_instagram: 'https://instagram.com',
  social_linkedin: 'https://linkedin.com',
  social_behance: 'https://behance.net',
  seo_title: 'FORMHAUS.STUDIO | 3D Printing & Product Design Studio',
  seo_description: 'Premium 3D printing, rapid prototyping and custom fabrication for products, design teams and innovators.',
  hero_title: 'Precision in every layer.',
  hero_description: 'We design, prototype, and fabricate extraordinary objects with industrial-grade 3D printing and custom production expertise.',
  hero_primary_cta: 'Book a consult',
  hero_primary_link: '#contact',
  hero_secondary_cta: 'View projects',
  hero_secondary_link: '/portfolio'
};

const defaultState = {
  settings: { ...defaultSettings },
  users: [{
    id: 1,
    name: 'Formhaus Admin',
    email: 'admin@formhaus.studio',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    created_at: new Date().toISOString()
  }],
  navigation: [
    { id: 1, label: 'Home', href: '/', position: 1, is_visible: 1 },
    { id: 2, label: 'Portfolio', href: '/portfolio', position: 2, is_visible: 1 },
    { id: 3, label: 'Services', href: '/services', position: 3, is_visible: 1 },
    { id: 4, label: 'About', href: '/about', position: 4, is_visible: 1 },
    { id: 5, label: 'Contact', href: '#contact', position: 5, is_visible: 1 }
  ],
  services: [
    { id: 1, name: 'Rapid Prototyping', description: 'Functional prototypes, iterative validation and concept exploration for products in motion.', image: '/images/prototyping.svg', price: 'From $299', is_visible: 1, sort_order: 1 },
    { id: 2, name: 'Custom Fabrication', description: 'Small-batch production for premium objects, fixtures and spatial design systems.', image: '/images/fabrication.svg', price: 'From $899', is_visible: 1, sort_order: 2 },
    { id: 3, name: 'Design for 3D Printing', description: 'Material-informed design guidance and optimization for printability, strength and finish.', image: '/images/design.svg', price: 'From $450', is_visible: 1, sort_order: 3 }
  ],
  projects: [
    { id: 1, title: 'Luma Lamp System', slug: 'luma-lamp-system', category: 'Lighting', description: 'A modular lighting object shaped for soft, sculptural illumination and tactile surfaces.', cover_image: '/images/project-lamp.svg', gallery: JSON.stringify(['/images/project-lamp.svg', '/images/project-lamp.svg']), model_url: '', featured: 1, is_published: 1, sort_order: 1 },
    { id: 2, title: 'Torque Chair', slug: 'torque-chair', category: 'Furniture', description: 'A parametric chair exploring comfort, material expression and fabrication efficiency.', cover_image: '/images/project-chair.svg', gallery: JSON.stringify(['/images/project-chair.svg']), model_url: '', featured: 0, is_published: 1, sort_order: 2 },
    { id: 3, title: 'Forma Housing Concept', slug: 'forma-housing-concept', category: 'Industrial Design', description: 'An architectural product prototype designed for modular living components and rapid iteration.', cover_image: '/images/project-forma.svg', gallery: JSON.stringify(['/images/project-forma.svg']), model_url: '', featured: 1, is_published: 1, sort_order: 3 }
  ],
  media: [],
  homepage_sections: [
    { id: 1, section_key: 'intro', title: 'Designing objects with intent.', subtitle: 'Material-led experimentation and precision manufacturing.', body: 'We create elegant, production-ready objects using additive manufacturing, industrial detailing and rapid iteration workflows.', image_url: '/images/intro.svg', cta_text: 'Learn more', cta_link: '/about', enabled: 1, sort_order: 1 },
    { id: 2, section_key: 'capabilities', title: 'Built for concept to production.', subtitle: 'Small batch. Fast turnarounds. High fidelity output.', body: 'From technical prototypes to refined final pieces, our studio bridges industrial design with fabrication expertise.', image_url: '/images/capabilities.svg', cta_text: 'See services', cta_link: '/services', enabled: 1, sort_order: 2 },
    { id: 3, section_key: 'process', title: 'A process that keeps momentum high.', subtitle: 'Research, refine, prototype, produce.', body: 'We combine design thinking and manufacturing literacy to reduce development risk and unlock better product outcomes.', image_url: '/images/process.svg', cta_text: 'Book a project call', cta_link: '#contact', enabled: 1, sort_order: 3 }
  ],
  pages: {
    about: {
      slug: 'about',
      title: 'About the studio',
      content: 'FORMHAUS is a product design and fabrication studio focused on material clarity, sculptural form and intelligent manufacturing workflows. We collaborate with founders, brands and makers to turn ideas into physical objects that feel considered and resolved.',
      seo_title: 'About FORMHAUS.STUDIO',
      seo_description: 'Learn more about the studio, its craft-based approach and how we design and produce 3D printed objects.'
    }
  }
};

const ensureDataFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2));
  }
};

const readState = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
};

const writeState = (state) => {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
};

const getSettingsMap = () => readState().settings || { ...defaultSettings };

const updateSettings = (payload) => {
  const state = readState();
  state.settings = { ...state.settings, ...payload };
  writeState(state);
  return state.settings;
};

const getNavigation = () => readState().navigation || [];

const createNavigation = ({ label, href, position = 0, is_visible = 1 }) => {
  const state = readState();
  const nextId = (state.navigation || []).reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  const item = { id: nextId, label, href, position: Number(position), is_visible: Number(is_visible) };
  state.navigation.push(item);
  writeState(state);
  return item;
};

const getServices = () => readState().services || [];

const createService = (payload) => {
  const state = readState();
  const nextId = (state.services || []).reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  const item = {
    id: nextId,
    name: payload.name,
    description: payload.description,
    image: payload.image || '',
    price: payload.price || '',
    is_visible: Number(payload.is_visible ?? 1),
    sort_order: Number(payload.sort_order ?? 0)
  };
  state.services.push(item);
  writeState(state);
  return item;
};

const updateService = (id, payload) => {
  const state = readState();
  const service = (state.services || []).find((item) => Number(item.id) === Number(id));
  if (!service) return null;
  Object.assign(service, { ...service, ...payload, is_visible: Number(payload.is_visible ?? service.is_visible), sort_order: Number(payload.sort_order ?? service.sort_order) });
  writeState(state);
  return service;
};

const deleteService = (id) => {
  const state = readState();
  const before = state.services.length;
  state.services = (state.services || []).filter((item) => Number(item.id) !== Number(id));
  writeState(state);
  return state.services.length !== before;
};

const getProjects = () => readState().projects || [];

const slugify = (value) => `${String(value || '')}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `project-${Date.now()}`;

const createProject = (payload) => {
  const state = readState();
  const nextId = (state.projects || []).reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  const item = {
    id: nextId,
    title: payload.title,
    slug: slugify(payload.title),
    category: payload.category || 'Design',
    description: payload.description,
    cover_image: payload.cover_image || '',
    gallery: typeof payload.gallery === 'string' ? payload.gallery : JSON.stringify(payload.gallery || []),
    model_url: payload.model_url || '',
    featured: Number(payload.featured ?? 0),
    is_published: Number(payload.is_published ?? 1),
    sort_order: Number(payload.sort_order ?? 0)
  };
  state.projects.push(item);
  writeState(state);
  return item;
};

const updateProject = (id, payload) => {
  const state = readState();
  const project = (state.projects || []).find((item) => Number(item.id) === Number(id));
  if (!project) return null;
  Object.assign(project, {
    ...project,
    ...payload,
    title: payload.title || project.title,
    description: payload.description || project.description,
    cover_image: payload.cover_image || project.cover_image,
    gallery: typeof payload.gallery === 'string' ? payload.gallery : JSON.stringify(payload.gallery || JSON.parse(project.gallery || '[]')),
    model_url: payload.model_url || project.model_url,
    featured: Number(payload.featured ?? project.featured),
    is_published: Number(payload.is_published ?? project.is_published),
    sort_order: Number(payload.sort_order ?? project.sort_order)
  });
  writeState(state);
  return project;
};

const deleteProject = (id) => {
  const state = readState();
  const before = state.projects.length;
  state.projects = (state.projects || []).filter((item) => Number(item.id) !== Number(id));
  writeState(state);
  return state.projects.length !== before;
};

const getHomepageSections = () => readState().homepage_sections || [];

const saveHomepageSections = (sections) => {
  const state = readState();
  state.homepage_sections = (sections || []).map((section, index) => ({
    id: Number(section.id || index + 1),
    section_key: section.section_key || `section-${index + 1}`,
    title: section.title || '',
    subtitle: section.subtitle || '',
    body: section.body || '',
    image_url: section.image_url || '',
    cta_text: section.cta_text || '',
    cta_link: section.cta_link || '',
    enabled: Number(section.enabled ?? 1),
    sort_order: Number(section.sort_order ?? index)
  }));
  writeState(state);
  return state.homepage_sections;
};

const getMedia = () => readState().media || [];

const addMedia = (files) => {
  const state = readState();
  const saved = [];
  for (const file of files) {
    const nextId = (state.media || []).reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
    const entry = {
      id: nextId,
      filename: file.filename,
      path: file.path,
      url: file.url || '',
      pathname: file.pathname || '',
      mime_type: file.mimetype,
      kind: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'asset',
      size: file.size,
      created_at: new Date().toISOString()
    };
    state.media.push(entry);
    saved.push(entry);
  }
  writeState(state);
  return saved;
};

const getAboutPage = () => readState().pages?.about || { slug: 'about', title: 'About the studio', content: '', seo_title: 'About FORMHAUS', seo_description: 'Learn more about the studio.' };

const saveAboutPage = (payload) => {
  const state = readState();
  state.pages = state.pages || {};
  state.pages.about = {
    slug: 'about',
    title: payload.title || 'About the studio',
    content: payload.content || '',
    seo_title: payload.seo_title || 'About FORMHAUS',
    seo_description: payload.seo_description || 'Learn more about the studio.'
  };
  writeState(state);
  return state.pages.about;
};

const getUserByEmail = (email) => {
  const state = readState();
  return (state.users || []).find((user) => String(user.email).toLowerCase() === String(email).toLowerCase()) || null;
};

const getUserById = (id) => {
  const state = readState();
  return (state.users || []).find((user) => Number(user.id) === Number(id)) || null;
};

const getWebsitePayload = () => {
  const state = readState();
  const settings = state.settings || { ...defaultSettings };
  const navigation = (state.navigation || []).filter((item) => Number(item.is_visible) === 1).sort((a,b)=>Number(a.position)-Number(b.position));
  const services = (state.services || []).filter((item) => Number(item.is_visible) === 1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
  const projects = (state.projects || []).filter((item)=>Number(item.is_published)===1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
  const homepage = (state.homepage_sections || []).filter((item)=>Number(item.enabled)===1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
  const featuredProjects = projects.filter((project) => Number(project.featured) === 1);
  return {
    settings: {
      site_name: settings.site_name || defaultSettings.site_name,
      logo_url: settings.logo_url || '',
      favicon_url: settings.favicon_url || '',
      accent_color: settings.accent_color || defaultSettings.accent_color,
      charcoal_color: settings.charcoal_color || defaultSettings.charcoal_color,
      bone_color: settings.bone_color || defaultSettings.bone_color,
      steel_color: settings.steel_color || defaultSettings.steel_color,
      contact_email: settings.contact_email || defaultSettings.contact_email,
      contact_phone: settings.contact_phone || defaultSettings.contact_phone,
      contact_address: settings.contact_address || defaultSettings.contact_address,
      social_instagram: settings.social_instagram || defaultSettings.social_instagram,
      social_linkedin: settings.social_linkedin || defaultSettings.social_linkedin,
      social_behance: settings.social_behance || defaultSettings.social_behance,
      seo_title: settings.seo_title || defaultSettings.seo_title,
      seo_description: settings.seo_description || defaultSettings.seo_description,
      hero_title: settings.hero_title || defaultSettings.hero_title,
      hero_description: settings.hero_description || defaultSettings.hero_description,
      hero_primary_cta: settings.hero_primary_cta || defaultSettings.hero_primary_cta,
      hero_primary_link: settings.hero_primary_link || defaultSettings.hero_primary_link,
      hero_secondary_cta: settings.hero_secondary_cta || defaultSettings.hero_secondary_cta,
      hero_secondary_link: settings.hero_secondary_link || defaultSettings.hero_secondary_link
    },
    navigation,
    homepage: { sections: homepage, featuredProjects, intro: homepage[0] || null },
    services,
    projects,
    about: state.pages?.about || { slug: 'about', title: 'About the studio', content: '' },
    contact: {
      email: settings.contact_email || defaultSettings.contact_email,
      phone: settings.contact_phone || defaultSettings.contact_phone,
      address: settings.contact_address || defaultSettings.contact_address,
      seo_title: settings.seo_title || defaultSettings.seo_title,
      seo_description: settings.seo_description || defaultSettings.seo_description
    }
  };
};

module.exports = {
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
  getWebsitePayload,
  readState,
  writeState
};
