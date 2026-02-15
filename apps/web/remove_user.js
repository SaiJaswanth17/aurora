const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rujaglqnlafxjbkihdmr.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1amFnbHFubGFmeGpia2loZG1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkwNzg2NSwiZXhwIjoyMDg2NDgzODY1fQ.CyMHq89C0MrHBpF3uk6bqXX7tap8-2E_6meJ7FL4kC8'
);

async function removeUser() {
    // Find verif_tester
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return console.error('List error:', listError);

    const user = users.find(u => u.email === 'verif_user@example.com' || u.user_metadata?.username === 'verif_user');
    if (!user) {
        console.log('User verif_user not found.');
        return;
    }

    console.log(`Deleting user: ${user.id} (${user.email})`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) console.error('Delete error:', deleteError);
    else console.log('User deleted.');

    // Also try to delete from profiles if cascade didn't work (though it should)
    await supabase.from('profiles').delete().eq('id', user.id);
}

removeUser();
