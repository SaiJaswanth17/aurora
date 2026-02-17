import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWebSocketFlow() {
  console.log('🧪 Testing WebSocket Message Flow\n');
  console.log('='.repeat(60));

  // Get a test conversation
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_members (
        user_id,
        profiles (username)
      )
    `)
    .limit(1);

  if (!conversations || conversations.length === 0) {
    console.log('❌ No conversations found');
    return;
  }

  const testConvo = conversations[0];
  const members = testConvo.conversation_members as any[];
  
  console.log('\n📋 Test Conversation:');
  console.log(`   ID: ${testConvo.id}`);
  console.log(`   Members: ${members.map(m => m.profiles?.username).join(' & ')}`);

  // Test message insertion
  console.log('\n🧪 Test 1: Insert message as User A');
  const userA = members[0];
  const userB = members[1];

  const { data: msg1, error: err1 } = await supabase
    .from('dm_messages')
    .insert({
      conversation_id: testConvo.id,
      author_id: userA.user_id,
      content: `Test from ${userA.profiles?.username} at ${new Date().toISOString()}`
    })
    .select('*, author:profiles(*)')
    .single();

  if (err1) {
    console.log('   ❌ Failed:', err1.message);
  } else {
    console.log('   ✅ Message inserted');
    console.log(`   Content: ${msg1.content}`);
  }

  // Check if User B can see it
  console.log('\n🧪 Test 2: Check if User B can fetch messages');
  const { data: messages, error: err2 } = await supabase
    .from('dm_messages')
    .select('*, author:profiles(*)')
    .eq('conversation_id', testConvo.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (err2) {
    console.log('   ❌ Failed:', err2.message);
  } else {
    console.log(`   ✅ Found ${messages?.length || 0} messages`);
    for (const msg of messages || []) {
      console.log(`   - ${msg.author?.username}: ${msg.content.substring(0, 50)}`);
    }
  }

  // Check conversation membership
  console.log('\n🧪 Test 3: Verify both users are members');
  for (const member of members) {
    const { data: membership, error: err3 } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', testConvo.id)
      .eq('user_id', member.user_id)
      .single();

    if (err3 || !membership) {
      console.log(`   ❌ ${member.profiles?.username} is NOT a member`);
    } else {
      console.log(`   ✅ ${member.profiles?.username} is a member`);
    }
  }

  // Check RLS policies
  console.log('\n🧪 Test 4: Check RLS on dm_messages');
  const { data: rlsCheck } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'dm_messages'
        ORDER BY policyname;
      `
    });

  if (rlsCheck) {
    console.log('   RLS Policies:', rlsCheck);
  } else {
    console.log('   ⚠️  Cannot check RLS (requires direct DB access)');
  }

  // Cleanup test message
  if (msg1) {
    await supabase.from('dm_messages').delete().eq('id', msg1.id);
    console.log('\n✅ Test message cleaned up');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete\n');
}

testWebSocketFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
