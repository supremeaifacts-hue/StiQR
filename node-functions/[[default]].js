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
      // Import required modules
      const dotenv = require('dotenv');
      const pathModule = require('path');
      const { connectDB } = require('../backend/config/database');
      const User = require('../backend/models/User');

      // Load environment variables
      dotenv.config({ path: pathModule.join(__dirname, '../backend/.env') });

      // Connect to database
      await connectDB();

      // Find user by QR code ID
      const user = await User.findOne({ 'qrCodes.id': id });
      if (!user) {
        console.log(`❌ QR code not found for ID: ${id}`);
        return new Response('QR code not found', { status: 404 });
      }

      // Find the specific QR code
      const qrCode = user.qrCodes.find(qr => qr.id === id);
      if (!qrCode) {
        console.log(`❌ QR code data not found for ID: ${id}`);
        return new Response('QR code data not found', { status: 404 });
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
        ipAddress: context.request.headers.get('cf-connecting-ip') || 
                   context.request.headers.get('x-forwarded-for') || 
                   context.request.headers.get('x-real-ip') || 'unknown',
        userAgent: context.request.headers.get('user-agent') || 'unknown',
        referer: context.request.headers.get('referer') || 'direct'
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

      // Check if destinationUrl is empty or invalid
      if (!destinationUrl || destinationUrl.trim() === '') {
        console.error(`❌ QR code data field is empty for ID: ${id}`);
        return new Response('Configuration error: QR code destination URL is empty', { status: 500 });
      }

      // Check if data field contains a tracking URL (this would cause a loop)
      if (destinationUrl && destinationUrl.includes('/track/')) {
        console.error(`❌ REDIRECT LOOP DETECTED! QR code data field contains tracking URL: ${destinationUrl}`);
        console.error(`   This will cause infinite redirects. The data field should contain the original destination (e.g., google.com)`);
        return new Response('Configuration error: QR code data field contains tracking URL instead of destination', { status: 500 });
      }

      // Ensure URL has protocol
      if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
        destinationUrl = 'https://' + destinationUrl;
      }

      console.log(`🔗 Redirecting to: ${destinationUrl}`);

      // Redirect to the destination
      return Response.redirect(destinationUrl, 302);

    } catch (error) {
      console.error('❌ Error in tracking endpoint:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  // Handle /api/* routes
  if (path.startsWith('/api/')) {
    try {
      console.log(`📡 API route called: ${path}`);
      
      // Check for specific API routes
      if (path === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'OK', 
          timestamp: new Date().toISOString(),
          message: 'EdgeOne Function handling API routes'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // For other API routes, return a placeholder
      return new Response(JSON.stringify({ 
        message: 'API endpoint',
        path: path,
        method: method
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('❌ Error handling API route:', error);
      return new Response('API server error', { status: 500 });
    }
  }

  // For all other routes, let EdgeOne Pages handle them (frontend)
  // This allows client-side routing for the React app
  console.log(`🌐 Passing to EdgeOne Pages: ${path}`);
  
  // Return the request unchanged - EdgeOne Pages will handle it
  return context.next();
}