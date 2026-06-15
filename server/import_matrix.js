const fs = require('fs');
const db = require('./database');

const fileContent = fs.readFileSync('./data.csv', 'utf8');
const lines = fileContent.split('\n');

// Find where data starts
let startIdx = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Squadra:')) {
        startIdx = i;
        break;
    }
}

// In the CSV, we have multiple horizontal blocks. 
// A block starts with "Squadra:". We scan row by row to find all "Squadra:" definitions.
let teamsToProcess = [];

for (let row = startIdx; row < lines.length; row++) {
    const line = lines[row];
    if (!line) continue;
    
    // Check if line contains "Squadra:"
    if (line.includes('Squadra:')) {
        const cols = line.split(',');
        for (let col = 0; col < cols.length; col++) {
            if (cols[col] === 'Squadra:') {
                // We found a team block
                const teamName = cols[col+1];
                const clubName = cols[col+3];
                if (teamName || clubName) {
                    teamsToProcess.push({
                        name: teamName || 'N/D',
                        club: clubName || 'N/D',
                        startRow: row,
                        colIndex: col
                    });
                }
            }
        }
    }
}

db.serialize(() => {
    // Clear existing teams and athletes for a fresh start
    db.run("DELETE FROM athletes");
    db.run("DELETE FROM teams");
    db.run("DELETE FROM athlete_teams");
    db.run("DELETE FROM sqlite_sequence WHERE name='athletes'");
    db.run("DELETE FROM sqlite_sequence WHERE name='teams'");

    const stmtTeam = db.prepare("INSERT INTO teams (name, category, club, coach, manager) VALUES (?, ?, ?, ?, ?)");
    const stmtAthlete = db.prepare("INSERT INTO athletes (first_name, last_name, position, dob) VALUES (?, ?, ?, ?)");
    const stmtLink = db.prepare("INSERT INTO athlete_teams (athlete_id, team_id, is_captain) VALUES (?, ?, ?)");

    let teamIdCounter = 1;
    let athleteIdCounter = 1;

    for (let t of teamsToProcess) {
        // Find coach and manager
        let coach = '';
        let manager = '';
        const coachLine = lines[t.startRow + 1] ? lines[t.startRow + 1].split(',') : [];
        if (coachLine[t.colIndex] === 'Allenatore:') {
            coach = coachLine[t.colIndex+1];
            manager = coachLine[t.colIndex+3];
        }

        let category = t.name;
        if (!t.name || t.name === 'N/D') category = 'Misto';
        
        let dbTeamName = t.club + ' ' + (t.name === 'N/D' ? '' : t.name);

        stmtTeam.run(dbTeamName, category, t.club, coach, manager);
        const currentTeamId = teamIdCounter++;

        // Find athletes
        // Header is at startRow + 3
        let dataRow = t.startRow + 4;
        while (dataRow < lines.length) {
            const line = lines[dataRow];
            if (!line) { dataRow++; continue; }
            const cols = line.split(',');
            
            // If we hit another Squadra or Allenatore, break
            if (cols[t.colIndex] === 'Squadra:' || cols[t.colIndex] === 'Allenatore:') {
                break;
            }

            const nome = cols[t.colIndex];
            const cognome = cols[t.colIndex+1];
            const ruolo = cols[t.colIndex+2];
            const anno = cols[t.colIndex+3];

            if (nome && nome.trim() && nome !== 'Nome' && nome !== 'NOME') {
                let dob = null;
                if (anno && anno.trim()) {
                    dob = anno.trim() + '-01-01'; // Default to Jan 1st of that year
                }
                
                stmtAthlete.run(nome.trim(), cognome ? cognome.trim() : '', ruolo ? ruolo.trim() : '', dob);
                stmtLink.run(athleteIdCounter, currentTeamId, 0);
                athleteIdCounter++;
            }
            
            dataRow++;
        }
    }

    stmtTeam.finalize();
    stmtAthlete.finalize();
    stmtLink.finalize();
    console.log("Import completed successfully!");
});
