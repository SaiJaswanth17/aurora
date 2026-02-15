
export const normalizeMessage = (msg: any) => {
    if (!msg) return null;

    // Check if already normalized (has camelCase props and no snake_case props relevant to us)
    if (msg.createdAt && !msg.created_at) return msg;

    return {
        id: msg.id,
        channelId: msg.channel_id,
        conversationId: msg.conversation_id,
        authorId: msg.author_id,
        content: msg.content,
        // Prefer created_at, fallback to createdAt
        createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
        updatedAt: msg.updated_at || msg.updatedAt,
        attachments: msg.attachments || [],
        type: msg.type,
        author: msg.author ? {
            id: msg.author.id,
            username: msg.author.username,
            avatarUrl: msg.author.avatar_url || msg.author.avatarUrl,
            status: msg.author.status,
            customStatus: msg.author.custom_status || msg.author.customStatus,
        } : undefined
    };
};
