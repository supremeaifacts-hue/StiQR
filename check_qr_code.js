// Script to check if a QR code exists in the database
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const qrCodeId = 'mnyu6c3nh29r0t703tq';

async function checkQrCode() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr');
    console.log('Connected to MongoDB');
    
    // Get User model
    const User = require('./backend/models/User');
    
    // Find user with this QR code ID
    const user = await User.findOne({ 'qrCodes.id': qrCodeId });
    
    if (!user) {
      console.log(`❌ No user found with QR code ID: ${qrCodeId}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    
    // Find the specific QR code
    const qrCode = user.qrCodes.find(qr => qr.id === qrCodeId);
    
    if (!qrCode) {
      console.log(`❌ QR code not found in user's QR codes`);
      console.log(`User has ${user.qrCodes.length} QR codes:`);
      user.qrCodes.forEach((qr, index) => {
        console.log(`  ${index + 1}. ID: ${qr.id}, Name: ${qr.name || 'Unnamed'}, Scans: ${qr.scans || 0}`);
      });
    } else {
      console.log(`✅ Found QR code:`);
      console.log(`  ID: ${qrCode.id}`);
      console.log(`  Name: ${qrCode.name || 'Unnamed'}`);
      console.log(`  Destination URL: ${qrCode.data}`);
      console.log(`  Scans: ${qrCode.scans || 0}`);
      console.log(`  Created: ${qrCode.createdAt}`);
      console.log(`  Last scanned: ${qrCode.lastScanned}`);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkQrCode();