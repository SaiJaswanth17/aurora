import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying migration 012_prevent_duplicate_conversations.sql...\n');

  const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/012_prevent_duplicate_conversations.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (this won't work with Supabase client)
      console.log('⚠️  Cannot execute migration directly via Supabase client');
      console.log('📋 Please run this SQL manually in your Supabase SQL Editor:\n');
      console.log('='.repeat(60));
      console.log(migrationSQL);
      console.log('='.repeat(60));
      console.log('\nOr use the Supabase CLI: supabase db push');
    } else {
      console.log('✅ Migration applied successfully!');
    }
  } catch (error) {
    console.log('⚠️  Cannot execute migration directly via Supabase client');
    console.log('📋 Please run this SQL manually in your Supabase SQL Editor:\n');
    console.log('='.repeat(60));
    console.log(migrationSQL);
    console.log('='.repeat(60));
    console.log('\nOr use the Supabase CLI: supabase db push');
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
