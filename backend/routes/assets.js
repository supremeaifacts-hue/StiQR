const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

// Get all user assets
router.get('/assets', isAuthenticated, async (req, res) => {
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
router.post('/assets/stickers', isAuthenticated, async (req, res) => {
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
router.post('/assets/logos', isAuthenticated, async (req, res) => {
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
router.post('/assets/qrcodes', isAuthenticated, async (req, res) => {
  try {
    const { data, imageData, name, qrCodeId } = req.body;
    
    console.log('=== SAVE QR CODE REQUEST RECEIVED ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('data (destination):', data ? data.substring(0, 100) : 'MISSING');
    console.log('imageData length:', imageData ? imageData.length : 'MISSING');
    console.log('name:', name || 'not provided');
    console.log('qrCodeId:', qrCodeId || 'not provided');
    console.log('User ID:', req.user ? req.user._id : 'NO USER ON REQUEST');
    console.log('User email:', req.user ? req.user.email : 'N/A');
    
    if (!data || !imageData) {
      console.log('❌ Missing required fields: data=' + !!data + ', imageData=' + !!imageData);
      return res.status(400).json({ error: 'QR code data and image data are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('❌ User not found in database for ID:', req.user._id);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User found:', user.email);
    console.log('Current QR codes count before save:', user.qrCodes ? user.qrCodes.length : 0);

    // Use provided ID or generate a new one
    const qrId = qrCodeId || generateId();
    console.log('Using QR code ID:', qrId);
    
    // Generate tracking URL
    const trackingUrl = `${req.protocol}://${req.get('host')}/track/${qrId}`;
    const scanUrl = trackingUrl; // For backward compatibility
    console.log('Tracking URL:', trackingUrl);
    
    const newQrCode = {
      id: qrId,
      data, // Store the original destination URL
      imageData, // QR code image is already encoded with the tracking URL from frontend
      name: name || 'Untitled QR Code',
      scans: 0,
      createdAt: new Date(),
      lastScanned: new Date()
    };

    user.qrCodes.push(newQrCode);
    
    // Update stats
    user.stats.qrCodesCreated = (user.stats.qrCodesCreated || 0) + 1;
    
    await user.save();
    console.log('✅ QR code saved successfully!');
    console.log('New QR codes count after save:', user.qrCodes.length);
    console.log('Last QR code ID:', user.qrCodes[user.qrCodes.length - 1].id);
    console.log('Last QR code data:', user.qrCodes[user.qrCodes.length - 1].data);

    // Return both the tracking URL and the original data
    res.json({
      success: true,
      qrCode: {
        ...newQrCode,
        trackingUrl,
        scanUrl, // For backward compatibility
        originalUrl: data
      }
    });
  } catch (error) {
    console.error('❌ Error saving QR code:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Delete a sticker
router.delete('/assets/stickers/:id', isAuthenticated, async (req, res) => {
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
router.delete('/assets/logos/:id', isAuthenticated, async (req, res) => {
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
router.delete('/assets/qrcodes/:id', isAuthenticated, async (req, res) => {
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
router.post('/assets/qrcodes/:id/scan', async (req, res) => {
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

// Handle legacy QR code URLs with extra path segments
// This catches patterns like /api/assets/qrcodes/:id/*
// and redirects them to the proper tracking endpoint
// Using a parameter that can match any path
router.get('/assets/qrcodes/:id/:path', async (req, res) => {
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

    // Redirect to the proper tracking endpoint
    res.redirect(`/track/${id}`);
  } catch (error) {
    console.error('Error handling legacy QR code URL:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get QR code data for scanning (public endpoint)
router.get('/assets/qrcodes/:id', async (req, res) => {
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
router.get('/assets/qrcodes/:id/redirect', async (req, res) => {
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
    // Ensure the URL has a protocol (http:// or https://)
    let redirectUrl = qrCode.data;
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = 'https://' + redirectUrl;
    }
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error processing QR code redirect:', error);
    res.status(500).send('Server error');
  }
});

// Get scan statistics for a QR code (authenticated endpoint)
router.get('/assets/qrcodes/:id/statistics', isAuthenticated, async (req, res) => {
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

// Simple tracking endpoint that redirects to the full tracking endpoint
router.get('/track/:id', async (req, res) => {
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

    // Redirect to the full tracking endpoint which will record the scan and redirect to destination
    res.redirect(`/api/assets/qrcodes/${id}/redirect`);
  } catch (error) {
    console.error('Error in tracking endpoint:', error);
    res.status(500).send('Server error');
  }
});

// Simple stats endpoint - returns just scan count
router.get('/qrcodes/:id/stats', isAuthenticated, async (req, res) => {
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

    res.json({
      success: true,
      scanCount: qrCode.scans || 0
    });
  } catch (error) {
    console.error('Error fetching QR code stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Note: Legacy QR code URLs like /api/assets/qrcodes/:id/destination
// are not supported. QR codes should be accessed via /track/:id
// which redirects to /api/assets/qrcodes/:id/redirect

// Get user subscription status
router.get('/user/subscription', isAuthenticated, async (req, res) => {
  try {
    // ADDED LOGS AS REQUESTED
    console.log('=== SUBSCRIPTION CHECK ===');
    console.log('User ID:', req.user?._id);
    console.log('User email:', req.user?.email);
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('User found? No');
      return res.status(404).json({ error: 'User not found' });
    }

    // ADDED LOGS AS REQUESTED
    console.log('Subscription status from DB:', user.subscriptionStatus);
    console.log('Plan type from DB:', user.planType);
    console.log('User subscription object:', user.subscription);
    console.log('User found? Yes');

    // Determine subscription status based on plan and isActive
    const subscriptionStatus = user.subscription.isActive && 
                              (user.subscription.plan === 'pro' || user.subscription.plan === 'ultra') 
                              ? 'active' : 'inactive';
    
    // Determine subscription end date
    let subscriptionEndDate = null;
    if (user.subscription.stripeCurrentPeriodEnd) {
      subscriptionEndDate = user.subscription.stripeCurrentPeriodEnd;
    } else if (user.subscription.expiresAt) {
      subscriptionEndDate = user.subscription.expiresAt;
    } else if (user.subscription.trialEndsAt) {
      subscriptionEndDate = user.subscription.trialEndsAt;
    }

    res.json({
      subscriptionStatus,
      planType: user.subscription.plan,
      subscriptionEndDate,
      isActive: user.subscription.isActive,
      stripeCustomerId: user.subscription.stripeCustomerId,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId,
      trialEndsAt: user.subscription.trialEndsAt,
      subscribedAt: user.subscription.subscribedAt
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

