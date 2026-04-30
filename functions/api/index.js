const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();

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

// Import User model
const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null for other auth methods
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  profilePicture: {
    type: String
  },
  // Authentication provider: 'google' or 'local'
  authProvider: {
    type: String,
    enum: ['google', 'local'],
    default: 'google'
  },
  // Password for local authentication
  password: {
    type: String,
    select: false // Don't return password in queries
  },
  // User preferences and settings
  preferences: {
    theme: {
      type: String,
      default: 'dark',
      enum: ['light', 'dark', 'system']
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  // User stats
  stats: {
    qrCodesCreated: {
      type: Number,
      default: 0
    },
    totalScans: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  // Subscription and trial information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    trialEndsAt: {
      type: Date,
      default: function() {
        // Set trial to end 1 week from account creation
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        return oneWeekFromNow;
      }
    },
    subscribedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // User assets
  stickers: [{
    id: {
      type: String,
      required: true
    },
    data: {
      type: String, // Base64 encoded image data or emoji
      required: true
    },
    name: {
      type: String,
      default: 'Untitled Sticker'
    },
    category: {
      type: String,
      default: 'custom'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  logos: [{
    id: {
      type: String,
      required: true
    },
    data: {
      type: String, // Base64 encoded image data
      required: true
    },
    name: {
      type: String,
      default: 'Untitled Logo'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  qrCodes: [{
    id: {
      type: String,
      required: true
    },
    data: {
      type: String, // QR code data/URL
      required: true
    },
    imageData: {
      type: String, // Base64 encoded QR code image
      required: true
    },
    name: {
      type: String,
      default: 'Untitled QR Code'
    },
    scans: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastScanned: {
      type: Date,
      default: Date.now
    },
    scanHistory: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      ipAddress: {
        type: String
      },
      userAgent: {
        type: String
      },
      location: {
        city: String,
        region: String,
        country: String,
        countryCode: String
      },
      device: {
        type: {
          type: String,
          enum: ['phone', 'tablet', 'desktop', 'bot', 'other']
        },
        brand: String,
        model: String,
        os: {
          name: String,
          version: String
        },
        browser: {
          name: String,
          version: String
        }
      }
    }]
  }],
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (next && typeof next === 'function') {
    next();
  }
});

// Method to get public user profile (without sensitive data)
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.googleId;
  delete userObject.__v;
  return userObject;
};

// Static method to find or create user from Google profile
UserSchema.statics.findOrCreate = async function(profile) {
  console.log('=== User.findOrCreate ===');
  console.log('Looking for user with Google ID:', profile.id);
  
  try {
    let user = await this.findOne({ googleId: profile.id });
    
    if (!user) {
      console.log('No user found with Google ID, checking email:', profile.emails?.[0]?.value);
      // Also check if user exists with same email
      user = await this.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        console.log('Creating new user with email:', profile.emails[0].value);
        // Create new user
        user = new this({
          googleId: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profilePicture: profile.photos?.[0]?.value,
          authProvider: 'google',
          isVerified: true // Google verified emails are considered verified
        });
      } else {
        console.log('Found existing user with email, linking Google account:', user.email);
        // Link existing user with Google account
        user.googleId = profile.id;
        user.authProvider = 'google';
        user.profilePicture = profile.photos?.[0]?.value || user.profilePicture;
        user.isVerified = true;
      }
      
      await user.save();
      console.log('User saved successfully:', user.email);
    } else {
      console.log('Found existing user with Google ID:', user.email);
    }
    
    return user;
  } catch (error) {
    console.error('=== Error in User.findOrCreate ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    
    // If database is not available, create a mock user for development
    if (error.name === 'MongoServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      console.warn('Database not available, creating mock user for development');
      const mockUser = {
        _id: 'mock-user-' + Date.now(),
        googleId: profile.id,
        email: profile.emails?.[0]?.value || 'user@example.com',
        displayName: profile.displayName || 'Mock User',
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profilePicture: profile.photos?.[0]?.value,
        isVerified: true,
        getPublicProfile: function() {
          return {
            id: this._id,
            email: this.email,
            displayName: this.displayName,
            firstName: this.firstName,
            lastName: this.lastName,
            profilePicture: this.profilePicture,
            isDemo: true
          };
        }
      };
      return mockUser;
    }
    
    throw error;
  }
};

const User = mongoose.model('User', UserSchema);

// Connect to database
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stickerqr';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't throw error for development - allow mock users
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

connectDB();

// Middleware to check if user is authenticated (supports both session and JWT)
const isAuthenticated = async (req, res, next) => {
  // Check session-based authentication first
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Attach user to request object
      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  // Check JWT token from query parameter (for backward compatibility)
  const token = req.query.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Attach user to request object
      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  res.status(401).json({ error: 'Not authenticated' });
};

// Generate unique ID for assets
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ========== AUTH ROUTES ==========
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOrCreate(profile);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // For mock users, return the mock user object
    if (id.toString().startsWith('mock-user-')) {
      return done(null, { _id: id, isDemo: true });
    }
    
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
  session: true
}), (req, res) => {
  // Successful authentication
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/dashboard`);
});

// Logout route
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get current user
app.get('/auth/current', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user.getPublicProfile ? req.user.getPublicProfile() : req.user;
    res.json({ success: true, user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Demo login (for development)
app.post('/auth/demo', async (req, res) => {
  try {
    const mockUser = {
      _id: 'demo-user-' + Date.now(),
      email: 'demo@example.com',
      displayName: 'Demo User',
      firstName: 'Demo',
      lastName: 'User',
      profilePicture: null,
      isDemo: true,
      getPublicProfile: function() {
        return {
          id: this._id,
          email: this.email,
          displayName: this.displayName,
          firstName: this.firstName,
          lastName: this.lastName,
          profilePicture: this.profilePicture,
          isDemo: true
        };
      }
    };
    
    // For demo, we'll just return the user without session
    res.json({
      success: true,
      user: mockUser.getPublicProfile(),
      token: jwt.sign({ userId: mockUser._id, isDemo: true }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '7d' })
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// ========== ASSETS ROUTES ==========

// Get all user assets
app.get('/assets', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      stickers: user.stickers || [],
      logos: user.logos || [],
      qrCodes: user.qrCodes || []
    });
  } catch (error) {
    console.error('Error fetching user assets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a sticker
app.post('/assets/stickers', isAuthenticated, async (req, res) => {
  try {
    const { data, name, category } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Sticker data is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newSticker = {
      id: generateId(),
      data,
      name: name || 'Untitled Sticker',
      category: category || 'custom',
      createdAt: new Date()
    };

    user.stickers.push(newSticker);
    await user.save();

    res.json({
      success: true,
      sticker: newSticker,
      message: 'Sticker saved successfully'
    });
  } catch (error) {
    console.error('Error saving sticker:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a logo
app.post('/assets/logos', isAuthenticated, async (req, res) => {
  try {
    const { data, name } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Logo data is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newLogo = {
      id: generateId(),
      data,
      name: name || 'Untitled Logo',
      createdAt: new Date()
    };

    user.logos.push(newLogo);
    await user.save();

    res.json({
      success: true,
      logo: newLogo,
      message: 'Logo saved successfully'
    });
  } catch (error) {
    console.error('Error saving logo:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a QR code
app.post('/assets/qrcodes', isAuthenticated, async (req, res) => {
  try {
    const { data, imageData, name } = req.body;
    
    if (!data || !imageData) {
      return res.status(400).json({ error: 'QR code data and image data are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const qrId = generateId();
    const newQrCode = {
      id: qrId,
      data,
      imageData,
      name: name || 'Untitled QR Code',
      scans: 0,
      createdAt: new Date(),
      lastScanned: new Date()
    };

    user.qrCodes.push(newQrCode);
    
    // Update stats
    user.stats.qrCodesCreated = (user.stats.qrCodesCreated || 0) + 1;
    
    await user.save();

    // Generate scan URL - Note: In EdgeOne Pages, the base URL will be handled by the platform
    const scanUrl = `/assets/qrcodes/${qrId}/redirect`;

    res.json({
      success: true,
      qrCode: {
        ...newQrCode,
        scanUrl
      },
      message: 'QR code saved successfully'
    });
  } catch (error) {
    console.error('Error saving QR code:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a sticker
app.delete('/assets/stickers/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const initialLength = user.stickers.length;
    user.stickers = user.stickers.filter(sticker => sticker.id !== id);
    
    if (user.stickers.length === initialLength) {
      return res.status(404).json({ error: 'Sticker not found' });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Sticker deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sticker:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a logo
app.delete('/assets/logos/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const initialLength = user.logos.length;
    user.logos = user.logos.filter(logo => logo.id !== id);
    
    if (user.logos.length === initialLength) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Logo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a QR code
app.delete('/assets/qrcodes/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const initialLength = user.qrCodes.length;
    user.qrCodes = user.qrCodes.filter(qrCode => qrCode.id !== id);
    
    if (user.qrCodes.length === initialLength) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    await user.save();

    res.json({
      success: true,
      message: 'QR code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update QR code scan count (public endpoint - no authentication required)
app.post('/assets/qrcodes/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by QR code ID (we need to search all users)
    const user = await User.findOne({ 'qrCodes.id': id });
    if (!user) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const qrCode = user.qrCodes.find(qr => qr.id === id);
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    qrCode.scans = (qrCode.scans || 0) + 1;
    qrCode.lastScanned = new Date();
    
    // Update total scans in stats
    user.stats.totalScans = (user.stats.totalScans || 0) + 1;
    
    await user.save();

    res.json({
      success: true,
      scans: qrCode.scans,
      message: 'Scan recorded successfully'
    });
  } catch (error) {
    console.error('Error recording scan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get QR code data for scanning (public endpoint)
app.get('/assets/qrcodes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by QR code ID
    const user = await User.findOne({ 'qrCodes.id': id });
    if (!user) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const qrCode = user.qrCodes.find(qr => qr.id === id);
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        data: qrCode.data,
        name: qrCode.name,
        scans: qrCode.scans || 0,
        createdAt: qrCode.createdAt,
        lastScanned: qrCode.lastScanned
      }
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to parse user agent and get device info
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      type: 'other',
      brand: 'Unknown',
      model: 'Unknown',
      os: { name: 'Unknown', version: '' },
      browser: { name: 'Unknown', version: '' }
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType = 'other';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'phone';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    deviceType = 'desktop';
  } else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    deviceType = 'bot';
  }

  // Detect OS
  let osName = 'Unknown';
  let osVersion = '';
  if (ua.includes('windows')) {
    osName = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    osName = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (ua.includes('android')) {
    osName = 'Android';
    const match = ua.match(/android (\d+\.\d+)/);
    if (match) osVersion = match[1];
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (ua.includes('linux')) {
    osName = 'Linux';
  }

  // Detect browser
  let browserName = 'Unknown';
  let browserVersion = '';
  if (ua.includes('chrome') && !ua.includes('chromium')) {
    browserName = 'Chrome';
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox';
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserName = 'Safari';
    const match = ua.match(/version\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('edge')) {
    browserName = 'Edge';
    const match = ua.match(/edge\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('opera')) {
    browserName = 'Opera';
    const match = ua.match(/opera\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  // Detect device brand/model
  let brand = 'Unknown';
  let model = 'Unknown';
  
  if (ua.includes('iphone')) {
    brand = 'Apple';
    model = 'iPhone';
  } else if (ua.includes('ipad')) {
    brand = 'Apple';
    model = 'iPad';
  } else if (ua.includes('macintosh')) {
    brand = 'Apple';
    model = 'Mac';
  } else if (ua.includes('samsung')) {
    brand = 'Samsung';
    model = 'Galaxy';
  } else if (ua.includes('huawei')) {
    brand = 'Huawei';
  } else if (ua.includes('xiaomi')) {
    brand = 'Xiaomi';
  } else if (ua.includes('google')) {
    brand = 'Google';
    if (ua.includes('pixel')) model = 'Pixel';
  }

  return {
    type: deviceType,
    brand,
    model,
    os: { name: osName, version: osVersion },
    browser: { name: browserName, version: browserVersion }
  };
}

// Helper function to get location from IP (simulated for now)
function getLocationFromIp(ipAddress) {
  // In a real implementation, you would use a geolocation API like ipinfo.io
  // For now, we'll simulate some locations based on IP patterns or return default
  
  // Default location
  const defaultLocation = {
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    countryCode: 'XX'
  };
  
  // Simple simulation based on IP patterns (for demo purposes)
  if (ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return {
      city: 'Localhost',
      region: 'Development',
      country: 'Local Network',
      countryCode: 'LN'
    };
  }
  
  // You would typically use an API like:
  // const response = await fetch(`https://ipinfo.io/${ipAddress}/json?token=YOUR_TOKEN`);
  // const data = await response.json();
  // return {
  //   city: data.city || 'Unknown',
  //   region: data.region || 'Unknown',
  //   country: data.country || 'Unknown',
  //   countryCode: data.country || 'XX'
  // };
  
  return defaultLocation;
}

// Redirect endpoint for QR code scanning (records scan and redirects)
app.get('/assets/qrcodes/:id/redirect', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by QR code ID
    const user = await User.findOne({ 'qrCodes.id': id });
    if (!user) {
      return res.status(404).send('QR code not found');
    }

    const qrCode = user.qrCodes.find(qr => qr.id === id);
    if (!qrCode) {
      return res.status(404).send('QR code not found');
    }

    // Get client information
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Parse device information from user agent
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location from IP (simulated for now)
    const location = getLocationFromIp(ipAddress);
    
    // Create scan record
    const scanRecord = {
      timestamp: new Date(),
      ipAddress,
      userAgent,
      location,
      device: deviceInfo
    };
    
    // Record the scan
    qrCode.scans = (qrCode.scans || 0) + 1;
    qrCode.lastScanned = new Date();
    
    // Add to scan history (only for Pro/Ultra users or if subscription allows)
    if (user.subscription.plan !== 'free') {
      // Initialize scanHistory if it doesn't exist
      if (!qrCode.scanHistory) {
        qrCode.scanHistory = [];
      }
      qrCode.scanHistory.push(scanRecord);
    }
    
    // Update total scans in stats
    user.stats.totalScans = (user.stats.totalScans || 0) + 1;
    
    await user.save();

    // Redirect to the actual URL
    res.redirect(qrCode.data);
  } catch (error) {
    console.error('Error processing QR code redirect:', error);
    res.status(500).send('Server error');
  }
});

// Get scan statistics for a QR code (authenticated endpoint)
app.get('/assets/qrcodes/:id/statistics', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by QR code ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const qrCode = user.qrCodes.find(qr => qr.id === id);
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Check if user has access to detailed statistics (Pro/Ultra tier)
    if (user.subscription.plan === 'free') {
      return res.json({
        success: true,
        qrCode: {
          id: qrCode.id,
          name: qrCode.name,
          scans: qrCode.scans || 0,
          lastScanned: qrCode.lastScanned
        },
        statistics: {
          totalScans: qrCode.scans || 0,
          message: 'Upgrade to Pro or Ultra plan to view detailed scan statistics'
        }
      });
    }

    // Get scan history
    const scanHistory = qrCode.scanHistory || [];
    
    // Calculate statistics
    const statistics = {
      totalScans: qrCode.scans || 0,
      scanHistory: scanHistory.map(scan => ({
        timestamp: scan.timestamp,
        location: scan.location,
        device: scan.device
      })),
      // Device breakdown
      deviceTypes: {},
      // OS breakdown
      operatingSystems: {},
      // Browser breakdown
      browsers: {},
      // Location breakdown
      locations: {},
      // Hourly breakdown
      hourlyScans: Array(24).fill(0)
    };

    // Calculate breakdowns
    scanHistory.forEach(scan => {
      // Device type
      const deviceType = scan.device.type || 'other';
      statistics.deviceTypes[deviceType] = (statistics.deviceTypes[deviceType] || 0) + 1;
      
      // OS
      const osName = scan.device.os?.name || 'Unknown';
      statistics.operatingSystems[osName] = (statistics.operatingSystems[osName] || 0) + 1;
      
      // Browser
      const browserName = scan.device.browser?.name || 'Unknown';
      statistics.browsers[browserName] = (statistics.browsers[browserName] || 0) + 1;
      
      // Location
      const locationKey = `${scan.location.city}, ${scan.location.country}`;
      statistics.locations[locationKey] = (statistics.locations[locationKey] || 0) + 1;
      
      // Hour
      const hour = new Date(scan.timestamp).getHours();
      statistics.hourlyScans[hour]++;
    });

    res.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        scans: qrCode.scans || 0,
        lastScanned: qrCode.lastScanned
      },
      statistics
    });
  } catch (error) {
    console.error('Error fetching QR code statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'StickerQR backend running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes placeholder
app.get('/health', (req, res) => {
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

// Start server if running locally (not in EdgeOne Pages)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
