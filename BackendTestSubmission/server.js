const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const {
  expressMiddleware,
  logInfo,
  logError,
  logWarn
} = require('../LoggingMiddleware');

const urlRoutes = require('./routes/urlRoutes');

const app = express();
const PORT = process.env.PORT || 3100;

app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});
app.use(limiter);

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(expressMiddleware);

app.get('/health', (req, res) => {
  logInfo('Health check requested');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/', urlRoutes);

app.use('*', (req, res) => {
  logWarn('Route not found', { url: req.originalUrl, method: req.method });
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  logError('Unhandled error', err, {
    url: req.originalUrl,
    method: req.method,
    body: req.body
  });
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  logInfo(`Backend started on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
