// /functions/track/[[default]].js
export async function onRequest(context) {
  const qrCodeId = context.params.default;
  
  // For now, return a JSON response to prove the function is running
  // We will replace this with the MongoDB redirect logic next
  return new Response(JSON.stringify({ 
    message: 'Tracking function is working', 
    id: qrCodeId,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}