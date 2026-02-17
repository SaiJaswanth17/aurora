
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(
    _request: Request,
    { params }: { params: { conversationId: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { conversationId } = params;

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Verify membership
        const { data: membership, error: membershipError } = await supabase
            .from('conversation_members')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', session.user.id)
            .single();

        if (membershipError || !membership) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Delete all messages in the conversation
        // In a real production app, we might want to just hide them for this user
        // But for now, we'll delete them as requested
        const { error: deleteError } = await supabase
            .from('dm_messages')
            .delete()
            .eq('conversation_id', conversationId);

        if (deleteError) {
            console.error('Error clearing conversation:', deleteError);
            return new NextResponse('Internal Error', { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Internal Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
