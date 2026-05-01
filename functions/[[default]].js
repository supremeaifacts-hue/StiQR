// /functions/[[default]].js

// Handle saving QR codes (PUT requests)
export async function onRequestPut(context) {
  const url = new URL(context.request.url);
  
  // Log the request for debugging
  console.log('PUT request received:', url.pathname);
  
  // Handle saving QR codes
  if (url.pathname === '/qrcodes') {
    try {
      const body = await context.request.json();
      const { id, data } = body;
      
      console.log('Saving QR code:', { id, data });
      
      if (!id || !data) {
        return new Response(JSON.stringify({ error: 'Missing id or data' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Store in KV
      await context.env.QR_KV.put(id, data);
      console.log('Saved to KV:', id);
      
      return new Response(JSON.stringify({ success: true, id: id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Save error:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}

// Handle QR code redirects (GET requests)
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  
  // Log the request
  console.log('GET request received:', pathname);
  
  // Handle tracking redirects
  if (pathname.startsWith('/track/')) {
    const qrCodeId = pathname.split('/')[2];
    console.log('Looking up QR code:', qrCodeId);
    
    try {
      // Read from KV
      const destination = await context.env.QR_KV.get(qrCodeId);
      console.log('Found destination:', destination);
      
      if (!destination) {
        return new Response(JSON.stringify({ error: 'QR code not found', id: qrCodeId }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Redirect to destination
      return Response.redirect(destination, 302);
    } catch (error) {
      console.error('Tracking error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  
  // For all other paths, serve your static frontend
  return context.next();
}

// Handle other methods (OPTIONS, etc.)
export async function onRequest(context) {
  return context.next();
}