// /functions/[[default]].js

// Handle saving QR codes - use METHOD-SPECIFIC handler
export async function onRequestPut(context) {
  const url = new URL(context.request.url);
  
  // Only handle PUT requests to /qrcodes
  if (url.pathname === '/qrcodes') {
    try {
      const body = await context.request.json();
      const { id, data } = body;
      
      if (!id || !data) {
        return new Response(JSON.stringify({ error: 'Missing id or data' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Store in KV instead of MongoDB
      await context.env.QR_KV.put(id, data);
      
      return new Response(JSON.stringify({ success: true, id: id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}

// Handle QR code redirects (GET requests)
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  
  if (pathname.startsWith('/track/')) {
    const qrCodeId = pathname.split('/')[2];
    
    try {
      // Read from KV
      const destination = await context.env.QR_KV.get(qrCodeId);
      
      if (!destination) {
        return new Response(JSON.stringify({ error: 'QR code not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return Response.redirect(destination, 302);
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  
  // For all other paths, serve your static frontend
  return context.next();
}

// Fallback for other methods
export async function onRequest(context) {
  return context.next();
}