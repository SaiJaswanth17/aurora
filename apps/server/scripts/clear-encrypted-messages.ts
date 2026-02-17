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

async function clearEncryptedMessages() {
  console.log('🔍 Checking for encrypted messages...\n');

  // Get all messages
  const { data: messages, error } = await supabase
    .from('dm_messages')
    .select('id, content, conversation_id, author_id, created_at');

  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }

  console.log(`Found ${messages?.length || 0} total messages\n`);

  // Check which messages are encrypted (base64 encoded)
  const encryptedMessages = messages?.filter(msg => {
    // Check if content looks like base64 (contains +, /, = and is long)
    return msg.content && (
      msg.content.includes('+') || 
      msg.content.includes('/') || 
      msg.content.endsWith('==') ||
      msg.content.endsWith('=')
    ) && msg.content.length > 20;
  }) || [];

  console.log(`Found ${encryptedMessages.length} encrypted messages\n`);

  if (encryptedMessages.length === 0) {
    console.log('✅ No encrypted messages found. All messages are in plain text.');
    return;
  }

  console.log('⚠️  WARNING: This will DELETE all encrypted messages!');
  console.log('   Encrypted messages cannot be decrypted without the encryption key.');
  console.log('   Only plain text messages will remain.\n');

  console.log('Sample encrypted messages:');
  for (const msg of encryptedMessages.slice(0, 5)) {
    console.log(`   - ${msg.content.substring(0, 50)}...`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Deleting encrypted messages...');
  console.log('='.repeat(60) + '\n');

  // Delete encrypted messages
  const idsToDelete = encryptedMessages.map(m => m.id);
  
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { error: deleteError } = await supabase
      .from('dm_messages')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`❌ Error deleting batch ${i / 100 + 1}:`, deleteError);
    } else {
      console.log(`✅ Deleted batch ${i / 100 + 1} (${batch.length} messages)`);
    }
  }

  // Check remaining messages
  const { data: remainingMessages } = await supabase
    .from('dm_messages')
    .select('id');

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   - Total messages before: ${messages?.length || 0}`);
  console.log(`   - Encrypted messages deleted: ${encryptedMessages.length}`);
  console.log(`   - Plain text messages remaining: ${remainingMessages?.length || 0}`);
  console.log('='.repeat(60) + '\n');

  console.log('✅ Cleanup complete!');
  console.log('   Users can now send new messages in plain text.');
  console.log('   All new messages will be readable.\n');
}

// Run the script
clearEncryptedMessages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
