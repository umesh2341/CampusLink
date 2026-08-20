const BASE_URL = 'https://campuslinks.onrender.com/api';

const endpointsToTest = [
  { name: 'Health Check', url: `${BASE_URL}/health` },
  { name: 'Buildings List', url: `${BASE_URL}/buildings` },
  { name: 'Search', url: `${BASE_URL}/search?q=test` },
  { name: 'Clubs List', url: `${BASE_URL}/clubs` },
  { name: 'VAPID Public Key', url: `${BASE_URL}/push/vapid-public-key` },
  { name: 'Upload Signature', url: `${BASE_URL}/uploads/signature` }
];

async function testEndpoints() {
  console.log('Testing production API endpoints...\n');
  
  for (const endpoint of endpointsToTest) {
    try {
      const response = await fetch(endpoint.url);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      let dataSnippet = '';
      
      if (isJson) {
        const data = await response.json();
        // Just get a small snippet to prove it returned data
        dataSnippet = JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '');
      } else {
        const text = await response.text();
        dataSnippet = text.substring(0, 100) + (text.length > 100 ? '...' : '');
      }
      
      if (response.ok) {
        console.log(`✅ [PASS] ${endpoint.name} (${endpoint.url})`);
        console.log(`   Status: ${response.status} OK`);
        console.log(`   Response Preview: ${dataSnippet}\n`);
      } else {
        console.log(`❌ [FAIL] ${endpoint.name} (${endpoint.url})`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Error Preview: ${dataSnippet}\n`);
      }
    } catch (error) {
      console.log(`💥 [ERROR] ${endpoint.name} (${endpoint.url})`);
      console.log(`   Failed to fetch: ${error.message}\n`);
    }
  }
}

testEndpoints();
