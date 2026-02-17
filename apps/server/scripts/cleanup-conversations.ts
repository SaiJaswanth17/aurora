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

async function cleanupConversations() {
  console.log('🔍 Checking for conversation data integrity issues...\n');

  // 1. Get all conversations
  const { data: conversations, error: convoError } = await supabase
    .from('conversations')
    .select('*');

  if (convoError) {
    console.error('❌ Error fetching conversations:', convoError);
    return;
  }

  console.log(`Found ${conversations?.length || 0} conversations\n`);

  // 2. Get all conversation members with profile data
  const { data: members, error: memberError } = await supabase
    .from('conversation_members')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url,
        status
      )
    `);

  if (memberError) {
    console.error('❌ Error fetching conversation members:', memberError);
    return;
  }

  console.log(`Found ${members?.length || 0} conversation members\n`);

  // 3. Check for issues
  const issues: string[] = [];
  const conversationsToDelete: string[] = [];

  for (const convo of conversations || []) {
    const convoMembers = members?.filter(m => m.conversation_id === convo.id) || [];
    
    if (convoMembers.length === 0) {
      issues.push(`❌ Conversation ${convo.id} has NO members`);
      conversationsToDelete.push(convo.id);
    } else if (convoMembers.length === 1) {
      issues.push(`⚠️  Conversation ${convo.id} has only 1 member (${convoMembers[0].user_id})`);
      conversationsToDelete.push(convo.id);
    } else {
      // Check if all members have valid profiles
      const membersWithoutProfiles = convoMembers.filter(m => !m.profiles);
      const membersWithoutUsernames = convoMembers.filter(m => m.profiles && !m.profiles.username);
      
      if (membersWithoutProfiles.length > 0) {
        issues.push(`❌ Conversation ${convo.id} has ${membersWithoutProfiles.length} member(s) without profiles: ${membersWithoutProfiles.map(m => m.user_id).join(', ')}`);
        conversationsToDelete.push(convo.id);
      } else if (membersWithoutUsernames.length > 0) {
        issues.push(`❌ Conversation ${convo.id} has ${membersWithoutUsernames.length} member(s) with NULL usernames: ${membersWithoutUsernames.map(m => m.user_id).join(', ')}`);
        conversationsToDelete.push(convo.id);
      } else {
        console.log(`✅ Conversation ${convo.id} is valid (${convoMembers.length} members)`);
      }
    }
  }

  if (issues.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 Issues Found:');
    issues.forEach(issue => console.log(issue));
    console.log('='.repeat(60) + '\n');
  }

  if (conversationsToDelete.length > 0) {
    console.log(`\n🗑️  Found ${conversationsToDelete.length} conversations to delete:\n`);
    
    for (const convoId of conversationsToDelete) {
      console.log(`   Deleting conversation ${convoId}...`);
      
      // Delete messages first
      const { error: msgError } = await supabase
        .from('dm_messages')
        .delete()
        .eq('conversation_id', convoId);
      
      if (msgError) {
        console.error(`   ❌ Failed to delete messages: ${msgError.message}`);
      } else {
        console.log(`   ✅ Deleted messages`);
      }
      
      // Delete members
      const { error: memberDelError } = await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', convoId);
      
      if (memberDelError) {
        console.error(`   ❌ Failed to delete members: ${memberDelError.message}`);
      } else {
        console.log(`   ✅ Deleted members`);
      }
      
      // Delete conversation
      const { error: convoDelError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', convoId);
      
      if (convoDelError) {
        console.error(`   ❌ Failed to delete conversation: ${convoDelError.message}`);
      } else {
        console.log(`   ✅ Deleted conversation\n`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   - Total conversations: ${conversations?.length || 0}`);
  console.log(`   - Issues found: ${issues.length}`);
  console.log(`   - Conversations deleted: ${conversationsToDelete.length}`);
  console.log('='.repeat(60) + '\n');
}

// Run the script
cleanupConversations()
  .then(() => {
    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
