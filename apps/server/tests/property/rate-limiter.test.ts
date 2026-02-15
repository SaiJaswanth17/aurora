
import { describe, test, expect } from 'bun:test';
import * as fc from 'fast-check';
import { RateLimiter, RateLimitConfig } from '../../src/services/rate-limiter';

describe('RateLimiter Property Tests', () => {

    // Feature: websocket-enhancements, Property 17: Sliding window enforcement
    test('should strictly enforce sliding window limits', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 20 }), // maxMessages
                fc.integer({ min: 1, max: 20 }), // windowSeconds
                fc.array(fc.integer({ min: 0, max: 100000 })), // Message timestamps (relative ms)
                async (maxMessages, windowSeconds, timestamps) => {
                    const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
                    let currentTime = 0;
                    const getTime = () => currentTime;

                    const config: RateLimitConfig = { maxMessages, windowSeconds };
                    const limiter = new RateLimiter(config, getTime);

                    const userId = 'user1';
                    const acceptedTimestamps: number[] = [];

                    for (const ts of sortedTimestamps) {
                        currentTime = ts;
                        const windowStart = ts - (windowSeconds * 1000);

                        // Check simulation logic
                        const activeMessages = acceptedTimestamps.filter(t => t > windowStart);
                        const shouldAllow = activeMessages.length < maxMessages;

                        const allowed = await limiter.checkLimit(userId);
                        expect(allowed).toBe(shouldAllow);

                        if (allowed) {
                            await limiter.recordMessage(userId);
                            acceptedTimestamps.push(ts);
                        } else {
                            // Property 18: Retry-after accuracy
                            const retryAfter = await limiter.getRetryAfter(userId);

                            // Calculate expected retry after
                            // We are blocked. We need one slot to free up.
                            // Slot frees up when the oldest active message expires.
                            // Oldest active message is activeMessages[0].
                            // Why [0]? activeMessages is sorted (since acceptedTimestamps is sorted).
                            // activeMessages[0] is the one that expires soonest.

                            if (activeMessages.length > 0) {
                                const oldestActive = activeMessages[0];
                                const expiry = oldestActive + (windowSeconds * 1000);
                                const expectedWaitMs = Math.max(0, expiry - currentTime);
                                const expectedRetryAfter = Math.ceil(expectedWaitMs / 1000);

                                expect(retryAfter).toBe(expectedRetryAfter);
                            }
                        }
                    }
                }
            )
        );
    });

    // Feature: websocket-enhancements, Property 19: Configuration Override
    test('should respect custom configuration', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 100 }), // custom Max
                async (customMax) => {
                    const config = { maxMessages: customMax, windowSeconds: 10 };
                    const limiter = new RateLimiter(config, () => 1000); // Fixed time
                    const userId = 'user2';

                    // Send customMax messages
                    for (let i = 0; i < customMax; i++) {
                        expect(await limiter.checkLimit(userId)).toBe(true);
                        await limiter.recordMessage(userId);
                    }

                    // Next should fail
                    expect(await limiter.checkLimit(userId)).toBe(false);
                }
            )
        );
    });
});
