// Quick test to see actual player data structure
const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/jugadores?search=87870986');
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
