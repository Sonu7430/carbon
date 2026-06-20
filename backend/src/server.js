import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { getDb } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load routes
import authRouter from './routes/auth.js';
import activitiesRouter from './routes/activities.js';
import profileRouter from './routes/profile.js';
import dashboardRouter from './routes/dashboard.js';
import goalsRouter from './routes/goals.js';
import actionsRouter from './routes/actions.js';
import insightsRouter from './routes/insights.js';

// Configure environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true, // required for reading cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(cookieParser());
app.use(express.json());

// Bind API routes
app.use('/api/auth', authRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/insights', insightsRouter);

// Serve frontend static assets from backend/public
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// Catch-all 404 for unhandled API requests
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// For all non-API requests, send index.html (supporting SPA client-side routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global Error Handler - logs details server-side, blocks leakage to client
app.use((err, req, res, next) => {
  console.error('Unhandled Error Caught:', err);
  
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected database or server error occurred.'
      : err.message || 'An internal server error occurred.'
  });
});

// Initialize database and start listening
async function startServer() {
  try {
    // Force DB initialization at startup
    const db = await getDb();
    console.log('Successfully connected to SQLite database at', db.config.filename);
    
    app.listen(PORT, () => {
      console.log(`EcoTrack Backend Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server database:', error);
    process.exit(1);
  }
}

// Support starting the server when invoked directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
