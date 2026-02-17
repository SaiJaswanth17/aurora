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

async function fullSystemCheck() {
  console.log('🔍 Full System Check\n');
  console.log('='.repeat(60));

  // 1. Check users
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log(`\n✅ Users: ${users?.users.length || 0}`);
  for (const user of users?.users || []) {
    console.log(`   - ${user.email}`);
  }

  // 2. Check profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log(`\n✅ Profiles: ${profiles?.length || 0}`);
  for (const profile of profiles || []) {
    console.log(`   - ${profile.username} (${profile.id})`);
  }

  // 3. Check conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_members (
        user_id,
        profiles (username)
      )
    `);
  
  console.log(`\n✅ Conversations: ${conversations?.length || 0}`);
  for (const convo of conversations || []) {
    const members = convo.conversation_members as any[];
    const names = members.map(m => m.profiles?.username).join(' & ');
    console.log(`   - ${names}`);
  }

  // 4. Check messages
  const { data: messages } = await supabase.from('dm_messages').select('id');
  console.log(`\n✅ Messages: ${messages?.length || 0}`);

  // 5. Check RLS policies on dm_messages
  console.log('\n📋 Checking RLS policies...');
  const { data: rlsEnabled } = await supabase
    .rpc('exec_sql', {
      sql: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'dm_messages';`
    })
    .single();

  if (rlsEnabled) {
    console.log('   RLS Status:', rlsEnabled);
  }

  // 6. Test message insertion
  console.log('\n🧪 Testing message insertion...');
  const testConvoId = conversations?.[0]?.id;
  const testUserId = profiles?.[0]?.id;

  if (testConvoId && testUserId) {
    const { data: testMsg, error: insertError } = await supabase
      .from('dm_messages')
      .insert({
        conversation_id: testConvoId,
        author_id: testUserId,
        content: 'Test message from diagnostic script'
      })
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
    } else {
      console.log('   ✅ Insert successful');
      
      // Clean up test message
      await supabase.from('dm_messages').delete().eq('id', testMsg.id);
      console.log('   ✅ Test message cleaned up');
    }
  }

  // 7. Check WebSocket server
  console.log('\n🔌 Checking WebSocket server...');
  try {
    const response = await fetch('http://localhost:3001/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      console.log('   ✅ WebSocket server is running');
    } else {
      console.log('   ⚠️  WebSocket server responded with:', response.status);
    }
  } catch (error) {
    console.log('   ❌ WebSocket server is NOT running');
    console.log('   Start it with: cd apps/server && bun run dev');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ System check complete\n');
}

fullSystemCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
