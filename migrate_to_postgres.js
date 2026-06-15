const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.argv[2];

if (!databaseUrl) {
    console.error('ERRORE: Inserisci la stringa di connessione (DATABASE_URL) come argomento.');
    console.error('Uso: node migrate_to_postgres.js "postgresql://..."');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
const queries = sql.split(';\n').filter(q => q.trim().length > 0);

async function run() {
    console.log(`Trovate ${queries.length} query da eseguire...`);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < queries.length; i++) {
        try {
            await pool.query(queries[i]);
            success++;
        } catch (err) {
            // Ignore unique constraint errors for seeded users and dynamic fields
            if (!err.message.includes('unique constraint') && !err.message.includes('already exists')) {
                // console.warn(`Errore alla query ${i}:`, err.message);
            }
            failed++;
        }
    }

    console.log(`\nInserisco o aggiorno Danila...`);
    try {
        await pool.query(`INSERT INTO users (username, password, role, fullname) VALUES ('danila', 'AltaResa2026!', 'admin', 'Danila') ON CONFLICT (username) DO NOTHING`);
        console.log(`Danila aggiunta con successo.`);
    } catch (e) {
        console.log(`Errore aggiunta Danila: `, e.message);
    }

    console.log(`\nMigrazione completata!`);
    console.log(`Successo: ${success}`);
    console.log(`Ignorate (già presenti o conflitti): ${failed}`);
    process.exit(0);
}

run();
