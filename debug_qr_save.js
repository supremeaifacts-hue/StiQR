// Debug script to check QR code saving
// This simulates what happens when a QR code is saved

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function debugQrSave() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr');
    console.log('Connected to MongoDB');
    
    // Get User model
    const User = require('./backend/models/User');
    
    // Check the saveQrCode function in assets.js
    console.log('\n=== Checking QR Code Save Logic ===');
    console.log('1. Frontend generates QR code ID using generateId()');
    console.log('2. Frontend sends POST to /api/assets/qrcodes with:');
    console.log('   - data: destination URL');
    console.log('   - imageData: QR code image');
    console.log('   - name: QR code name');
    console.log('   - qrCodeId: (optional) ID from frontend');
    
    console.log('\n3. Backend (assets.js line 155-206):');
    console.log('   - Uses qrCodeId from request body if provided');
    console.log('   - Otherwise generates new ID with generateId()');
    console.log('   - Creates trackingUrl using req.protocol and req.get("host")');
    console.log('   - Saves to user.qrCodes array');
    
    console.log('\n=== Potential Issues ===');
    console.log('1. Frontend might not be sending qrCodeId parameter');
    console.log('2. Backend might be generating different ID than frontend');
    console.log('3. User might not be authenticated when saving');
    console.log('4. Database save might be failing');
    
    // Check the most recent QR code
    const users = await User.find({ 'qrCodes.0': { $exists: true } }).sort({ 'qrCodes.createdAt': -1 });
    
    if (users.length > 0) {
      const latestUser = users[0];
      const latestQr = latestUser.qrCodes[latestUser.qrCodes.length - 1];
      
      console.log('\n=== Latest QR Code in Database ===');
      console.log(`User: ${latestUser.email}`);
      console.log(`QR Code ID: ${latestQr.id}`);
      console.log(`Name: ${latestQr.name}`);
      console.log(`Destination: ${latestQr.data}`);
      console.log(`Created: ${latestQr.createdAt}`);
      console.log(`Scans: ${latestQr.scans}`);
      
      // Check if this QR code would be accessible
      const trackingUrl = `http://192.168.1.104:3000/track/${latestQr.id}`;
      console.log(`\nTracking URL: ${trackingUrl}`);
      console.log('Test this URL in browser to see if it works');
    }
    
    console.log('\n=== Testing Steps ===');
    console.log('1. Create QR code in frontend');
    console.log('2. Click "Save to My QR codes"');
    console.log('3. Check browser console for network requests');
    console.log('4. Check backend logs for save operation');
    console.log('5. Verify QR code appears in database (run list_all_qrcodes.js)');
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugQrSave();