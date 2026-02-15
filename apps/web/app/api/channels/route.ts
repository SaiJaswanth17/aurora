import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    // Check if user is a member of the server
    const { data: membership, error: membershipError } = await supabase
      .from('server_members')
      .select('id')
      .eq('server_id', serverId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this server' }, { status: 403 });
    }

    // Fetch channels for the server
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, server_id, name, type, position, created_at')
      .eq('server_id', serverId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (channelsError) {
      return NextResponse.json({ error: channelsError.message }, { status: 500 });
    }

    return NextResponse.json({ channels: channels || [] });
  } catch (error) {
    console.error('Error fetching channels:', error);
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
    const { server_id, name, type = 'text' } = body;

    if (!server_id || !name) {
      return NextResponse.json({ error: 'Server ID and channel name are required' }, { status: 400 });
    }

    // Check if user has permission to create channels (owner or admin)
    const { data: membership, error: membershipError } = await supabase
      .from('server_members')
      .select('role')
      .eq('server_id', server_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not a member of this server' }, { status: 403 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get current max position
    const { data: maxPosition } = await supabase
      .from('channels')
      .select('position')
      .eq('server_id', server_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (maxPosition?.position ?? -1) + 1;

    // Create channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        server_id,
        name,
        type,
        position,
      })
      .select()
      .single();

    if (channelError) {
      return NextResponse.json({ error: channelError.message }, { status: 500 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
