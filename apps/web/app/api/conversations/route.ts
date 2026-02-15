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

        // Use Service Role client for all operations to bypass RLS
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if conversation already exists between these two users
        // Find conversations where both users are members
        const { data: userConversations, error: fetchError } = await adminSupabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', user.id);

        if (fetchError) {
            console.error('Fetch Error:', fetchError);
            return NextResponse.json({ 
                error: 'Failed to check existing conversations',
                details: fetchError.message 
            }, { status: 500 });
        }

        if (userConversations && userConversations.length > 0) {
            const conversationIds = userConversations.map(c => c.conversation_id);
            
            // Check which of these conversations also has the target user
            const { data: sharedConversations, error: sharedError } = await adminSupabase
                .from('conversation_members')
                .select('conversation_id, conversations!inner(type)')
                .eq('user_id', participantId)
                .in('conversation_id', conversationIds);

            if (sharedError) {
                console.error('Shared conversation check error:', sharedError);
            } else if (sharedConversations && sharedConversations.length > 0) {
                // Find a DM conversation (not group)
                const dmConversation = sharedConversations.find((c: any) => c.conversations?.type === 'dm');
                if (dmConversation) {
                    console.log('Found existing DM conversation:', dmConversation.conversation_id);
                    return NextResponse.json({ conversationId: dmConversation.conversation_id });
                }
            }
        }

        console.log('Creating new conversation...');

        // Create new conversation
        const { data: newConvo, error: createError } = await adminSupabase
            .from('conversations')
            .insert({ type: 'dm' })
            .select('id')
            .single();

        if (createError) {
            console.error('Create Error:', createError);
            return NextResponse.json({ 
                error: 'Failed to create conversation',
                details: createError.message 
            }, { status: 500 });
        }

        console.log('Created conversation:', newConvo.id);

        // Add participants using admin client
        const { error: partError } = await adminSupabase
            .from('conversation_members')
            .insert([
                { conversation_id: newConvo.id, user_id: user.id },
                { conversation_id: newConvo.id, user_id: participantId }
            ]);

        if (partError) {
            console.error('Participant Error:', partError);
            return NextResponse.json({ 
                error: 'Failed to add participants',
                details: partError.message 
            }, { status: 500 });
        }

        console.log('Successfully created conversation with participants');
        return NextResponse.json({ conversationId: newConvo.id });
    } catch (error) {
        console.error('Conversation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to create conversation',
            details: errorMessage
        }, { status: 500 });
    }
}
