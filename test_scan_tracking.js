// Test script for QR code scan tracking
const fetch = require('node-fetch');

async function testScanTracking() {
  console.log('=== Testing QR Code Scan Tracking ===\n');
  
  // First, let's create a test QR code
  console.log('1. Creating a test QR code...');
  const createResponse = await fetch('http://localhost:3000/api/assets/qrcodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // In real test, use actual JWT token
    },
    body: JSON.stringify({
      data: 'https://example.com/test',
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      name: 'Test QR Code for Scan Tracking'
    })
  });
  
  if (!createResponse.ok) {
    console.log('Failed to create test QR code. Make sure backend is running and you have a valid auth token.');
    console.log('Status:', createResponse.status);
    const errorText = await createResponse.text();
    console.log('Error:', errorText);
    return;
  }
  
  const createData = await createResponse.json();
  const qrCode = createData.qrCode;
  console.log(`Created QR code: ${qrCode.name} (ID: ${qrCode.id})`);
  console.log(`Scan URL: ${qrCode.scanUrl}\n`);
  
  // Test the scan tracking endpoint
  console.log('2. Testing scan tracking endpoint...');
  console.log('Simulating a scan by visiting the redirect URL...');
  
  // We'll simulate a scan by making a request to the redirect endpoint
  // with different user agents to test device detection
  const testScans = [
    {
      name: 'iPhone Safari',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    },
    {
      name: 'Android Chrome',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
    },
    {
      name: 'Windows Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    },
    {
      name: 'Mac Safari',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15'
    }
  ];
  
  for (const test of testScans) {
    console.log(`\n  Testing scan with ${test.name}...`);
    
    try {
      const scanResponse = await fetch(qrCode.scanUrl, {
        headers: {
          'User-Agent': test.userAgent
        },
        redirect: 'manual' // Don't follow redirects, just get the response
      });
      
      console.log(`  Status: ${scanResponse.status}`);
      console.log(`  Redirect location: ${scanResponse.headers.get('location') || 'None'}`);
      
      if (scanResponse.status === 302 || scanResponse.status === 301) {
        console.log(`  ✓ Scan recorded and redirect successful`);
      } else {
        console.log(`  ✗ Unexpected status: ${scanResponse.status}`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }
  
  // Wait a moment for scans to be processed
  console.log('\n3. Waiting for scans to be processed...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test statistics endpoint
  console.log('\n4. Testing statistics endpoint...');
  const statsResponse = await fetch(`http://localhost:3000/api/assets/qrcodes/${qrCode.id}/statistics`, {
    headers: {
      'Authorization': 'Bearer test-token' // In real test, use actual JWT token
    }
  });
  
  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    console.log(`Statistics for "${statsData.qrCode.name}":`);
    console.log(`  Total scans: ${statsData.qrCode.scans}`);
    
    if (statsData.statistics.message) {
      console.log(`  Note: ${statsData.statistics.message}`);
      console.log('  (Free tier users only see total scans)');
    } else {
      console.log(`  Detailed statistics available for Pro/Ultra users:`);
      console.log(`  - Device types:`, statsData.statistics.deviceTypes || {});
      console.log(`  - Locations:`, statsData.statistics.locations || {});
      console.log(`  - Hourly scans:`, statsData.statistics.hourlyScans || []);
    }
  } else {
    console.log(`Failed to get statistics: ${statsResponse.status}`);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('\nHow scan tracking works in production:');
  console.log('1. User scans QR code → Opens tracking URL (e.g., https://yourapp.com/track/abc123)');
  console.log('2. Server records: timestamp, device info, location from IP, user agent');
  console.log('3. Server instantly redirects to destination URL');
  console.log('4. User sees intended content (no noticeable delay)');
  console.log('5. Analytics data stored for Pro/Ultra plan users');
}

// Run the test
testScanTracking().catch(console.error);