const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'server', 'database.sqlite'));

const tables = [
    'users',
    'teams',
    'athletes',
    'athlete_teams',
    'news',
    'dynamic_fields',
    'performances',
    'coaches',
    'scouting_athletes'
];

let sqlDump = '-- Migration Dump for PostgreSQL\n\n';

function escapeString(str) {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    return "'" + str.toString().replace(/'/g, "''") + "'";
}

let completed = 0;

db.serialize(() => {
    tables.forEach(table => {
        db.all(`SELECT * FROM ${table}`, (err, rows) => {
            if (err) {
                console.error('Error reading table', table, err);
                return;
            }
            if (rows && rows.length > 0) {
                sqlDump += `-- Data for ${table}\n`;
                rows.forEach(row => {
                    const keys = Object.keys(row);
                    const values = keys.map(k => {
                        let val = row[k];
                        if (table === 'athlete_teams' && k === 'is_captain') {
                            val = val ? 'true' : 'false';
                            return val;
                        }
                        if (table === 'news' && k === 'is_external') {
                            val = val ? 'true' : 'false';
                            return val;
                        }
                        return escapeString(val);
                    });
                    // For Postgres, we should ON CONFLICT DO NOTHING for id or just simple inserts?
                    // Actually, if we are migrating to an empty DB (except users maybe), simple INSERT is fine.
                    // For users, it might conflict with the seeded ones, so we use ON CONFLICT DO NOTHING.
                    // But standard Postgres doesn't allow ON CONFLICT without unique keys.
                    // Let's just do standard INSERT. If users fail, it's fine.
                    // To be safe against ID conflicts, we insert explicit IDs and then reset the sequence!
                    sqlDump += `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')});\n`;
                });
                
                // Reset sequence for SERIAL columns
                if (table !== 'athlete_teams') { // athlete_teams has no 'id' SERIAL column
                    sqlDump += `SELECT setval('${table}_id_seq', (SELECT MAX(id) FROM ${table}));\n`;
                }
                sqlDump += '\n';
            }
            
            completed++;
            if (completed === tables.length) {
                fs.writeFileSync(path.join(__dirname, 'migration.sql'), sqlDump);
                console.log('Migration SQL generated successfully at migration.sql');
            }
        });
    });
});
