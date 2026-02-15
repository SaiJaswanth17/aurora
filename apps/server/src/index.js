import { WebSocketServer } from './websocket/server';
import { PORT_RANGES } from '@aurora/shared';
import { findAvailablePort } from './utils/port';
async function main() {
    console.log('🚀 Starting Aurora WebSocket Server...');
    const preferredPort = parseInt(process.env.WS_PORT || '3001');
    const port = await findAvailablePort(PORT_RANGES.WEBSOCKET, preferredPort);
    const server = new WebSocketServer({ port });
    await server.start();
    console.log(`✅ WebSocket Server running on port ${port}`);
    console.log(`📡 WebSocket URL: ws://localhost:${port}`);
}
main().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map