// /functions/api/[[default]].js
import { MongoClient } from 'mongodb';

// Cache the MongoDB client across function invocations
let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Use a global variable to preserve the client across warm starts
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 1,
      minPoolSize: 1,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}

export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Handle the test endpoint for troubleshooting
  if (pathParts[0] === 'test-env') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          BACKEND_URL: 'hardcoded',
          configured: true,
          process_available: true,
          has_mongo_uri: !!process.env.MONGODB_URI,
        },
        note: 'Direct database mode',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle the tracking redirect
  if (pathParts[0] === 'track' && pathParts[1]) {
    const qrCodeId = pathParts[1];
    console.log(`🔍 Looking up QR code ID: ${qrCodeId}`);

    try {
      const db = await getDb();
      const collection = db.collection('qrcodes'); // Adjust collection name to match your database

      const qrCode = await collection.findOne({ id: qrCodeId });

      if (!qrCode) {
        console.log(`❌ QR code not found: ${qrCodeId}`);
        return new Response('QR Code Not Found', { status: 404 });
      }

      const destination = qrCode.data;
      if (!destination) {
        console.log(`⚠️ QR code has no destination: ${qrCodeId}`);
        return new Response('QR Code Has No Destination', { status: 400 });
      }

      // Increment scan count asynchronously (don't await)
      collection.updateOne({ id: qrCodeId }, { $inc: { scan_count: 1 } }).catch(err => {
        console.error('Failed to increment scan count:', err);
      });

      console.log(`✅ Redirecting ${qrCodeId} to: ${destination}`);
      return Response.redirect(destination, 302);
    } catch (error) {
      console.error('❌ Error in tracking function:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // For all other paths, you could optionally serve your main app or return 404
  return new Response('Not Found', { status: 404 });
}