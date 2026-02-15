const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rujaglqnlafxjbkihdmr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1amFnbHFubGFmeGpia2loZG1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzg2NSwiZXhwIjoyMDg2NDgzODY1fQ.CyMHq89C0MrHBpF3uk6bqXX7tap8-2E_6meJ7FL4kC8'
);

async function checkUsers() {
    // 1. List all auth users (limited to admin)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) console.error('Auth Error:', authError);
    else console.log('Auth Users:', users.map(u => ({ id: u.id, email: u.email })));

    // 2. List all profiles
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
    if (profileError) console.error('Profile Error:', profileError);
    else console.log('Profiles:', profiles);
}

checkUsers();
