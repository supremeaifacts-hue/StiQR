// /functions/[[default]].js
// This catches all requests to the domain

export async function onRequest(context) {
  // 1. Get the original request URL and body
  const url = new URL(context.request.url);
  const path = url.pathname;
  const method = context.request.method;

  console.log(`🔍 EdgeOne Function called: ${method} ${path}`);

  // Handle /track/:id routes
  if (path.startsWith('/track/')) {
    const id = path.split('/')[2];
    
    if (!id) {
      return new Response('Missing QR code ID', { status: 400 });
    }

    console.log(`📱 Tracking QR code scan for ID: ${id}`);

    try {
      // Try to connect to database and get the actual destination
      try {
        // Import required modules
        const mongoose = require('mongoose');
        
        // Get MongoDB URI from environment variable
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stiqr';
        
        console.log(`🔌 Attempting database connection to: ${MONGODB_URI.substring(0, 30)}...`);
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, // 5 second timeout
          socketTimeoutMS: 45000,
        });
        
        console.log(`✅ Database connected`);
        
        // Define User schema inline (simplified)
        const userSchema = new mongoose.Schema({
          qrCodes: [{
            id: String,
            data: String,
            scans: Number,
            lastScanned: Date,
            scanHistory: Array
          }]
        });
        
        const User = mongoose.models.User || mongoose.model('User', userSchema);
        
        // Find user by QR code ID
        const user = await User.findOne({ 'qrCodes.id': id });
        if (!user) {
          console.log(`❌ QR code not found for ID: ${id}`);
          // Don't return error, just redirect to a default
          return Response.redirect('https://www.example.com', 302);
        }
        
        // Find the specific QR code
        const qrCode = user.qrCodes.find(qr => qr.id === id);
        if (!qrCode) {
          console.log(`❌ QR code data not found for ID: ${id}`);
          return Response.redirect('https://www.example.com', 302);
        }
        
        console.log(`📊 Found QR code:`, {
          id: qrCode.id,
          data: qrCode.data,
          scans: qrCode.scans || 0
        });
        
        // Increment scan count
        qrCode.scans = (qrCode.scans || 0) + 1;
        qrCode.lastScanned = new Date();
        
        // Save the user
        await user.save();
        
        console.log(`✅ Scan recorded. New scan count: ${qrCode.scans}`);
        
        // Get the destination URL
        let destinationUrl = qrCode.data;
        
        // Check if destinationUrl is empty or invalid
        if (!destinationUrl || destinationUrl.trim() === '') {
          console.error(`❌ QR code data field is empty for ID: ${id}`);
          return Response.redirect('https://www.example.com', 302);
        }
        
        // Check if data field contains a tracking URL (this would cause a loop)
        if (destinationUrl && destinationUrl.includes('/track/')) {
          console.error(`❌ REDIRECT LOOP DETECTED! QR code data field contains tracking URL: ${destinationUrl}`);
          return Response.redirect('https://www.example.com', 302);
        }
        
        // Ensure URL has protocol
        if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
          destinationUrl = 'https://' + destinationUrl;
        }
        
        console.log(`🔗 Redirecting to: ${destinationUrl}`);
        
        // Close database connection
        await mongoose.connection.close();
        
        // Redirect to the destination
        return Response.redirect(destinationUrl, 302);
        
      } catch (dbError) {
        console.error('❌ Database error:', dbError.message);
        console.log('⚠️ Falling back to default redirect');
        
        // Fallback: redirect to a default URL
        return Response.redirect('https://www.example.com', 302);
      }

    } catch (error) {
      console.error('❌ General error in tracking endpoint:', error
