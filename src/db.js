const { put, get } = require('@vercel/blob');
const { Readable } = require('stream');
const bcrypt = require('bcryptjs');

const STATE_PATH = 'formhaus-data/store.json';

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
  hero_primary_cta: 'Shop the collection',
  hero_primary_link: '/shop',
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
  categories: [],
  products: [],
  orders: [],
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

const readState = async () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for persistent CMS storage.');
  }
  const result = await get(STATE_PATH, { access: 'private', useCache: false });
  if (result && result.statusCode === 200 && result.stream) {
    const chunks = [];
    for await (const chunk of Readable.fromWeb(result.stream)) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  await writeState(defaultState);
  return JSON.parse(JSON.stringify(defaultState));
};

const writeState = async (state) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for persistent CMS storage.');
  }
  await put(STATE_PATH, JSON.stringify(state, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });
};

const getSettingsMap = async () => { const settings = { ...defaultSettings, ...((await readState()).settings || {}) }; if (settings.hero_primary_cta === 'Book a consult') settings.hero_primary_cta = 'Shop the collection'; if (settings.hero_primary_link === '#contact') settings.hero_primary_link = '/shop'; return settings; };

const updateSettings = async (payload) => {
  const state = await readState();
  state.settings = { ...state.settings, ...payload };
  await writeState(state);
  return state.settings;
};

const getNavigation = async () => (await readState()).navigation || [];

const createNavigation = async ({ label, href, position = 0, is_visible = 1 }) => {
  const state = await readState();
  const nextId = (state.navigation || []).reduce((max, item) => Math.max(max, Number(item.id || 0)), 0) + 1;
  const item = { id: nextId, label, href, position: Number(position), is_visible: Number(is_visible) };
  state.navigation.push(item);
  await writeState(state);
  return item;
};

const getServices = async () => (await readState()).services || [];

const createService = async (payload) => {
  const state = await readState();
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
  await writeState(state);
  return item;
};

const updateService = async (id, payload) => {
  const state = await readState();
  const service = (state.services || []).find((item) => Number(item.id) === Number(id));
  if (!service) return null;
  Object.assign(service, { ...service, ...payload, is_visible: Number(payload.is_visible ?? service.is_visible), sort_order: Number(payload.sort_order ?? service.sort_order) });
  await writeState(state);
  return service;
};

const deleteService = async (id) => {
  const state = await readState();
  const before = state.services.length;
  state.services = (state.services || []).filter((item) => Number(item.id) !== Number(id));
  await writeState(state);
  return state.services.length !== before;
};

const getProjects = async () => (await readState()).projects || [];

const slugify = (value) => `${String(value || '')}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `project-${Date.now()}`;

const createProject = async (payload) => {
  const state = await readState();
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
  await writeState(state);
  return item;
};

const updateProject = async (id, payload) => {
  const state = await readState();
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
  await writeState(state);
  return project;
};

const deleteProject = async (id) => {
  const state = await readState();
  const before = state.projects.length;
  state.projects = (state.projects || []).filter((item) => Number(item.id) !== Number(id));
  await writeState(state);
  return state.projects.length !== before;
};

const getHomepageSections = async () => (await readState()).homepage_sections || [];

const saveHomepageSections = async (sections) => {
  const state = await readState();
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
  await writeState(state);
  return state.homepage_sections;
};

const getMedia = async () => (await readState()).media || [];

const addMedia = async (files) => {
  const state = await readState();
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
  await writeState(state);
  return saved;
};

const getAboutPage = async () => (await readState()).pages?.about || { slug: 'about', title: 'About the studio', content: '', seo_title: 'About FORMHAUS', seo_description: 'Learn more about the studio.' };

const saveAboutPage = async (payload) => {
  const state = await readState();
  state.pages = state.pages || {};
  state.pages.about = {
    slug: 'about',
    title: payload.title || 'About the studio',
    content: payload.content || '',
    seo_title: payload.seo_title || 'About FORMHAUS',
    seo_description: payload.seo_description || 'Learn more about the studio.'
  };
  await writeState(state);
  return state.pages.about;
};

const getUserByEmail = async (email) => {
  const state = await readState();
  return (state.users || []).find((user) => String(user.email).toLowerCase() === String(email).toLowerCase()) || null;
};

const getUserById = async (id) => {
  const state = await readState();
  return (state.users || []).find((user) => Number(user.id) === Number(id)) || null;
};


const getUsers = async () => {
  const state = await readState();
  return (state.users || []).map(({ password_hash, ...user }) => user).sort((a, b) => Number(a.id) - Number(b.id));
};

const createUser = async ({ name, email, password, role = 'editor' }) => {
  const state = await readState();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if ((state.users || []).some((user) => String(user.email).toLowerCase() === normalizedEmail)) {
    const error = new Error('A user with this email already exists.');
    error.status = 409;
    throw error;
  }
  const nextId = (state.users || []).reduce((max, user) => Math.max(max, Number(user.id || 0)), 0) + 1;
  const user = {
    id: nextId,
    name: String(name || '').trim(),
    email: normalizedEmail,
    password_hash: await bcrypt.hash(password, 12),
    role: role === 'admin' ? 'admin' : 'editor',
    token_version: 0,
    created_at: new Date().toISOString()
  };
  state.users = [...(state.users || []), user];
  await writeState(state);
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

const updateUserPassword = async (id, password) => {
  const state = await readState();
  const user = (state.users || []).find((item) => Number(item.id) === Number(id));
  if (!user) return null;
  user.password_hash = await bcrypt.hash(password, 12);
  user.token_version = Number(user.token_version || 0) + 1;
  await writeState(state);
  return true;
};

const deleteUser = async (id) => {
  const state = await readState();
  const target = (state.users || []).find((item) => Number(item.id) === Number(id));
  if (!target) return false;
  if (target.role === 'admin' && state.users.filter((item) => item.role === 'admin').length <= 1) {
    const error = new Error('You cannot remove the only administrator.');
    error.status = 400;
    throw error;
  }
  state.users = state.users.filter((item) => Number(item.id) !== Number(id));
  await writeState(state);
  return true;
};


const getCategories = async ({ includeHidden = false } = {}) => {
  const state = await readState();
  return (state.categories || []).filter((item) => includeHidden || Number(item.is_visible) === 1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
};
const createCategory = async (payload) => {
  const state = await readState();
  state.categories ||= [];
  const name = String(payload.name || '').trim();
  if (state.categories.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    const error = new Error('A category with this name already exists.'); error.status = 409; throw error;
  }
  const id = state.categories.reduce((max,item)=>Math.max(max,Number(item.id)||0),0)+1;
  const slug = slugify(name);
  const item = { id, name, slug, description: String(payload.description||''), image: String(payload.image||''), is_visible: Number(payload.is_visible ?? 1), sort_order: Number(payload.sort_order ?? id) };
  state.categories.push(item); await writeState(state); return item;
};
const updateCategory = async (id,payload) => {
  const state=await readState(); const item=(state.categories||[]).find(x=>Number(x.id)===Number(id)); if(!item)return null;
  const name=payload.name===undefined?item.name:String(payload.name).trim();
  if((state.categories||[]).some(x=>Number(x.id)!==Number(id)&&x.name.toLowerCase()===name.toLowerCase())){const error=new Error('A category with this name already exists.');error.status=409;throw error;}
  Object.assign(item,{name,slug:slugify(name),description:payload.description??item.description,image:payload.image??item.image,is_visible:Number(payload.is_visible??item.is_visible),sort_order:Number(payload.sort_order??item.sort_order)});
  await writeState(state);return item;
};
const deleteCategory = async (id) => {
  const state=await readState();
  if((state.products||[]).some(p=>Number(p.category_id)===Number(id))){const error=new Error('Move or delete the products in this category before deleting it.');error.status=409;throw error;}
  const before=(state.categories||[]).length;state.categories=(state.categories||[]).filter(x=>Number(x.id)!==Number(id));await writeState(state);return state.categories.length!==before;
};
const getProducts = async ({ includeHidden = false } = {}) => {
  const state=await readState();
  return (state.products||[]).filter(p=>includeHidden||Number(p.is_published)===1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
};
const createProduct = async (payload) => {
  const state=await readState();state.products||=[];
  if(!(state.categories||[]).some(c=>Number(c.id)===Number(payload.category_id))) {const error=new Error('Choose a valid category.');error.status=400;throw error;}
  const id=state.products.reduce((max,p)=>Math.max(max,Number(p.id)||0),0)+1;
  const slug=slugify(payload.name);
  const item={id,name:String(payload.name).trim(),slug,description:String(payload.description||''),category_id:Number(payload.category_id),price:Number(payload.price),compare_at_price:payload.compare_at_price===''||payload.compare_at_price==null?null:Number(payload.compare_at_price),sku:String(payload.sku||''),image:String(payload.image||''),gallery:Array.isArray(payload.gallery)?payload.gallery:[],tags:Array.isArray(payload.tags)?payload.tags:[],stock:Number(payload.stock??0),is_published:Number(payload.is_published??1),sort_order:Number(payload.sort_order??id),created_at:new Date().toISOString()};
  if(!item.name||!Number.isFinite(item.price)||item.price<0){const error=new Error('Enter a product name and a valid price.');error.status=400;throw error;}
  if(state.products.some(p=>p.slug===slug)){item.slug=slug+'-'+id;}
  state.products.push(item);await writeState(state);return item;
};
const updateProduct = async (id,payload) => {
  const state=await readState();const item=(state.products||[]).find(p=>Number(p.id)===Number(id));if(!item)return null;
  if(payload.category_id!==undefined&&!state.categories.some(c=>Number(c.id)===Number(payload.category_id))){const error=new Error('Choose a valid category.');error.status=400;throw error;}
  const nextPrice=payload.price===undefined?item.price:Number(payload.price);if(!Number.isFinite(nextPrice)||nextPrice<0){const error=new Error('Enter a valid product price.');error.status=400;throw error;}
  Object.assign(item,{...payload,price:nextPrice,category_id:Number(payload.category_id??item.category_id),stock:Number(payload.stock??item.stock),is_published:Number(payload.is_published??item.is_published),sort_order:Number(payload.sort_order??item.sort_order),tags:Array.isArray(payload.tags)?payload.tags:item.tags,gallery:Array.isArray(payload.gallery)?payload.gallery:item.gallery});
  if(payload.name)item.slug=slugify(payload.name)+'-'+item.id;
  await writeState(state);return item;
};
const deleteProduct = async (id) => {const state=await readState();const before=(state.products||[]).length;state.products=(state.products||[]).filter(p=>Number(p.id)!==Number(id));await writeState(state);return state.products.length!==before;};
const createOrder = async (payload) => {
  const state=await readState();state.orders||=[];
  const lines=Array.isArray(payload.items)?payload.items:[];
  if(!lines.length||lines.length>50){const error=new Error('Your cart is empty or contains too many items.');error.status=400;throw error;}
  const items=lines.map(line=>{const product=(state.products||[]).find(p=>Number(p.id)===Number(line.product_id)&&Number(p.is_published)===1);if(!product) {const error=new Error('One of the products is no longer available. Refresh your cart and try again.');error.status=409;throw error;}const quantity=Math.max(1,Math.min(99,Math.floor(Number(line.quantity)||1)));if(Number(product.stock)>=0&&Number(product.stock)<quantity){const error=new Error(product.name+' does not have enough stock.');error.status=409;throw error;}return {product_id:product.id,name:product.name,sku:product.sku,image:product.image,unit_price:Number(product.price),quantity,line_total:Number((Number(product.price)*quantity).toFixed(2))};});
  const id=state.orders.reduce((max,o)=>Math.max(max,Number(o.id)||0),0)+1;
  const order={id,order_number:'FH-'+String(id).padStart(5,'0'),customer_name:String(payload.customer_name||'').trim(),email:String(payload.email||'').trim().toLowerCase(),phone:String(payload.phone||'').trim(),address:String(payload.address||'').trim(),notes:String(payload.notes||'').trim(),items,total:Number(items.reduce((sum,x)=>sum+x.line_total,0).toFixed(2)),currency:String(payload.currency||'USD'),status:'pending',created_at:new Date().toISOString()};
  if(!order.customer_name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)){const error=new Error('Enter your name and a valid email address.');error.status=400;throw error;}
  for (const line of items) { const product=state.products.find(p=>Number(p.id)===line.product_id); product.stock=Number(product.stock)-line.quantity; }
  state.orders.push(order);await writeState(state);return order;
};
const getOrders = async () => (await readState()).orders||[];
const updateOrderStatus = async (id,status) => {const allowed=['pending','confirmed','processing','shipped','completed','cancelled'];if(!allowed.includes(status)){const error=new Error('Invalid order status.');error.status=400;throw error;}const state=await readState();const order=(state.orders||[]).find(o=>Number(o.id)===Number(id));if(!order)return null;if(status==='cancelled'&&order.status!=='cancelled'){for(const line of order.items||[]){const product=(state.products||[]).find(p=>Number(p.id)===Number(line.product_id));if(product)product.stock=Number(product.stock||0)+Number(line.quantity||0);}}if(order.status==='cancelled'&&status!=='cancelled'){for(const line of order.items||[]){const product=(state.products||[]).find(p=>Number(p.id)===Number(line.product_id));if(!product||Number(product.stock)<Number(line.quantity)){const error=new Error('Not enough stock to reopen this order.');error.status=409;throw error;}product.stock=Number(product.stock)-Number(line.quantity);}}order.status=status;await writeState(state);return order;};

const getWebsitePayload = async () => {
  const state = await readState();
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
      hero_primary_cta: settings.hero_primary_cta === 'Book a consult' ? 'Shop the collection' : (settings.hero_primary_cta || defaultSettings.hero_primary_cta),
      hero_primary_link: settings.hero_primary_link === '#contact' ? '/shop' : (settings.hero_primary_link || defaultSettings.hero_primary_link),
      hero_secondary_cta: settings.hero_secondary_cta || defaultSettings.hero_secondary_cta,
      hero_secondary_link: settings.hero_secondary_link || defaultSettings.hero_secondary_link
    },
    navigation,
    homepage: { sections: homepage, featuredProjects, intro: homepage[0] || null },
    services,
    projects,
    categories: (state.categories || []).filter((item) => Number(item.is_visible) === 1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)),
    products: (state.products || []).filter((item) => Number(item.is_published) === 1).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)).map((product) => ({ ...product, category: (state.categories || []).find((category) => Number(category.id) === Number(product.category_id)) || null })),
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
  getUsers,
  createUser,
  updateUserPassword,
  deleteUser,
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  createOrder, getOrders, updateOrderStatus,
  getWebsitePayload,
  readState,
  writeState
};
