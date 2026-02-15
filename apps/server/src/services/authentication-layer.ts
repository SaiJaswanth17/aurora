import { SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { User } from '@aurora/shared';
import { WebSocketData } from '../types';

// Type definitions based on design doc
export type UserId = string;
export type ConnectionId = string;

export interface AuthError {
    code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'MISSING_TOKEN';
    message: string;
}

export class AuthenticationError extends Error {
    constructor(public code: AuthError['code'], message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export interface IAuthenticationLayer {
    validateToken(token: string): Promise<User>;
    isTokenExpired(token: string): boolean;
    requireAuth(data: WebSocketData): User;
}

export class AuthenticationLayer implements IAuthenticationLayer {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Validates auth token and returns user profile or throws error
     */
    async validateToken(token: string): Promise<User> {
        if (!token) {
            throw new AuthenticationError('MISSING_TOKEN', 'Authentication token is required');
        }

        if (this.isTokenExpired(token)) {
            throw new AuthenticationError('EXPIRED_TOKEN', 'Authentication token has expired');
        }

        try {
            // Verify token with Supabase
            const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser(token);

            if (authError || !authUser) {
                throw new AuthenticationError('INVALID_TOKEN', authError?.message || 'Invalid token');
            }

            // Fetch user profile
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('id, username, avatar_url, status, custom_status, created_at')
                .eq('id', authUser.id)
                .single();

            if (error || !profile) {
                throw new AuthenticationError('INVALID_TOKEN', 'User profile not found');
            }

            // Return formatted user
            return {
                id: profile.id,
                username: profile.username || 'Unknown',
                avatarUrl: profile.avatar_url,
                status: 'online', // Default to online on connect
                customStatus: profile.custom_status,
                createdAt: profile.created_at,
            };
        } catch (error) {
            if (error instanceof AuthenticationError) throw error;

            // Check for specific JWT errors if verify failed locally (though getUser handles it)
            throw new AuthenticationError('INVALID_TOKEN', 'Token validation failed');
        }
    }

    /**
     * Checks if token is expired without network call
     */
    isTokenExpired(token: string): boolean {
        if (!token) return true;

        try {
            const decoded = jwt.decode(token);
            if (!decoded || typeof decoded === 'string' || decoded.exp === undefined) {
                // If we can't decode, is string (opaque), or no exp claim, 
                // we can't check expiry locally. Return false to let validateToken proceed.
                return false;
            }

            const now = Math.floor(Date.now() / 1000);
            return decoded.exp < now;
        } catch (error) {
            console.error('Error decoding token:', error);
            return true; // Malformed token
        }
    }

    requireAuth(data: WebSocketData): User {
        if (!data.isAuthenticated || !data.user) {
            throw new AuthenticationError('MISSING_TOKEN', 'Authentication required');
        }
        return data.user;
    }
}
