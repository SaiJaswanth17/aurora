const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://rujaglqnlafxjbkihdmr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1amFnbHFubGFmeGpia2loZG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDc4NjUsImV4cCI6MjA4NjQ4Mzg2NX0.1Ln8F_ajheDp6umbjFgQUws8YzwDKk__zJZojJsqqWw'
);

async function listUsers() {
    const { data, error } = await supabase.from('profiles').select('username, status');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Users:', JSON.stringify(data, null, 2));
    }
}

listUsers();
