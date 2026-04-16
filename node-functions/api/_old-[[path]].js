const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('../../backend/config/passport');
const { connectDB } = require('../../backend/config/database');
const authRoutes = require('../../backend/routes/auth');
const assetsRoutes = require('../../backend/routes/assets');

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const app = express();

// Connect to database
connectDB();

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
// Increase payload size limit for image data (stickers/logos are base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Root-level tracking endpoint (for QR codes) - MUST be BEFORE passport middleware
app.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Tracking endpoint called for ID: ${id}`);
    
    // Import required modules
    const User = require('../../backend/models/User');
    
    // Find user by QR code ID
    const user = await User.findOne({ 'qrCodes.id': id });
    if (!user) {
      console.log(`❌ QR code not found for ID: ${id}`);
      return res.status(404).send('QR code not found');
    }
    
    // Find the specific QR code
    const qrCode = user.qrCodes.find(qr => qr.id === id);
    if (!qrCode) {
      console.log(`❌ QR code data not found for ID: ${id}`);
      return res.status(404).send('QR code data not found');
    }
    
    console.log(`📊 Found QR code:`, {
      id: qrCode.id,
      data: qrCode.data,
      scans: qrCode.scans || 0
    });
    
    // Increment scan count
    qrCode.scans = (qrCode.scans || 0) + 1;
    qrCode.lastScanned = new Date();
    
    // Add scan tracking data
    const scanData = {
      timestamp: new Date(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer']
    };
    
    if (!qrCode.scanHistory) {
      qrCode.scanHistory = [];
    }
    qrCode.scanHistory.push(scanData);
    
    // Save the user
    await user.save();
    
    console.log(`✅ Scan recorded. New scan count: ${qrCode.scans}`);
    
    // Get the destination URL
    let destinationUrl = qrCode.data;
    
    // Ensure URL has protocol
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      destinationUrl = 'https://' + destinationUrl;
    }
    
    console.log(`🔗 Redirecting to: ${destinationUrl}`);
    
    // Redirect to the destination
    res.redirect(302, destinationUrl);
  } catch (error) {
    console.error('❌ Error in tracking endpoint:', error);
    res.status(500).send('Internal server error');
  }
});

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api', assetsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'StickerQR backend running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app for EdgeOne Pages
module.exports = app;