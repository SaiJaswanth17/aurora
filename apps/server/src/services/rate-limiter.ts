
import { UserId } from './authentication-layer';

export interface RateLimitConfig {
    maxMessages: number;      // Default: 10
    windowSeconds: number;    // Default: 10
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    maxMessages: 10,
    windowSeconds: 10,
};

export interface IRateLimiter {
    checkLimit(userId: UserId): Promise<boolean>;
    recordMessage(userId: UserId): Promise<void>;
    getRetryAfter(userId: UserId): Promise<number>;
}

export class RateLimiter implements IRateLimiter {
    private userTimestamps: Map<UserId, number[]> = new Map();

    constructor(
        private config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG,
        private getTime: () => number = Date.now
    ) { }

    /**
     * Checks if user can send message
     */
    async checkLimit(userId: UserId): Promise<boolean> {
        const now = this.getTime();
        const windowStart = now - (this.config.windowSeconds * 1000);

        // Get existing timestamps
        let timestamps = this.userTimestamps.get(userId) || [];

        // Filter out old timestamps
        timestamps = timestamps.filter(ts => ts > windowStart);

        // Update map with cleaned timestamps
        if (timestamps.length === 0) {
            this.userTimestamps.delete(userId);
        } else {
            this.userTimestamps.set(userId, timestamps);
        }

        return timestamps.length < this.config.maxMessages;
    }

    /**
     * Records a message send for rate limiting
     */
    async recordMessage(userId: UserId): Promise<void> {
        const now = this.getTime();
        const timestamps = this.userTimestamps.get(userId) || [];
        timestamps.push(now);
        this.userTimestamps.set(userId, timestamps);

        // Optional: Clean up heavily spamming users periodically?
        // Here we clean on checkLimit anyway.
    }

    /**
     * Gets time until user can send next message (in seconds)
     */
    async getRetryAfter(userId: UserId): Promise<number> {
        const now = this.getTime();
        const windowStart = now - (this.config.windowSeconds * 1000);

        let timestamps = this.userTimestamps.get(userId) || [];
        timestamps = timestamps.filter(ts => ts > windowStart);

        if (timestamps.length < this.config.maxMessages) {
            return 0;
        }

        // Find the oldest timestamp that is contributing to the limit
        // The user needs to wait until the (timestamps.length - maxMessages + 1)-th oldest message expires?
        // Actually, if they have N messages > max, they need to wait until count drops below max.
        // They need to wait until the oldest relevant timestamp expires.
        // Relevant timestamps are sorted. Oldest is at index 0.
        // Wait until index 0 expires.

        const oldestRelevantTimestamp = timestamps[0];
        const expiryTime = oldestRelevantTimestamp + (this.config.windowSeconds * 1000);
        const waitTimeMs = expiryTime - now;

        return Math.ceil(Math.max(0, waitTimeMs) / 1000);
    }
}
