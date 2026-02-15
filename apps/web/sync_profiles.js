const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rujaglqnlafxjbkihdmr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1amFnbHFubGFmeGpia2loZG1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzg2NSwiZXhwIjoyMDg2NDgzODY1fQ.CyMHq89C0MrHBpF3uk6bqXX7tap8-2E_6meJ7FL4kC8'
);

async function syncUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    for (const user of users) {
        console.log(`Checking user: ${user.email}`);
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

        if (!profile) {
            console.log(` Creating profile for ${user.email}...`);
            const { error: insertError } = await supabase.from('profiles').insert({
                id: user.id,
                username: user.email.split('@')[0], // Simple username generation
                status: 'offline', // Default to offline
                // associated_email: user.email // If you have this column
            });
            if (insertError) console.error('  Failed to create profile:', insertError);
            else console.log('  Profile created.');
        } else {
            console.log('  Profile exists.');
        }
    }
}

syncUsers();
