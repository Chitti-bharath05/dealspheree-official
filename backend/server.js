const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { initExpiryJob } = require('./utils/expiryJob');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ Enable Trust Proxy (Required for Render/Vercel rate-limiting)
app.set('trust proxy', 1);

// 🛡️ Security Check: Ensure critical secrets are present
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(e => !process.env[e]);
if (missingEnv.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
    console.error('The server cannot start without these security keys. Update your .env file.');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Fail after 5s if replica set not found
    connectTimeoutMS: 10000,        // Give 10s for initial connection
    socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      if (err.name === 'MongoNetworkError') {
          console.error('Check if your IP address is whitelisted in MongoDB Atlas.');
      }
  });

// Middleware
app.use(cors({
    origin: [
        'https://dealspheree.in', 
        'https://www.dealspheree.in', 
        'http://dealspheree.in',
        'http://www.dealspheree.in',
        'http://localhost:19006', 
        'http://localhost:5000',
        'http://localhost:8081',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// 🛡️ Global Security Middleware
app.use(helmet()); // Set secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL operator injection

// 🛡️ Rate Limiting: Prevent Brute-force & Spam
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for smoother testing
    message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 100, // Developer friendly: 100 attempts per minute
    message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// Simple Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Mall & Online Offers Aggregator API' });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'up', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/categories', (req, res) => {
    const { CATEGORIES } = require('./data/mockData');
    res.json(CATEGORIES);
});

// 🛡️ Global Error Handler (MUST be the last middleware)
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    console.error(`💥 [${new Date().toISOString()}] ${req.method} ${req.url} - Error:`, err.message);
    if (statusCode === 500) {
        console.error(err.stack);
    }
    
    res.status(statusCode).json({ 
        success: false, 
        message: statusCode === 500 ? 'Internal Server Error' : err.message,
        path: req.originalUrl
    });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Bound to 0.0.0.0)`);
    initExpiryJob(); // Start daily cron tasks
});
