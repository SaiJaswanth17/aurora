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

async function fixDuplicateConversations() {
  console.log('🔍 Finding and fixing duplicate conversations...\n');

  // 1. Get all DM conversations with their members
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
    `)
    .eq('type', 'dm');

  if (convoError) {
    console.error('❌ Error fetching conversations:', convoError);
    return;
  }

  console.log(`Found ${conversations?.length || 0} DM conversations\n`);

  // 2. Group conversations by participant pairs
  const conversationsByPair = new Map<string, any[]>();

  for (const convo of conversations || []) {
    const members = convo.conversation_members as any[];
    
    if (members.length !== 2) {
      console.log(`⚠️  Skipping conversation ${convo.id} - has ${members.length} members`);
      continue;
    }

    // Create a sorted pair key to identify duplicates
    const userIds = members.map(m => m.user_id).sort();
    const pairKey = userIds.join('|');

    if (!conversationsByPair.has(pairKey)) {
      conversationsByPair.set(pairKey, []);
    }
    conversationsByPair.get(pairKey)!.push(convo);
  }

  // 3. Find and fix duplicates
  let duplicatesFound = 0;
  let conversationsDeleted = 0;

  for (const [pairKey, convos] of conversationsByPair.entries()) {
    if (convos.length > 1) {
      duplicatesFound++;
      const usernames = convos[0].conversation_members.map((m: any) => m.profiles?.username || 'Unknown').join(' & ');
      console.log(`\n❌ Found ${convos.length} duplicate conversations between: ${usernames}`);
      console.log(`   Pair: ${pairKey}`);

      // Sort by created_at to keep the oldest one
      convos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const keepConvo = convos[0];
      const deleteConvos = convos.slice(1);

      console.log(`   ✅ Keeping: ${keepConvo.id} (created ${keepConvo.created_at})`);

      // Get all messages from conversations to be deleted
      for (const deleteConvo of deleteConvos) {
        console.log(`   🗑️  Deleting: ${deleteConvo.id} (created ${deleteConvo.created_at})`);

        // Move messages to the kept conversation
        const { data: messages } = await supabase
          .from('dm_messages')
          .select('*')
          .eq('conversation_id', deleteConvo.id);

        if (messages && messages.length > 0) {
          console.log(`      Moving ${messages.length} messages to kept conversation...`);
          
          // Update messages to point to kept conversation
          const { error: updateError } = await supabase
            .from('dm_messages')
            .update({ conversation_id: keepConvo.id })
            .eq('conversation_id', deleteConvo.id);

          if (updateError) {
            console.error(`      ❌ Failed to move messages: ${updateError.message}`);
          } else {
            console.log(`      ✅ Moved ${messages.length} messages`);
          }
        }

        // Delete members
        const { error: memberError } = await supabase
          .from('conversation_members')
          .delete()
          .eq('conversation_id', deleteConvo.id);

        if (memberError) {
          console.error(`      ❌ Failed to delete members: ${memberError.message}`);
        }

        // Delete conversation
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', deleteConvo.id);

        if (deleteError) {
          console.error(`      ❌ Failed to delete conversation: ${deleteError.message}`);
        } else {
          conversationsDeleted++;
          console.log(`      ✅ Deleted conversation`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   - Total conversations: ${conversations?.length || 0}`);
  console.log(`   - Unique user pairs: ${conversationsByPair.size}`);
  console.log(`   - Duplicate pairs found: ${duplicatesFound}`);
  console.log(`   - Conversations deleted: ${conversationsDeleted}`);
  console.log('='.repeat(60) + '\n');
}

// Run the script
fixDuplicateConversations()
  .then(() => {
    console.log('✅ Duplicate fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
