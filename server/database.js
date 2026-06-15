const path = require('path');

const isPg = !!process.env.DATABASE_URL;
let db;

if (isPg) {
    const { Pool } = require('pg');
    console.log('Connecting to PostgreSQL database...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    function convertSql(sql) {
        let i = 1;
        return sql.replace(/\?/g, () => `$${i++}`);
    }

    db = {
        all: (sql, params, callback) => {
            if (typeof params === 'function') { callback = params; params = []; }
            pool.query(convertSql(sql), params, (err, res) => {
                if (err) return callback(err, null);
                callback(null, res.rows);
            });
        },
        get: (sql, params, callback) => {
            if (typeof params === 'function') { callback = params; params = []; }
            pool.query(convertSql(sql), params, (err, res) => {
                if (err) return callback(err, null);
                callback(null, res.rows[0]);
            });
        },
        run: (sql, params, callback) => {
            if (typeof params === 'function') { callback = params; params = []; }
            
            let finalSql = convertSql(sql);
            if (finalSql.trim().toUpperCase().startsWith('INSERT') && !finalSql.toUpperCase().includes('RETURNING')) {
                finalSql += ' RETURNING id';
            }

            pool.query(finalSql, params, (err, res) => {
                if (err) {
                    if (callback) callback.call({}, err);
                    return;
                }
                const context = {
                    changes: res.rowCount,
                    lastID: (res.rows && res.rows[0] && res.rows[0].id) ? res.rows[0].id : undefined
                };
                if (callback) callback.call(context, null);
            });
        },
        prepare: (sql) => {
            return {
                run: (...args) => {
                    let callback = null;
                    if (typeof args[args.length - 1] === 'function') {
                        callback = args.pop();
                    }
                    db.run(sql, args, callback);
                },
                finalize: () => {}
            };
        },
        serialize: (cb) => cb()
    };

    initDb();

} else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, 'database.sqlite');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening SQLite database', err.message);
        } else {
            console.log('Connected to the SQLite database.');
            initDb();
        }
    });
}

function initDb() {
    const serialStr = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id ${serialStr},
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            fullname TEXT
        )`);

        // Seed users
        const seedUsers = [
            { username: 'isacco', password: 'AltaResa2026!', fullname: 'Isacco' },
            { username: 'andrea', password: 'AltaResa2026!', fullname: 'Andrea' },
            { username: 'marco', password: 'AltaResa2026!', fullname: 'Marco' },
            { username: 'valentino', password: 'AltaResa2026!', fullname: 'Valentino' },
            { username: 'danila', password: 'AltaResa2026!', fullname: 'Danila' }
        ];
        
        let insertUser;
        if (isPg) {
            insertUser = db.prepare(`INSERT INTO users (username, password, fullname, role) VALUES (?, ?, ?, 'admin') ON CONFLICT (username) DO NOTHING`);
        } else {
            insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, fullname, role) VALUES (?, ?, ?, 'admin')`);
        }
        
        seedUsers.forEach(u => {
            insertUser.run(u.username, u.password, u.fullname);
        });
        insertUser.finalize();

        // Teams Table
        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id ${serialStr},
            name TEXT NOT NULL,
            category TEXT,
            club TEXT,
            coach TEXT,
            manager TEXT,
            starting_six TEXT
        )`);

        // Athletes Table
        db.run(`CREATE TABLE IF NOT EXISTS athletes (
            id ${serialStr},
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            dob DATE,
            gender TEXT DEFAULT 'F',
            position TEXT,
            status TEXT DEFAULT 'Tesserato',
            photo_url TEXT,
            height INTEGER,
            weight INTEGER,
            reach INTEGER,
            spike_reach INTEGER,
            block_reach INTEGER,
            notes TEXT,
            size_shirt TEXT,
            size_pants TEXT,
            size_hoodie TEXT,
            size_warmup TEXT,
            technical_skills TEXT,
            dominant_arm TEXT DEFAULT 'Destro'
        )`);

        // Athlete-Teams Junction Table
        db.run(`CREATE TABLE IF NOT EXISTS athlete_teams (
            athlete_id INTEGER,
            team_id INTEGER,
            is_captain BOOLEAN DEFAULT false,
            jersey_number INTEGER,
            PRIMARY KEY (athlete_id, team_id),
            FOREIGN KEY (athlete_id) REFERENCES athletes (id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
        )`);

        // Coaches Table
        db.run(`CREATE TABLE IF NOT EXISTS coaches (
            id ${serialStr},
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            level TEXT,
            photo_url TEXT
        )`);

        // Coach-Teams Junction Table
        db.run(`CREATE TABLE IF NOT EXISTS coach_teams (
            coach_id INTEGER,
            team_id INTEGER,
            role TEXT DEFAULT 'Allenatore',
            PRIMARY KEY (coach_id, team_id),
            FOREIGN KEY (coach_id) REFERENCES coaches (id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
        )`);

        // Performance Records Table
        db.run(`CREATE TABLE IF NOT EXISTS performances (
            id ${serialStr},
            athlete_id INTEGER,
            date TEXT,
            match_name TEXT,
            aces INTEGER DEFAULT 0,
            serve_errors INTEGER DEFAULT 0,
            reception_perfect INTEGER DEFAULT 0,
            reception_errors INTEGER DEFAULT 0,
            attack_points INTEGER DEFAULT 0,
            attack_errors INTEGER DEFAULT 0,
            blocks INTEGER DEFAULT 0,
            rating REAL,
            notes TEXT,
            FOREIGN KEY (athlete_id) REFERENCES athletes (id)
        )`);

        // News Table
        db.run(`CREATE TABLE IF NOT EXISTS news (
            id ${serialStr},
            user_id INTEGER,
            title TEXT,
            content TEXT,
            is_external BOOLEAN DEFAULT false,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Dynamic Fields Metadata
        db.run(`CREATE TABLE IF NOT EXISTS dynamic_fields (
            id ${serialStr},
            field_name TEXT UNIQUE,
            field_label TEXT,
            field_type TEXT
        )`);

        // Scouting Athletes Table
        db.run(`CREATE TABLE IF NOT EXISTS scouting_athletes (
            id ${serialStr},
            first_name TEXT,
            last_name TEXT,
            dob_year INTEGER,
            position TEXT,
            current_club TEXT,
            owned_club TEXT,
            height REAL,
            weight REAL,
            reach REAL,
            spike_reach REAL,
            block_reach REAL,
            technical_skills TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed Admin User if not exists
        db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
            if (!row) {
                // Password should be hashed in production, keeping it simple for now
                db.run("INSERT INTO users (username, password, role, fullname) VALUES ('admin', 'admin', 'admin', 'Amministratore di Sistema')");
            }
        });
        
        // Seed default dynamic fields if empty
        db.get("SELECT count(*) as count FROM dynamic_fields", (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO dynamic_fields (field_name, field_label, field_type) VALUES ('height', 'Altezza (cm)', 'number')");
                db.run("INSERT INTO dynamic_fields (field_name, field_label, field_type) VALUES ('weight', 'Peso (kg)', 'number')");
                db.run("INSERT INTO dynamic_fields (field_name, field_label, field_type) VALUES ('reach', 'Reach (cm)', 'number')");
                db.run("INSERT INTO dynamic_fields (field_name, field_label, field_type) VALUES ('spike_reach', 'Spike Reach (cm)', 'number')");
                db.run("INSERT INTO dynamic_fields (field_name, field_label, field_type) VALUES ('block_reach', 'Block Reach (cm)', 'number')");
            }
        });
    });
}

module.exports = db;
