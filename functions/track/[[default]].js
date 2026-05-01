// /functions/track/[[default]].js
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function getDb() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient.db('stiqr');
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  const method = context.request.method;

  // Handle saving a new QR code (called from your editor)
  if (pathname === '/api/qrcodes' && method === 'POST') {
    try {
      const body = await context.request.json();
      const { id, data } = body;
      
      if (!id || !data) {
        return new Response(JSON.stringify({ error: 'Missing id or data' }), { status: 400 });
      }
      
      const db = await getDb();
      const collection = db.collection('qrcodes');
      
      await collection.updateOne(
        { id: id },
        { $set: { id: id, data: data, createdAt: new Date() }, $inc: { scan_count: 0 } },
        { upsert: true }
      );
      
      return new Response(JSON.stringify({ success: true, id: id }), { status: 200 });
    } catch (error) {
      console.error('Error saving QR code:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // Handle redirecting a scanned QR code
  if (pathname.startsWith('/track/')) {
    const qrCodeId = context.params.default;
    
    try {
      const db = await getDb();
      const collection = db.collection('qrcodes');
      const qrCode = await collection.findOne({ id: qrCodeId });
      
      if (!qrCode || !qrCode.data) {
        return new Response(JSON.stringify({ error: 'QR code not found', id: qrCodeId }), { status: 404 });
      }
      
      // Increment scan count in background
      collection.updateOne({ id: qrCodeId }, { $inc: { scan_count: 1 } }).catch(console.error);
      
      return Response.redirect(qrCode.data, 302);
    } catch (error) {
      console.error('Error in tracking:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // For any other path, return 404
  return new Response('Not Found', { status: 404 });
}