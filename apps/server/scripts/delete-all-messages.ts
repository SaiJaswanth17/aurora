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

async function deleteAllMessages() {
  console.log('⚠️  WARNING: This will DELETE ALL messages from all conversations!\n');
  console.log('This is necessary because messages are encrypted and cannot be decrypted.\n');
  console.log('Users will need to start fresh conversations.\n');

  // Get count of messages
  const { data: messages, error } = await supabase
    .from('dm_messages')
    .select('id, conversation_id');

  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }

  console.log(`Found ${messages?.length || 0} messages to delete\n`);

  if (!messages || messages.length === 0) {
    console.log('✅ No messages to delete');
    return;
  }

  // Group by conversation
  const byConvo = new Map<string, number>();
  for (const msg of messages) {
    byConvo.set(msg.conversation_id, (byConvo.get(msg.conversation_id) || 0) + 1);
  }

  console.log('Messages by conversation:');
  for (const [convoId, count] of byConvo.entries()) {
    console.log(`   ${convoId}: ${count} messages`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Deleting all messages...');
  console.log('='.repeat(60) + '\n');

  // Delete all messages
  const { error: deleteError } = await supabase
    .from('dm_messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)

  if (deleteError) {
    console.error('❌ Error deleting messages:', deleteError);
    return;
  }

  console.log('✅ All messages deleted successfully!\n');
  console.log('Users can now send new messages in plain text.');
  console.log('All new messages will be readable by both users.\n');
}

// Run the script
deleteAllMessages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
