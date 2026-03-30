const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Serialize user to session
passport.serializeUser((user, done) => {
  console.log('=== Serializing user ===');
  console.log('User ID:', user.id);
  console.log('User email:', user.email);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    console.log('=== Deserializing user ===');
    console.log('User ID from session:', id);
    
    // Check if this is a mock user ID
    if (id.startsWith('mock-user-')) {
      console.log('Mock user detected, creating mock user object');
      const mockUser = {
        _id: id,
        email: 'mock@example.com',
        displayName: 'Mock User',
        isDemo: true,
        getPublicProfile: function() {
          return {
            id: this._id,
            email: this.email,
            displayName: this.displayName,
            isDemo: true
          };
        }
      };
      return done(null, mockUser);
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      console.error('User not found for ID:', id);
      return done(new Error('User not found'), null);
    }
    
    console.log('Found user:', user.email);
    done(null, user);
  } catch (error) {
    console.error('=== Error in deserializeUser ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    
    // If database error, create mock user for development
    if (error.name === 'MongoServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      console.warn('Database not available in deserializeUser, creating mock user');
      const mockUser = {
        _id: 'mock-user-' + Date.now(),
        email: 'mock@example.com',
        displayName: 'Mock User (DB Offline)',
        isDemo: true,
        getPublicProfile: function() {
          return {
            id: this._id,
            email: this.email,
            displayName: this.displayName,
            isDemo: true
          };
        }
      };
      return done(null, mockUser);
    }
    
    done(error, null);
  }
});

// Google OAuth Strategy - only configure if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('=== Google OAuth Configuration ===');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL);
  console.log('Client Secret present:', !!process.env.GOOGLE_CLIENT_SECRET);
  
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('=== Google OAuth Strategy Callback ===');
        console.log('Google Profile ID:', profile.id);
        console.log('Google Profile Email:', profile.emails?.[0]?.value);
        console.log('Google Profile Name:', profile.displayName);
        
        // Find or create user
        const user = await User.findOrCreate(profile);
        
        console.log('User found/created:', user.email);
        console.log('User ID:', user._id);
        
        // Update last active timestamp
        user.stats.lastActive = Date.now();
        await user.save();
        
        return done(null, user);
      } catch (error) {
        console.error('=== Error in Google OAuth callback ===');
        console.error('Error:', error);
        console.error('Error stack:', error.stack);
        console.error('Profile data:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });
        return done(error, null);
      }
    }
  ));
} else {
  console.warn('Google OAuth credentials not configured. Google Sign-In will not work.');
  console.warn('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
}

module.exports = passport;