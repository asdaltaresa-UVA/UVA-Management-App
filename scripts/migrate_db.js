const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add status to athletes
    db.run("ALTER TABLE athletes ADD COLUMN status TEXT DEFAULT 'active'", (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error("Error adding status to athletes", err);
        } else {
            console.log("Added status to athletes (or already existed)");
        }
    });

    // Add club to coaches
    db.run("ALTER TABLE coaches ADD COLUMN club TEXT", (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error("Error adding club to coaches", err);
        } else {
            console.log("Added club to coaches (or already existed)");
        }
    });

    // Add season to performances
    db.run("ALTER TABLE performances ADD COLUMN season TEXT", (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error("Error adding season to performances", err);
        } else {
            console.log("Added season to performances (or already existed)");
        }
    });

    // Set Isa Da Ros to Blu Volley PN
    db.run("UPDATE coaches SET club = 'Blu Volley PN' WHERE first_name = 'Isa' AND last_name = 'Da Ros'");
    // Others to Alta Resa for now
    db.run("UPDATE coaches SET club = 'Alta Resa' WHERE club IS NULL AND first_name != 'Isa'");
});

console.log("Migration executed");
