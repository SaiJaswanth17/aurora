import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { participantId } = await request.json();
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if conversation already exists (using user client is fine for reading own data)
        const { data: existingConvo } = await supabase
            .rpc('get_conversation_with_user', { target_user_id: participantId });

        if (existingConvo && existingConvo.length > 0) {
            return NextResponse.json({ conversationId: existingConvo[0].id });
        }

        // Use Service Role to bypass RLS for creation
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Create new conversation
        const { data: newConvo, error: createError } = await adminSupabase
            .from('conversations')
            .insert({ type: 'dm' })
            .select('id')
            .single();

        if (createError) {
            console.error('Create Error:', createError);
            throw createError;
        }

        // Add participants using admin client
        const { error: partError } = await adminSupabase
            .from('conversation_members')
            .insert([
                { conversation_id: newConvo.id, user_id: user.id },
                { conversation_id: newConvo.id, user_id: participantId }
            ]);

        if (partError) throw partError;

        return NextResponse.json({ conversationId: newConvo.id });
    } catch (error) {
        console.error('Conversation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to create conversation',
            details: errorMessage,
            fullError: JSON.stringify(error)
        }, { status: 500 });
    }
}
