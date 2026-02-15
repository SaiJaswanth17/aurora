import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch servers where user is a member
    const { data: serverMembers, error: membersError } = await supabase
      .from('server_members')
      .select('server_id')
      .eq('user_id', user.id);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    if (!serverMembers || serverMembers.length === 0) {
      return NextResponse.json({ servers: [] });
    }

    const serverIds = serverMembers.map(m => m.server_id);

    // Fetch server details
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('id, name, icon_url, owner_id, created_at')
      .in('id', serverIds)
      .order('created_at', { ascending: true });

    if (serversError) {
      return NextResponse.json({ error: serversError.message }, { status: 500 });
    }

    return NextResponse.json({ servers: servers || [] });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Server name is required' }, { status: 400 });
    }

    // Create server
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .insert({
        name,
        icon_url,
        owner_id: user.id,
      })
      .select()
      .single();

    if (serverError) {
      return NextResponse.json({ error: serverError.message }, { status: 500 });
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('server_members')
      .insert({
        server_id: server.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Create default "general" channel
    const { error: channelError } = await supabase
      .from('channels')
      .insert({
        server_id: server.id,
        name: 'general',
        type: 'text',
        position: 0,
      });

    if (channelError) {
      console.error('Error creating default channel:', channelError);
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
