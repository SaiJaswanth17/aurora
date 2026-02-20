import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMessages() {
  console.log('🔍 Checking message content...\n');

  // Get a sample of messages
  const { data: messages, error } = await supabase
    .from('dm_messages')
    .select('id, content, author_id, conversation_id, created_at, author:profiles(username)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  console.log(`Found ${messages?.length || 0} messages:\n`);

  messages?.forEach((msg, index) => {
    console.log(`${index + 1}. Message ID: ${msg.id}`);
    console.log(`   Author: ${(msg.author as any)?.username || 'Unknown'}`);
    console.log(`   Content: "${msg.content}"`);
    console.log(`   Content length: ${msg.content?.length || 0} characters`);
    console.log(`   Content type: ${typeof msg.content}`);
    console.log(`   Created: ${msg.created_at}`);
    console.log('');
  });

  // Check if content is null or empty
  const emptyMessages = messages?.filter(m => !m.content || m.content.trim() === '');
  console.log(`\n📊 Summary:`);
  console.log(`   Total messages: ${messages?.length || 0}`);
  console.log(`   Empty/null content: ${emptyMessages?.length || 0}`);
  console.log(`   Valid content: ${(messages?.length || 0) - (emptyMessages?.length || 0)}`);
}

checkMessages();
