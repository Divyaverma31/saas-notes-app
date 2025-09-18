import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-12345';
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// In-memory database
let users = [
  {
    id: '1',
    email: 'admin@acme.test',
    password: bcrypt.hashSync('password', 10),
    role: 'admin',
    tenant: { id: '1', name: 'Acme Corp', slug: 'acme', plan: 'free' }
  },
  {
    id: '2',
    email: 'user@acme.test',
    password: bcrypt.hashSync('password', 10),
    role: 'member',
    tenant: { id: '1', name: 'Acme Corp', slug: 'acme', plan: 'free' }
  },
  {
    id: '5',
    email: 'user2@acme.test',
    password: bcrypt.hashSync('password', 10),
    role: 'member',
    tenant: { id: '1', name: 'Acme Corp', slug: 'acme', plan: 'free' }
  },
  {
    id: '3',
    email: 'admin@globex.test',
    password: bcrypt.hashSync('password', 10),
    role: 'admin',
    tenant: { id: '2', name: 'Globex Inc', slug: 'globex', plan: 'free' }
  },
  {
    id: '4',
    email: 'user@globex.test',
    password: bcrypt.hashSync('password', 10),
    role: 'member',
    tenant: { id: '2', name: 'Globex Inc', slug: 'globex', plan: 'free' }
  },
  {
    id: '6',
    email: 'user2@globex.test',
    password: bcrypt.hashSync('password', 10),
    role: 'member',
    tenant: { id: '2', name: 'Globex Inc', slug: 'globex', plan: 'free' }
  }
];


let notes = [];

// Utility functions
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant.id
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function getTenantNoteCount(tenantId) {
  return notes.filter(note => note.tenantId === tenantId).length;
}

function getTenantPlan(tenantId) {
  const user = users.find(u => u.tenant.id === tenantId);
  return user ? user.tenant.plan : 'free';
}

// Serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Authentication endpoints



app.get('/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userResponse = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenant: user.tenant
  };

  res.json({ user: userResponse });
});

// Notes endpoints
app.get('/notes', authenticateToken, (req, res) => {
  try {
    const userNotes = notes.filter(note => note.tenantId === req.user.tenantId);
    res.json(userNotes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/notes/:id', authenticateToken, (req, res) => {
  try {
    const note = notes.find(n => n.id === req.params.id && n.tenantId === req.user.tenantId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/notes', authenticateToken, (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    // Check subscription limits
    const currentPlan = getTenantPlan(req.user.tenantId);
    const currentNoteCount = getTenantNoteCount(req.user.tenantId);

    if (currentPlan === 'free' && currentNoteCount >= 3) {
      return res.status(403).json({ 
        error: 'Free plan limit reached. Upgrade to Pro for unlimited notes.',
        code: 'SUBSCRIPTION_LIMIT_REACHED'
      });
    }

    const note = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.push(note);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/notes/:id', authenticateToken, (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const noteIndex = notes.findIndex(n => n.id === req.params.id && n.tenantId === req.user.tenantId);
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    };

    res.json(notes[noteIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/notes/:id', authenticateToken, (req, res) => {
  try {
    const noteIndex = notes.findIndex(n => n.id === req.params.id && n.tenantId === req.user.tenantId);
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notes.splice(noteIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tenant management endpoints
app.get('/tenants/:slug', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user || user.tenant.slug !== req.params.slug) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const noteCount = getTenantNoteCount(req.user.tenantId);
    const tenantInfo = {
      ...user.tenant,
      noteCount,
      noteLimit: user.tenant.plan === 'free' ? 3 : null
    };

    res.json(tenantInfo);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/tenants/:slug/upgrade', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user || user.tenant.slug !== req.params.slug) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update all users in the tenant to Pro plan
    users.forEach(u => {
      if (u.tenant.id === req.user.tenantId) {
        u.tenant.plan = 'pro';
      }
    });

    const updatedTenant = {
      ...user.tenant,
      plan: 'pro',
      noteCount: getTenantNoteCount(req.user.tenantId),
      noteLimit: null
    };

    res.json({
      message: 'Subscription upgraded to Pro',
      tenant: updatedTenant
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('📚 API Documentation:');
    console.log('  Health: GET /health');
    console.log('  Login: POST /auth/login');
    console.log('  Notes: GET/POST /notes');
    console.log('  Frontend: http://localhost:' + PORT);
  });
}

// Export for Vercel
export default app;