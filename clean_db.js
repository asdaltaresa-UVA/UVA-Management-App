const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.sqlite');

db.serialize(() => {
    // Rename U16 S to U15
    db.run("UPDATE teams SET name = 'Blu Volley U15', category = 'U15' WHERE name LIKE '%U16 S%'");
    
    // Clean duplicate athlete_teams (keep only one per athlete/team combination)
    db.run(`
        DELETE FROM athlete_teams 
        WHERE rowid NOT IN (
            SELECT MIN(rowid) 
            FROM athlete_teams 
            GROUP BY athlete_id, team_id
        )
    `);

    // We should also check for duplicate teams themselves
    db.all("SELECT id, name, category, club FROM teams", [], (err, rows) => {
        if (err) console.error(err);
        const seen = {};
        rows.forEach(r => {
            const key = r.name + '-' + r.club;
            if (seen[key]) {
                console.log("Duplicate team found:", r);
                // move athletes to the original team and delete duplicate
                db.run("UPDATE athlete_teams SET team_id = ? WHERE team_id = ?", [seen[key], r.id]);
                db.run("DELETE FROM teams WHERE id = ?", [r.id]);
            } else {
                seen[key] = r.id;
            }
        });
        console.log("Cleanup complete!");
    });
});
