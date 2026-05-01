// /functions/track/[[default]].js
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function getDestination(qrCodeId) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  
  const db = cachedClient.db('stiqr');
  const collection = db.collection('qrcodes');
  const qrCode = await collection.findOne({ id: qrCodeId });
  
  if (!qrCode || !qrCode.data) {
    throw new Error('QR code not found or has no destination');
  }
  
  // Increment scan count in the background (don't await)
  collection.updateOne({ id: qrCodeId }, { $inc: { scan_count: 1 } }).catch(err => {
    console.error('Failed to increment scan count:', err);
  });
  
  return qrCode.data;
}

export async function onRequest(context) {
  // Extract the QR code ID from the URL path
  const qrCodeId = context.params.default || 'unknown';
  
  try {
    const destination = await getDestination(qrCodeId);
    return Response.redirect(destination, 302);
  } catch (error) {
    console.error('Error in tracking function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      id: qrCodeId
    }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
