const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('../../backend/config/database');

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const app = express();

// Connect to database
connectDB();

// Root-level tracking endpoint (for QR codes)
app.get('/:id', async (req, res) => {
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

// Export the app for EdgeOne Pages
module.exports = app;