
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(
    _request: Request,
    { params }: { params: { channelId: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { channelId } = params;

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Verify channel and server membership
        const { data: channel } = await supabase
            .from('channels')
            .select('server_id')
            .eq('id', channelId)
            .single();

        if (!channel) {
            return new NextResponse('Channel not found', { status: 404 });
        }

        const { data: membership } = await supabase
            .from('server_members')
            .select('id, role')
            .eq('server_id', channel.server_id)
            .eq('user_id', session.user.id)
            .single();

        // Only allow admins or moderators to clear channel history?
        // For now, let's allow any member to "clear" their view, 
        // BUT since we are doing a hard delete, we should probably restrict this to admins
        // OR change the requirement to just hide messages locally.
        // Given the user request "cleared the chat... reloading... showing again", 
        // it implies they want it GONE.
        // Let's restrict hard delete to admins for channels.

        if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
            return new NextResponse('Unauthorized - Admin or Moderator required to clear channel', { status: 403 });
        }

        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('channel_id', channelId);

        if (deleteError) {
            console.error('Error clearing channel:', deleteError);
            return new NextResponse('Internal Error', { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Internal Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
