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

async function diagnoseMessaging() {
  console.log('🔍 Diagnosing messaging system...\n');

  // 1. Check all users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  console.log(`📊 Found ${authUsers.users.length} users:\n`);
  for (const user of authUsers.users) {
    console.log(`   - ${user.email} (${user.id})`);
  }

  // 2. Check all conversations
  const { data: conversations, error: convoError } = await supabase
    .from('conversations')
    .select(`
      id,
      type,
      created_at,
      conversation_members (
        user_id,
        profiles (
          username
        )
      )
    `);

  if (convoError) {
    console.error('❌ Error fetching conversations:', convoError);
    return;
  }

  console.log(`\n💬 Found ${conversations?.length || 0} conversations:\n`);
  for (const convo of conversations || []) {
    const members = convo.conversation_members as any[];
    const memberNames = members.map(m => m.profiles?.username || 'Unknown').join(' & ');
    console.log(`   - ${convo.id}`);
    console.log(`     Members: ${memberNames}`);
    console.log(`     Created: ${convo.created_at}`);
  }

  // 3. Check messages in each conversation
  console.log(`\n📨 Checking messages in conversations:\n`);
  for (const convo of conversations || []) {
    const { data: messages, error: msgError } = await supabase
      .from('dm_messages')
      .select(`
        id,
        content,
        author_id,
        created_at,
        author:profiles!dm_messages_author_id_fkey (
          username
        )
      `)
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error(`   ❌ Error fetching messages for ${convo.id}:`, msgError);
      continue;
    }

    const members = convo.conversation_members as any[];
    const memberNames = members.map(m => m.profiles?.username || 'Unknown').join(' & ');
    
    console.log(`   Conversation: ${memberNames}`);
    console.log(`   Messages: ${messages?.length || 0}`);
    
    if (messages && messages.length > 0) {
      for (const msg of messages.slice(-5)) { // Show last 5 messages
        const author = (msg as any).author;
        const authorName = author?.username || 'Unknown';
        const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
        console.log(`     - ${authorName}: ${preview}`);
      }
    } else {
      console.log(`     (No messages)`);
    }
    console.log('');
  }

  // 4. Check conversation_members table for any issues
  const { data: allMembers, error: memberError } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      user_id,
      profiles (
        username
      )
    `);

  if (memberError) {
    console.error('❌ Error fetching conversation members:', memberError);
    return;
  }

  console.log(`\n👥 Total conversation memberships: ${allMembers?.length || 0}\n`);

  // Group by conversation
  const membersByConvo = new Map<string, any[]>();
  for (const member of allMembers || []) {
    if (!membersByConvo.has(member.conversation_id)) {
      membersByConvo.set(member.conversation_id, []);
    }
    membersByConvo.get(member.conversation_id)!.push(member);
  }

  for (const [convoId, members] of membersByConvo.entries()) {
    const memberNames = members.map(m => m.profiles?.username || 'Unknown').join(', ');
    console.log(`   ${convoId}: ${members.length} members (${memberNames})`);
  }

  // 5. Summary
  console.log(`\n📊 Summary:\n`);
  console.log(`   - Total users: ${authUsers.users.length}`);
  console.log(`   - Total conversations: ${conversations?.length || 0}`);
  console.log(`   - Total memberships: ${allMembers?.length || 0}`);
  
  let totalMessages = 0;
  for (const convo of conversations || []) {
    const { data: messages } = await supabase
      .from('dm_messages')
      .select('id')
      .eq('conversation_id', convo.id);
    totalMessages += messages?.length || 0;
  }
  console.log(`   - Total messages: ${totalMessages}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic complete');
  console.log('='.repeat(60));
}

// Run the script
diagnoseMessaging()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });
