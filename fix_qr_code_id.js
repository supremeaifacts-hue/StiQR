// Script to fix the QR code ID mismatch
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function fixQrCodeId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr');
    console.log('Connected to MongoDB');
    
    // Get User model
    const User = require('./backend/models/User');
    
    // Find the user with the QR code
    const users = await User.find({ 'qrCodes.id': 'mnz0ulatarvz8gd1zw' });
    
    if (users.length === 0) {
      console.log('❌ No user found with QR code ID mnz0ulatarvz8gd1zw');
      return;
    }
    
    console.log(`✅ Found ${users.length} user(s) with the QR code`);
    
    for (const user of users) {
      console.log(`\nUser: ${user.email}`);
      
      // Find the QR code with the old ID
      const qrIndex = user.qrCodes.findIndex(qr => qr.id === 'mnz0ulatarvz8gd1zw');
      
      if (qrIndex === -1) {
        console.log('❌ QR code not found in user\'s QR codes');
        continue;
      }
      
      const oldQrCode = user.qrCodes[qrIndex];
      console.log(`Old QR code details:`);
      console.log(`  ID: ${oldQrCode.id}`);
      console.log(`  Name: ${oldQrCode.name}`);
      console.log(`  Destination: ${oldQrCode.data}`);
      console.log(`  Scans: ${oldQrCode.scans}`);
      console.log(`  Created: ${oldQrCode.createdAt}`);
      
      // Update the QR code ID
      user.qrCodes[qrIndex].id = 'mnz26kxbsdtxjate48p';
      
      // Save the user
      await user.save();
      
      console.log(`\n✅ Updated QR code ID from 'mnz0ulatarvz8gd1zw' to 'mnz26kxbsdtxjate48p'`);
      console.log(`The QR code should now work when scanned.`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixQrCodeId();