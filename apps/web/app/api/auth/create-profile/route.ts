import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId, username } = await request.json();

        if (!userId || !username) {
            return NextResponse.json({ error: 'Missing userId or username' }, { status: 400 });
        }

        // Use Service Role to bypass RLS for profile creation
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Check if profile exists
        const { data: existingProfile } = await adminSupabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (existingProfile) {
            return NextResponse.json({ message: 'Profile already exists' });
        }

        // Create profile
        const { error: insertError } = await adminSupabase
            .from('profiles')
            .insert({
                id: userId,
                username,
                status: 'online',
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('Profile creation error (admin):', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create profile API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
