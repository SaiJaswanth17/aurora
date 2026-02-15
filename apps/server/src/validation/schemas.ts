
import { z } from 'zod';
import { WS_EVENTS } from '@aurora/shared';

// Shared UUID validation
const uuid = z.string().uuid();

// Payload Schemas
export const authSchema = z.object({
    token: z.string().min(1)
});

export const messageSchema = z.object({
    content: z.string().min(1).max(5000), // Reasonable limit
    channelId: uuid.optional(),
    conversationId: uuid.optional(),
    tempId: z.string().optional() // For optimistic UI handling
}).refine(data => !!data.channelId || !!data.conversationId, {
    message: "Either channelId or conversationId must be provided"
});

export const typingSchema = z.object({
    channelId: uuid.optional(),
    conversationId: uuid.optional(),
    isTyping: z.boolean()
}).refine(data => !!data.channelId || !!data.conversationId, {
    message: "Either channelId or conversationId must be provided"
});

export const joinLeaveSchema = z.object({
    channelId: uuid.optional(),
    conversationId: uuid.optional()
}).refine(data => !!data.channelId || !!data.conversationId, {
    message: "Either channelId or conversationId must be provided"
});

// Wrapper Schema
export const socketMessageSchema = z.object({
    type: z.nativeEnum(WS_EVENTS),
    payload: z.any()
});
