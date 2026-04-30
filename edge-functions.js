// edge-functions.js
export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Handle tracking redirects
  if (pathname.startsWith('/track/')) {
    const qrCodeId = pathname.split('/')[2];
    // For now, just return a simple response to prove the function is running
    return new Response(`Tracking function is working! ID: ${qrCodeId}`, { status: 200 });
  }

  // For all other paths, let EdgeOne serve the static frontend
  return context.next();
}
