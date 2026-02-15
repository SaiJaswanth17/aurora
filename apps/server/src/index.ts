import 'dotenv/config';
import { WebSocketServer } from './websocket/server';
import { PORT_RANGES } from '@aurora/shared';
import { findAvailablePort } from './utils/port';

async function main() {
  console.log('🚀 Starting Aurora WebSocket Server...');

  // Check if env vars are loaded
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is not set!');
    console.error('Make sure .env file exists in the project root');
    process.exit(1);
  }

  const preferredPort = parseInt(process.env.WS_PORT || '3001');
  const port = await findAvailablePort(PORT_RANGES.WEBSOCKET, preferredPort);

  const server = new WebSocketServer();
  server.start(port);

  console.log(`✅ WebSocket Server running on port ${port}`);
  console.log(`📡 WebSocket URL: ws://localhost:${port}`);
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
