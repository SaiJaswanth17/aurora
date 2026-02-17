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

async function fixUnknownUsers() {
  console.log('🔍 Checking for users with missing or invalid profiles...\n');

  // 1. Find all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  console.log(`Found ${authUsers.users.length} auth users\n`);

  // 2. Find all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');

  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError);
    return;
  }

  console.log(`Found ${profiles?.length || 0} profiles\n`);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
  
  let fixedCount = 0;
  let createdCount = 0;

  // 3. Check each auth user
  for (const authUser of authUsers.users) {
    const profile = profileMap.get(authUser.id);
    
    if (!profile) {
      // Profile doesn't exist - create it
      console.log(`❌ User ${authUser.email} (${authUser.id}) has NO profile`);
      
      const username = authUser.user_metadata?.username || 
                      authUser.email?.split('@')[0] || 
                      `user_${authUser.id.substring(0, 8)}`;
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          username: username,
          status: 'offline',
          created_at: authUser.created_at
        });

      if (insertError) {
        console.error(`  ❌ Failed to create profile: ${insertError.message}`);
      } else {
        console.log(`  ✅ Created profile with username: ${username}\n`);
        createdCount++;
      }
    } else if (!profile.username || profile.username.trim() === '') {
      // Profile exists but username is null/empty
      console.log(`❌ User ${authUser.email} (${authUser.id}) has NULL/empty username`);
      
      const username = authUser.user_metadata?.username || 
                      authUser.email?.split('@')[0] || 
                      `user_${authUser.id.substring(0, 8)}`;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username })
        .eq('id', authUser.id);

      if (updateError) {
        console.error(`  ❌ Failed to update username: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated username to: ${username}\n`);
        fixedCount++;
      }
    } else {
      console.log(`✅ User ${authUser.email} - Profile OK (username: ${profile.username})`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   - Total auth users: ${authUsers.users.length}`);
  console.log(`   - Profiles created: ${createdCount}`);
  console.log(`   - Profiles fixed: ${fixedCount}`);
  console.log('='.repeat(60) + '\n');

  // 4. Check for orphaned profiles (profiles without auth users)
  const authUserIds = new Set(authUsers.users.map(u => u.id));
  const orphanedProfiles = profiles?.filter(p => !authUserIds.has(p.id)) || [];

  if (orphanedProfiles.length > 0) {
    console.log(`\n⚠️  Found ${orphanedProfiles.length} orphaned profiles (no auth user):`);
    for (const orphan of orphanedProfiles) {
      console.log(`   - ${orphan.username} (${orphan.id})`);
    }
    console.log('\n❓ Do you want to delete these orphaned profiles?');
    console.log('   Run with --delete-orphans flag to remove them\n');
  }
}

// Run the script
fixUnknownUsers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
