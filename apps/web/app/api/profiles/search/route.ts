import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ profiles: [] });
        }

        const supabase = await createClient();

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, status, custom_status')
            .ilike('username', `%${query}%`)
            .limit(10);

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        return NextResponse.json({ profiles });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
