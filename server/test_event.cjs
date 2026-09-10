const http = require('http');

const data = JSON.stringify({
  title: 'TEST_EVENT_DEBUG',
  description: 'Test',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 86400000).toISOString(),
  building_id: 'c-block',
  organizing_club: 'Test Club',
  tags: ['general']
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/events',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-user-id': 'b1b3eac5-9d25-4ede-9919-1d1da527d597' // We need a UUID to mock a valid session
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response status:', res.statusCode, '\nBody:', body));
});
req.on('error', console.error);
req.write(data);
req.end();
