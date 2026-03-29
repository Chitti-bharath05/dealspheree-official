const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { initExpiryJob } = require('./utils/expiryJob');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    initExpiryJob(); // Start daily cron tasks
});
