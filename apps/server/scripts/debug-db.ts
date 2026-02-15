import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('--- Checking Conversation Members ---');
    const { data: members, error: membersError } = await supabase
        .from('conversation_members')
        .select('*')
        .order('joined_at', { ascending: false })
        .limit(10);

    if (membersError) console.error(membersError);
    console.log(JSON.stringify(members, null, 2));

    console.log('\n--- Checking DM Messages ---');
    const { data: messages, error: messagesError } = await supabase
        .from('dm_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (messagesError) console.error(messagesError);
    console.log(JSON.stringify(messages, null, 2));

    console.log('\n--- Checking Users ---');
    const { data: users, error: usersError } = await supabase.from('profiles').select('id, username');
    if (usersError) console.error(usersError);
    console.log(JSON.stringify(users, null, 2));
}

main();
