// Debug script to check what's stored in QR code data field
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr';

async function debugQrCodeData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get User model
    const User = require('./backend/models/User');
    
    // Find all users with QR codes
    const users = await User.find({ 'qrCodes.0': { $exists: true } });
    
    console.log(`\n📊 Found ${users.length} users with QR codes`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email || user._id}`);
      console.log(`   QR Codes: ${user.qrCodes.length}`);
      
      for (const qrCode of user.qrCodes) {
        console.log(`\n   QR Code: ${qrCode.name || 'Unnamed'}`);
        console.log(`     ID: ${qrCode.id}`);
        console.log(`     Data field: "${qrCode.data}"`);
        console.log(`     Scans: ${qrCode.scans || 0}`);
        console.log(`     Created: ${qrCode.createdAt}`);
        
        // Check if data field contains tracking URL
        if (qrCode.data && qrCode.data.includes('/track/')) {
          console.log(`     ⚠️  WARNING: Data field contains tracking URL! This will cause redirect loop.`);
        }
        
        // Check if data field looks like a destination URL
        if (qrCode.data && (qrCode.data.includes('http://') || qrCode.data.includes('https://') || qrCode.data.includes('.'))) {
          console.log(`     ✓ Data field looks like a destination URL`);
        } else if (qrCode.data && qrCode.data.trim() !== '') {
          console.log(`     ℹ️  Data field: "${qrCode.data}" (might need https:// prefix)`);
        } else {
          console.log(`     ❌ Data field is empty or invalid`);
        }
      }
    }
    
    // Also check for QR codes with specific patterns
    console.log('\n🔎 Searching for QR codes with tracking URLs in data field...');
    const trackingUrlQRCodes = [];
    
    for (const user of users) {
      for (const qrCode of user.qrCodes) {
        if (qrCode.data && qrCode.data.includes('/track/')) {
          trackingUrlQRCodes.push({
            user: user.email || user._id,
            qrCode: qrCode
          });
        }
      }
    }
    
    if (trackingUrlQRCodes.length > 0) {
      console.log(`\n❌ Found ${trackingUrlQRCodes.length} QR codes with tracking URLs in data field (THIS IS BAD):`);
      for (const item of trackingUrlQRCodes) {
        console.log(`   User: ${item.user}`);
        console.log(`   QR Code: ${item.qrCode.name || 'Unnamed'} (ID: ${item.qrCode.id})`);
        console.log(`   Data: "${item.qrCode.data}"`);
      }
    } else {
      console.log('✅ No QR codes found with tracking URLs in data field');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugQrCodeData();