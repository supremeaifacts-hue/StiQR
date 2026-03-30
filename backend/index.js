const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Google OAuth Callback: ${process.env.GOOGLE_CALLBACK_URL || 'Not configured'}`);
});
