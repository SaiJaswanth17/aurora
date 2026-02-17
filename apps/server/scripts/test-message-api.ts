import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMessageAPI() {
  console.log('🧪 Testing Message API...\n');

  // Get the conversation between saijaswanth1728 and Sai
  const conversationId = '8e17c8c9-34b7-4666-9f2a-e6032e4b64f1';
  
  console.log(`Testing conversation: ${conversationId}\n`);

  // Test 1: Fetch messages directly from database
  console.log('Test 1: Direct database query');
  const { data: messages, error } = await supabase
    .from('dm_messages')
    .select('*, author:profiles(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Found ${messages?.length || 0} messages`);
    if (messages && messages.length > 0) {
      console.log('\nFirst 3 messages:');
      for (const msg of messages.slice(0, 3)) {
        console.log(`  - ${msg.author?.username}: ${msg.content}`);
      }
    }
  }

  // Test 2: Check conversation membership
  console.log('\n\nTest 2: Check conversation members');
  const { data: members, error: memberError } = await supabase
    .from('conversation_members')
    .select('user_id, profiles(username)')
    .eq('conversation_id', conversationId);

  if (memberError) {
    console.error('❌ Error:', memberError);
  } else {
    console.log(`✅ Found ${members?.length || 0} members:`);
    for (const member of members || []) {
      console.log(`  - ${(member as any).profiles?.username} (${member.user_id})`);
    }
  }

  // Test 3: Simulate API call
  console.log('\n\nTest 3: Simulate API endpoint');
  const userId = '8506f333-5b64-427a-85fc-9ebe52554aa3'; // saijaswanth1728
  
  // Check membership
  const { data: membership, error: membershipError } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    console.error('❌ User is not a member of this conversation');
    console.error('Error:', membershipError);
  } else {
    console.log('✅ User is a member of this conversation');
    
    // Fetch messages
    const { data: apiMessages, error: apiError } = await supabase
      .from('dm_messages')
      .select('*, author:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (apiError) {
      console.error('❌ Error fetching messages:', apiError);
    } else {
      console.log(`✅ API would return ${apiMessages?.length || 0} messages`);
    }
  }

  // Test 4: Check for any RLS issues
  console.log('\n\nTest 4: Check RLS policies');
  const { data: policies, error: policyError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT tablename, policyname, permissive, roles, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('dm_messages', 'conversation_members')
        ORDER BY tablename, policyname;
      `
    });

  if (policyError) {
    console.log('⚠️  Cannot check RLS policies (requires direct database access)');
  } else {
    console.log('✅ RLS policies:', policies);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete');
  console.log('='.repeat(60));
}

// Run the test
testMessageAPI()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
