import net from 'net';
export function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            }
            else {
                resolve(false);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
}
export async function findAvailablePort(ports, preferredPort) {
    // Try preferred port first
    if (await isPortAvailable(preferredPort)) {
        return preferredPort;
    }
    // Try other ports
    for (const port of ports) {
        if (port !== preferredPort && await isPortAvailable(port)) {
            console.warn(`⚠️  Preferred port ${preferredPort} in use, using port ${port}`);
            return port;
        }
    }
    throw new Error('No available ports found');
}
//# sourceMappingURL=port.js.map