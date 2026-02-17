import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { participantId } = await request.json();
        
        console.log('Creating conversation with participant:', participantId);
        
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Current user:', user.id);

        // Validate that participant exists
        const { data: participantProfile, error: participantError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', participantId)
            .single();

        if (participantError || !participantProfile) {
            console.error('Participant profile not found:', participantError);
            return NextResponse.json({ 
                error: 'The user you are trying to message does not exist.',
                details: 'Participant profile not found in database'
            }, { status: 400 });
        }

        // Use the atomic RPC function to get or create conversation
        const { data: conversationId, error: rpcError } = await supabase
            .rpc('get_or_create_dm_conversation', { participant_id: participantId });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            return NextResponse.json({ 
                error: 'Failed to create conversation',
                details: rpcError.message 
            }, { status: 500 });
        }

        console.log('Conversation ID:', conversationId);
        return NextResponse.json({ conversationId });
    } catch (error) {
        console.error('Conversation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to create conversation',
            details: errorMessage
        }, { status: 500 });
    }
}
