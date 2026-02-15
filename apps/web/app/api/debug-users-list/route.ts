import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, status');

    return NextResponse.json({ data, error });
}
