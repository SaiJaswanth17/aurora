
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import * as fc from 'fast-check';
import { ConnectionManager, WebSocketConnection } from '../../src/services/connection-manager';
import { WebSocketData } from '../../src/types';

describe('ConnectionManager Property Tests', () => {

    // Helper to create mock socket
    const createMockSocket = (id: string): WebSocketConnection => ({
        data: {
            connectionId: id,
            channels: new Set(),
            conversations: new Set(),
            isAuthenticated: true,
            lastPing: 0,
            userId: undefined,
            user: undefined
        } as WebSocketData,
        send: mock(),
        close: mock()
    });

    // Feature: websocket-enhancements, Property 8: Subscription index consistency
    test('should maintain consistent bidirectional indexes', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.uuid()), // userIds
                fc.array(fc.uuid()), // channelIds
                fc.array(fc.record({
                    op: fc.constantFrom('join', 'leave'),
                    userIdIdx: fc.integer({ min: 0 }),
                    channelIdIdx: fc.integer({ min: 0 })
                }), { minLength: 10 }), // operations
                async (userIds, channelIds, ops) => {
                    const manager = new ConnectionManager();
                    if (userIds.length === 0 || channelIds.length === 0) return;

                    // Execute operations
                    for (const op of ops) {
                        const userId = userIds[op.userIdIdx % userIds.length];
                        const channelId = channelIds[op.channelIdIdx % channelIds.length];

                        if (op.op === 'join') {
                            manager.joinChannel(userId, channelId);
                        } else {
                            manager.leaveChannel(userId, channelId);
                        }
                    }

                    // Verify consistency check logic remains same...
                    // Register connections to check
                    const connections = new Map<string, string>(); // userId -> connId
                    for (const userId of userIds) {
                        const connId = `conn-${userId}`;
                        const sock = createMockSocket(connId);
                        manager.registerConnection(sock);
                        manager.setAuthenticatedUser(connId, userId);
                        connections.set(userId, connId);
                    }

                    const expectedState = new Map<string, Set<string>>(); // userId -> channels

                    for (const op of ops) {
                        const userId = userIds[op.userIdIdx % userIds.length];
                        const channelId = channelIds[op.channelIdIdx % channelIds.length];

                        let channels = expectedState.get(userId);
                        if (!channels) {
                            channels = new Set();
                            expectedState.set(userId, channels);
                        }

                        if (op.op === 'join') {
                            channels.add(channelId);
                        } else {
                            channels.delete(channelId);
                        }
                    }

                    for (const channelId of channelIds) {
                        const expectedUsers = userIds.filter(uid => expectedState.get(uid)?.has(channelId));

                        const activeConns = manager.getConnectionsInScope({ channelId });
                        const actualUsers = activeConns.map(cid => {
                            return cid.replace('conn-', '');
                        });

                        expect(actualUsers.sort()).toEqual(expectedUsers.sort());
                    }
                }
            )
        );
    });

    // Feature: websocket-enhancements, Property 14 & 15: Join enables receipt & Leave/Disconnect prevents receipt
    test('should manage subscriptions correctly on join/leave/disconnect', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(), // userId
                fc.uuid(), // channelId
                fc.array(fc.constantFrom('join', 'leave', 'disconnect', 'reconnect')),
                async (userId, channelId, ops) => {
                    const manager = new ConnectionManager();
                    let connId = `conn-${userId}`;
                    let sock = createMockSocket(connId);

                    // Start connected
                    manager.registerConnection(sock);
                    manager.setAuthenticatedUser(connId, userId);
                    let isConnected = true;
                    let isJoined = false;

                    for (const op of ops) {
                        if (op === 'join') {
                            manager.joinChannel(userId, channelId);
                            isJoined = true;
                        } else if (op === 'leave') {
                            manager.leaveChannel(userId, channelId);
                            isJoined = false;
                        } else if (op === 'disconnect') {
                            if (isConnected) {
                                manager.removeConnection(connId);
                                isConnected = false;
                                // Disconnect cleans up subscriptions immediately in manager implementation
                                // So strictly speaking, manager state for this user is CLEARED.
                                // If they rejoin later (offline), manager state will have it.
                                // If they reconnect later, manager state (userChannels) is EMPTY unless rejoined.

                                // Wait: removeConnection calls cleanupUserSubscriptions.
                                // cleanupUserSubscriptions removes userChannels entry.
                                // So manager forgets subscription.
                                // So isJoined should be false.
                                isJoined = false;
                            }
                        } else if (op === 'reconnect') {
                            if (!isConnected) {
                                connId = `conn-${userId}-new`;
                                sock = createMockSocket(connId);
                                manager.registerConnection(sock);
                                manager.setAuthenticatedUser(connId, userId);
                                isConnected = true;

                                // Reconnect doesn't reset persistent logical state.
                                // But since disconnect CLEARED manager state, isJoined was set to false.
                                // So upon reconnect, isJoined is false.
                                // If 'join' happened while disconnected, isJoined became true.
                                // And manager updated userChannels (because joinChannel doesn't check connection).
                                // So manager has subscription.
                                // So we expect true.
                                // So we should NOT set isJoined = false here.
                            }
                        }

                        // Consistency check
                        const conns = manager.getConnectionsInScope({ channelId });
                        const hasReceipt = conns.includes(connId);

                        if (isConnected && isJoined) {
                            expect(hasReceipt).toBe(true);
                        } else {
                            expect(hasReceipt).toBe(false);
                        }
                    }
                }
            )
        );
    });
});
