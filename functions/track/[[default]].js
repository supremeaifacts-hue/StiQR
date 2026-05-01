// File path: /functions/track/[[default]].js
export function onRequest(context) {
  return new Response(`Tracking function is working for ID: ${context.params.default || 'unknown'}`);
}
