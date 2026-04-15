// Debug script to test QR code scan tracking
console.log('=== QR Code Scan Tracking Debug Test ===\n');

console.log('1. Checking backend endpoints:');
console.log('   Backend URL: http://localhost:3000');
console.log('   Tracking endpoint: /track/:id');
console.log('   Redirect endpoint: /api/assets/qrcodes/:id/redirect\n');

console.log('2. Steps to debug:');
console.log('   a. Create a QR code in the editor');
console.log('   b. Save it to dashboard');
console.log('   c. Check console logs for QR code ID');
console.log('   d. Manually test the tracking URL\n');

console.log('3. Manual test commands (replace [qrCodeId] with actual ID):');
console.log('   # Test tracking URL directly:');
console.log('   curl -v http://localhost:3000/track/[qrCodeId]');
console.log('');
console.log('   # Test redirect endpoint directly:');
console.log('   curl -v http://localhost:3000/api/assets/qrcodes/[qrCodeId]/redirect');
console.log('');
console.log('   # Check QR code data:');
console.log('   curl http://localhost:3000/api/assets/qrcodes/[qrCodeId]');
console.log('');
console.log('   # Increment scan count directly:');
console.log('   curl -X POST http://localhost:3000/api/assets/qrcodes/[qrCodeId]/scan');
console.log('');

console.log('4. Common issues to check:');
console.log('   - Is the QR code actually encoding the tracking URL?');
console.log('   - Is the backend running on localhost:3000?');
console.log('   - Is MongoDB running?');
console.log('   - Are there any CORS issues?');
console.log('   - Check browser console for errors');
console.log('');

console.log('5. How to verify QR code content:');
console.log('   - Scan the QR code with a QR scanner app');
console.log('   - Check what URL it actually encodes');
console.log('   - It should be: http://localhost:3000/track/[qrCodeId]');
console.log('   - NOT: www.expedia.com (or whatever destination URL)');
console.log('');

console.log('6. Debug logging:');
console.log('   - Check browser console when saving QR code');
console.log('   - Look for "QR code saved successfully:" log');
console.log('   - It should show the tracking URL');
console.log('   - Also check backend logs for scan recording');
console.log('');

console.log('7. Quick test:');
console.log('   # Create a test QR code with curl:');
console.log('   curl -X POST http://localhost:3000/api/assets/qrcodes \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "Authorization: Bearer [your-token]" \\');
console.log('     -d \'{"data":"https://example.com","imageData":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","name":"Test QR","qrCodeId":"test123"}\'');
console.log('');
console.log('   # Then test scanning it:');
console.log('   curl http://localhost:3000/track/test123');
console.log('');
console.log('   # Check if scan count increased:');
console.log('   curl http://localhost:3000/api/assets/qrcodes/test123 \\');
console.log('     -H "Authorization: Bearer [your-token]"');
console.log('');

console.log('8. If scan count still doesn\'t increase:');
console.log('   - Check MongoDB directly:');
console.log('     mongo stiqr');
console.log('     db.users.find({"qrCodes.id": "[qrCodeId]"})');
console.log('   - Look at the "scans" field');
console.log('   - Check if "lastScanned" timestamp updates');
console.log('');

console.log('✅ Run these tests to identify where the issue is.');