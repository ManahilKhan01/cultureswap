
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
    if (error) console.error(error);
    else console.log('Tables:', data.map(t => t.table_name));
}

checkTables();
