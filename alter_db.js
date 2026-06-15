const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

async function run() {
    // 1. Alter SQLite
    const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    db.run("ALTER TABLE athletes ADD COLUMN dominant_arm TEXT DEFAULT 'Destro'", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("SQLite error:", err);
        } else {
            console.log("SQLite: dominant_arm added or already exists.");
        }
    });

    // 2. Alter Postgres (Neon)
    const neonUrl = "postgresql://neondb_owner:npg_IywV3dMr2Hta@ep-dry-darkness-asxg7m32.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    const pool = new Pool({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });

    try {
        await pool.query("ALTER TABLE athletes ADD COLUMN dominant_arm TEXT DEFAULT 'Destro'");
        console.log("Postgres: dominant_arm added.");
    } catch (e) {
        if (!e.message.includes("already exists")) {
            console.error("Postgres error:", e);
        } else {
            console.log("Postgres: dominant_arm already exists.");
        }
    }

    process.exit(0);
}

run();
