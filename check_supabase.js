import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qubqrhmuxegnuzkzjqiq.supabase.co';
const supabaseAnonKey = 'sb_publishable_Q66Xf65opB-CTd0cAc_38Q_IC0sOj2f';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('Checking Supabase data...');
    const tables = ['despesas', 'producao', 'vendas', 'clientes'];

    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Error checking table ${table}:`, error.message);
        } else {
            console.log(`Table ${table}: ${count} rows`);

            // Fetch one row to see if it exists
            const { data: rows } = await supabase.from(table).select('*').limit(1);
            if (rows && rows.length > 0) {
                console.log(`  Sample data found in ${table}`);
            } else {
                console.log(`  No data found in ${table}`);
            }
        }
    }
}

checkData();
