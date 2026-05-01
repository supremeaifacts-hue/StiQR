// /functions/track/[[default]].js
import { MongoClient } from 'mongodb';

let cachedClient = null;

async function getCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  const db = cachedClient.db('stiqr');
  return db.collection('qrcodes');
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  const method = context.request.method;

  // 1. HANDLE SAVING QR CODE (POST /api/qrcodes)
  if (pathname === '/api/qrcodes' && method === 'POST') {
    try {
      const body = await context.request.json();
      const { id, data } = body;
      console.log(`Saving QR code: ${id} -> ${data}`);
      
      const collection = await getCollection();
      await collection.updateOne(
        { id: id },
        { $set: { id: id, data: data, createdAt: new Date() }, $inc: { scan_count: 0 } },
        { upsert: true }
      );
      
      return new Response(JSON.stringify({ success: true, id: id }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Save error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // 2. HANDLE REDIRECT (GET /track/abc123)
  if (pathname.startsWith('/track/') && method === 'GET') {
    const qrCodeId = pathname.split('/')[2];
    console.log(`Tracking ID: ${qrCodeId}`);
    
    try {
      const collection = await getCollection();
      const qrCode = await collection.findOne({ id: qrCodeId });
      
      if (!qrCode || !qrCode.data) {
        console.log(`ID not found: ${qrCodeId}`);
        return new Response(JSON.stringify({ error: 'QR code not found', id: qrCodeId }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Increment scan count in background
      collection.updateOne({ id: qrCodeId }, { $inc: { scan_count: 1 } }).catch(console.error);
      
      console.log(`Redirecting ${qrCodeId} to ${qrCode.data}`);
      return Response.redirect(qrCode.data, 302);
    } catch (error) {
      console.error('Tracking error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // 3. ANYTHING ELSE
  return new Response('Not Found', { status: 404 });
}