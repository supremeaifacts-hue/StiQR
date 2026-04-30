// functions/[[default]].js
import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  // Use the database name from the connection string, or fallback to 'stiqr'
  const dbName = new URL(uri).pathname.substring(1).split('?')[0] || 'stiqr';
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Only handle /track/* requests
  if (!pathname.startsWith('/track/')) {
    // Let EdgeOne serve the static frontend for all other paths
    return context.next();
  }

  const qrCodeId = pathname.split('/')[2];
  if (!qrCodeId) {
    return new Response('Missing QR Code ID', { status: 400 });
  }

  try {
    console.log(`🔍 Looking up QR Code ID: ${qrCodeId}`);
    const db = await getDb();
    const collection = db.collection('qrcodes');
    const qrCode = await collection.findOne({ id: qrCodeId });

    if (!qrCode) {
      console.log(`❌ QR Code not found: ${qrCodeId}`);
      return new Response(JSON.stringify({ error: 'QR Code not found', id: qrCodeId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const destination = qrCode.data;
    if (!destination) {
      console.log(`⚠️ QR Code has no destination: ${qrCodeId}`);
      return new Response(JSON.stringify({ error: 'QR Code has no destination', id: qrCodeId }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Increment scan count in the background
    collection.updateOne({ id: qrCodeId }, { $inc: { scan_count: 1 } }).catch(err => {
      console.error('Failed to increment scan count:', err);
    });

    console.log(`✅ Redirecting ${qrCodeId} to: ${destination}`);
    return Response.redirect(destination, 302);
  } catch (error) {
    console.error('❌ Error in tracking function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
