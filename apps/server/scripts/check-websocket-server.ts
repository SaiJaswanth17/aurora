async function checkWebSocketServer() {
  console.log('🔍 Checking WebSocket Server...\n');

  // Check if server is running
  console.log('Test 1: Check if server is running');
  try {
    const response = await fetch('http://localhost:3001', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('✅ Server is running');
      console.log(`   Response: ${text}`);
    } else {
      console.log(`⚠️  Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Server is NOT running');
    console.log('   Start it with: cd apps/server && bun run dev');
    console.log('');
    process.exit(1);
  }

  // Check WebSocket endpoint
  console.log('\nTest 2: Check WebSocket endpoint');
  try {
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful');
        ws.close();
        resolve(true);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  } catch (error) {
    console.log('❌ WebSocket connection failed');
    console.log('   Error:', error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ WebSocket server is working correctly!');
  console.log('='.repeat(60));
  console.log('\nYou can now test messaging:');
  console.log('1. Open Browser 1 (Chrome): Log in as User A');
  console.log('2. Open Browser 2 (Firefox): Log in as User B');
  console.log('3. Both users click on each other in DM list');
  console.log('4. Send messages - they will appear in real-time!');
  console.log('');
}

checkWebSocketServer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
