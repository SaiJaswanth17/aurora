
import { z } from 'zod';
import { WS_EVENTS } from '@aurora/shared';

// Shared UUID validation
const uuid = z.string().uuid();

// Payload Schemas
export const authSchema = z.object({
    token: z.string().min(1)
});

export const messageSchema = z.object({
    content: z.string().max(5000).optional(),
    attachments: z.array(z.string()).optional(),
    channelId: uuid.optional(),
    conversationId: uuid.optional(),
    tempId: z.string().optional() // For optimistic UI handling
}).refine(data => !!data.channelId || !!data.conversationId, {
    message: "Either channelId or conversationId must be provided"
}).refine(data => (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0), {
    message: "Message must contain either text or attachments"
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


// Wrapper Schema - accept any string type so call:signal and future events are not dropped
export const socketMessageSchema = z.object({
    type: z.string(),
    payload: z.any()
});

