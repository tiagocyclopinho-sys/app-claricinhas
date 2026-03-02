import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qubqrhmuxegnuzkzjqiq.supabase.co';
const supabaseAnonKey = 'sb_publishable_Q66Xf65opB-CTd0cAc_38Q_IC0sOj2f';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('Checking Supabase data...');
    const tables = ['despesas', 'producao', 'vendas', 'clientes'];

    for (const table of tables) {
        try {
            console.log(`Searching table: ${table}...`);
            const start = Date.now();
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: false })
                .limit(10); // Limit during diagnosis to see if basic connectivity works
            const end = Date.now();

            if (error) {
                console.error(`Error checking table ${table} (${end - start}ms):`, error.message, error.details || '', error.hint || '');
            } else {
                console.log(`Table ${table}: ${count} rows (Query took ${end - start}ms)`);
            }
        } catch (e) {
            console.error(`Exception checking table ${table}:`, e.message);
        }
    }
}

checkData();
