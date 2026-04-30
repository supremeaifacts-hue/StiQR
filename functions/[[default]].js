// /functions/[[default]].js
// Single EdgeOne function that handles everything:
// 1. /track/:id - looks up QR code destination from MongoDB and redirects
// 2. All other paths - serves the frontend static site
//
// IMPORTANT: This function connects DIRECTLY to MongoDB using MongoClient.
// It does NOT use fetch() to call the backend, which avoids infinite redirect loops.

import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  
  cachedDb = cachedClient.db();
  return cachedDb;
}

export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // ============================================================
  // 1. Handle tracking requests: /track/:id
  // ============================================================
  if (pathname.startsWith('/track/')) {
    const qrCodeId = pathname.split('/')[2];
    
    console.log(`🔍 Tracking request for QR code ID: ${qrCodeId}`);
    
    if (!qrCodeId) {
      return new Response('Missing QR Code ID', { status: 400 });
    }
    
    try {
      const db = await getDb();
      
      // QR codes are stored in the 'users' collection as a sub-array 'qrCodes'
      // Each user document has a qrCodes array with objects containing { id, data, ... }
      const usersCollection = db.collection('users');
      
      // Find the user that has a QR code with this ID
      const user = await usersCollection.findOne(
        { 'qrCodes.id': qrCodeId },
        { projection: { 'qrCodes.$': 1 } } // Only return the matching QR code
      );
      
      if (!user || !user.qrCodes || user.qrCodes.length === 0) {
        console.log(`❌ QR code not found: ${qrCodeId}`);
        return new Response('QR Code Not Found', { status: 404 });
      }
      
      const qrCode = user.qrCodes[0];
      const destination = qrCode.data;
      
      if (!destination) {
        console.log(`⚠️ QR code has no destination: ${qrCodeId}`);
        return new Response('QR Code Has No Destination', { status: 400 });
      }
      
      console.log(`✅ Found QR code ${qrCodeId} -> ${destination}`);
      
      // Increment scan count asynchronously (don't await - fire and forget)
      usersCollection.updateOne(
        { 'qrCodes.id': qrCodeId },
        { 
          $inc: { 'qrCodes.$.scans': 1, 'stats.totalScans': 1 },
          $set: { 'qrCodes.$.lastScanned': new Date() }
        }
      ).catch(err => {
        console.error('Failed to increment scan count:', err);
      });
      
      // Redirect to the destination URL
      return Response.redirect(destination, 302);
      
    } catch (error) {
      console.error('❌ Database error in tracking:', error);
      return new Response('Server Error', { status: 500 });
    }
  }

  // ============================================================
  // 2. For all other paths, return undefined so EdgeOne serves
  //    the static frontend assets (React app).
  // ============================================================
  return undefined;
}
