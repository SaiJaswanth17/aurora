
import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import * as fc from 'fast-check';
import { PresenceManager } from '../../src/services/presence-manager';
import { IConnectionManager, WebSocketConnection } from '../../src/services/connection-manager';
import { SupabaseClient } from '@supabase/supabase-js';

// Mocks
const mockGetConnection = mock();
const mockConnManager = {
    getConnection: mockGetConnection
} as unknown as IConnectionManager;

const mockUpdate = mock();
const mockEq = mock();
const mockSupabase = {
    from: mock(() => ({
        update: mockUpdate,
    }))
} as unknown as SupabaseClient;

// Chain mock for Supabase
mockUpdate.mockReturnValue({ eq: mockEq });
mockEq.mockResolvedValue({ data: null, error: null });

describe('PresenceManager Property Tests', () => {

    // Feature: websocket-enhancements, Property 20: Heartbeat Timeout
    test('should strictly enforce heartbeat timeouts', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1000, max: 10000 }), // timeoutMs
                fc.uniqueArray(fc.record({
                    connId: fc.uuid(),
                    lastActiveOffset: fc.integer({ min: -20000, max: 20000 }) // relative to timeout
                }), { selector: x => x.connId }),
                async (timeoutMs, connections) => {
                    // Setup
                    let currentTime = 100000;
                    const getTime = () => currentTime;

                    const manager = new PresenceManager(
                        mockConnManager,
                        mockSupabase,
                        timeoutMs,
                        getTime
                    );

                    const connsMap = new Map<string, any>();

                    // Register connections and heartbeats
                    for (const c of connections) {
                        const closeSpy = mock();
                        connsMap.set(c.connId, { close: closeSpy });

                        // Set heartbeat time
                        // We set currentTime to match lastActiveOffset
                        // Target timestamp = currentTime - (timeoutMs + offset) ?
                        // No, let's fix currentTime = 100000.
                        // We want last heartbeat to be at currentTime - timeoutMs +/- offset.

                        // If offset > 0 (timeout exceeded), last heartbeat was OLDER.
                        // So last = currentTime - (timeoutMs + offset).

                        // If offset < 0 (active), last heartbeat was NEWER.
                        // So last = currentTime - (timeoutMs + offset). (offset is negative -> subtract less -> check < timeout)

                        // Actually let's use straightforward logic:
                        // heartbeatTime = currentTime - timeoutMs - c.lastActiveOffset

                        const heartbeatTime = currentTime - timeoutMs - c.lastActiveOffset;

                        // Check logic:
                        // Age = currentTime - heartbeatTime = timeoutMs + c.lastActiveOffset
                        // If offset > 0 -> Age > timeoutMs -> Timeout.
                        // If offset <= 0 -> Age <= timeoutMs -> Active.

                        // But we can't set lastHeartbeat directly (private).
                        // use updateHeartbeat(connId) but mock time temporarily.

                        const originalGetTime = getTime;
                        // Temp override time for setup
                        // Wait, getTime is passed in constructor as reference.
                        // We need `currentTime` variable to be mutable and relied upon.
                        // So we change `currentTime` to `heartbeatTime`, call update, then set back.

                        currentTime = heartbeatTime;
                        manager.updateHeartbeat(c.connId);
                        currentTime = 100000; // Restore
                    }

                    // Mock ConnectionManager behavior
                    mockGetConnection.mockImplementation((id: string) => connsMap.get(id));

                    // Check
                    await manager.checkHeartbeats();

                    // Verify
                    for (const c of connections) {
                        const mockConn = connsMap.get(c.connId);
                        const shouldTimeout = c.lastActiveOffset > 0;

                        if (shouldTimeout) {
                            expect(mockConn.close).toHaveBeenCalled();
                        } else {
                            expect(mockConn.close).not.toHaveBeenCalled();
                        }
                    }

                    mockGetConnection.mockReset();
                }
            )
        );
    });
});
