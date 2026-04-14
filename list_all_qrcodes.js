// Script to list all QR codes in the database
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function listAllQrCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr');
    console.log('Connected to MongoDB');
    
    // Get User model
    const User = require('./backend/models/User');
    
    // Find all users with QR codes
    const users = await User.find({ 'qrCodes.0': { $exists: true } });
    
    if (users.length === 0) {
      console.log('❌ No users with QR codes found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} users with QR codes:`);
    
    let totalQrCodes = 0;
    
    users.forEach((user, userIndex) => {
      console.log(`\nUser ${userIndex + 1}: ${user.email} (${user.qrCodes.length} QR codes)`);
      
      user.qrCodes.forEach((qr, qrIndex) => {
        totalQrCodes++;
        console.log(`  ${qrIndex + 1}. ID: ${qr.id}`);
        console.log(`     Name: ${qr.name || 'Unnamed'}`);
        console.log(`     Destination: ${qr.data?.substring(0, 50) || 'No URL'}...`);
        console.log(`     Scans: ${qr.scans || 0}`);
        console.log(`     Created: ${qr.createdAt}`);
      });
    });
    
    console.log(`\n📊 Total QR codes in database: ${totalQrCodes}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listAllQrCodes();