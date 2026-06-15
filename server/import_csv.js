const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const csvContent = fs.readFileSync(path.resolve(__dirname, '../lista_squadre.csv'), 'utf8');
const lines = csvContent.split('\n').map(line => line.split(',').map(cell => cell.trim()));

async function importData() {
    console.log("Starting import...");
    
    // Clear existing data to remove dummies
    await new Promise(r => db.run("DELETE FROM performances", r));
    await new Promise(r => db.run("DELETE FROM athlete_teams", r));
    await new Promise(r => db.run("DELETE FROM athletes", r));
    await new Promise(r => db.run("DELETE FROM teams", r));
    
    const roleMap = {
        'B': 'Banda',
        'O': 'Opposto',
        'C': 'Centrale',
        'L': 'Libero',
        'P': 'Palleggio',
        'C/O': 'Centrale/Opposto',
        'B/O': 'Banda/Opposto',
        'B/C': 'Banda/Centrale',
        'B/L': 'Banda/Libero',
        'L/O': 'Libero/Opposto',
        'P/O': 'Palleggio/Opposto'
    };
    
    for (let r = 0; r < lines.length; r++) {
        const row = lines[r];
        
        for (let c = 0; c < row.length; c++) {
            if (row[c] === 'Squadra:') {
                const rawTeamName = row[c+1];
                const clubName = row[c+3] || '';
                
                const coachName = lines[r+1] && lines[r+1][c+1] ? lines[r+1][c+1] : '';
                const managerName = lines[r+1] && lines[r+1][c+3] ? lines[r+1][c+3] : '';
                
                const fullTeamName = `${clubName} ${rawTeamName}`.replace('Blu Volley PN', 'Blu Volley').trim();
                
                console.log(`Found Team: ${fullTeamName} (Coach: ${coachName}, Manager: ${managerName})`);
                
                const teamId = await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO teams (name, category, club, coach, manager) VALUES (?, ?, ?, ?, ?)`, 
                        [fullTeamName, rawTeamName, clubName.replace(' PN', ''), coachName, managerName], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });
                
                let athleteRow = r + 4;
                while (athleteRow < lines.length) {
                    const aRow = lines[athleteRow];
                    if (!aRow) break;
                    
                    const fn = aRow[c];
                    const ln = aRow[c+1];
                    const rawRole = aRow[c+2];
                    const year = aRow[c+3];
                    
                    if (!fn || fn === 'Squadra:' || fn === '') {
                        break; 
                    }
                    
                    const role = roleMap[rawRole] || rawRole;
                    const dob = year ? `${year}-01-01` : null;
                    
                    // Note: since this is an import script, we don't know the clothing sizes or jersey number, so we leave them null
                    const athleteId = await new Promise((resolve, reject) => {
                        db.run(`INSERT INTO athletes (first_name, last_name, dob, position, status) VALUES (?, ?, ?, ?, 'Tesserato')`, 
                            [fn, ln, dob, role], function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        });
                    });
                    
                    // Insert into athlete_teams junction table
                    await new Promise((resolve, reject) => {
                        db.run(`INSERT INTO athlete_teams (athlete_id, team_id, is_captain, jersey_number) VALUES (?, ?, 0, NULL)`, 
                            [athleteId, teamId], function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    console.log(`  Imported: ${fn} ${ln} - ${role} (${year})`);
                    athleteRow++;
                }
            }
        }
    }
    
    console.log("Import completed!");
}

db.serialize(() => {
    importData().then(() => {
        db.close();
    });
});
