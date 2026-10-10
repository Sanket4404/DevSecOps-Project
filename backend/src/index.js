require('dotenv').config();

const express = require('express');
const cors = require('cors');

const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Trust reverse proxy headers when running behind Nginx/load balancer
app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Jerney API is running'
  });
});

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    error: 'Internal server error'
  });
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (typeof db.closeDB === 'function') {
      await db.closeDB();
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Initialize database and start server
async function start() {
  try {
    await db.initDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Jerney backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
