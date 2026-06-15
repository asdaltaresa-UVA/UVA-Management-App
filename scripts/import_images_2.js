const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

const data = [
    {
        teamName: 'Blu Volley U13',
        category: 'U13',
        club: 'Blu Volley PN',
        coach: 'Diego Beatrice',
        manager: 'Isacco Battistella',
        athletes: [
            { first_name: 'Elisa', last_name: 'Camilot', position: '', dob_year: 2013 },
            { first_name: 'Pilar', last_name: 'Altamirano', position: '', dob_year: 2013 },
            { first_name: 'Teresa', last_name: 'Manente', position: '', dob_year: 2013 },
            { first_name: 'Martina', last_name: 'Costalonga', position: '', dob_year: 2014 },
            { first_name: 'Melissa', last_name: 'Baghdasaryan', position: '', dob_year: 2013 },
            { first_name: 'Rachele', last_name: 'Battistella', position: '', dob_year: 2013 },
            { first_name: 'Eloim Dawn Eva', last_name: 'Hubbell', position: '', dob_year: 2013 },
            { first_name: 'Emma', last_name: 'Zorzetto', position: '', dob_year: 2013 },
            { first_name: 'Giulia', last_name: 'Matteo', position: '', dob_year: 2013 },
        ]
    },
    {
        teamName: 'Blu Volley U16 S',
        category: 'U16',
        club: 'Blu Volley PN',
        coach: 'Diego Beatrice',
        manager: 'Isacco Battistella',
        athletes: [
            { first_name: 'Margherita', last_name: 'Tonus', position: '', dob_year: 2011 },
            { first_name: 'Sara', last_name: 'Pasut', position: 'C', dob_year: 2011 },
            { first_name: 'Elisa', last_name: 'Crescenzi', position: 'O', dob_year: 2011 },
            { first_name: 'Samantha', last_name: 'Crescenzi', position: 'P', dob_year: 2011 },
            { first_name: 'Elena', last_name: 'Biscontin', position: 'C', dob_year: 2011 },
            { first_name: 'Rachele', last_name: 'Murabito', position: 'B/O', dob_year: 2012, is_captain: 1 },
            { first_name: 'Charlotte Hada', last_name: 'Barrios Perez', position: '', dob_year: 2012 },
            { first_name: 'Roseta Dalila', last_name: 'Tesser', position: '', dob_year: 2012 },
            { first_name: 'Giulia', last_name: 'Mestroni', position: 'B', dob_year: 2012 },
            { first_name: 'Giorgia', last_name: 'Di Prima', position: '', dob_year: 2012 },
            { first_name: 'Caterina', last_name: 'Basso-Luca', position: 'P', dob_year: 2012 },
            { first_name: 'Bianca', last_name: 'Bressan', position: 'C', dob_year: 2012 },
            { first_name: 'Alice', last_name: 'Brunello', position: 'B', dob_year: 2012 },
            { first_name: 'Stella', last_name: 'Alzetta', position: 'L', dob_year: 2013 },
        ]
    }
];

db.serialize(() => {
    data.forEach(tData => {
        // Insert Coach
        db.run(`INSERT INTO coaches (first_name, last_name, level, club)
                SELECT ?, ?, ?, ? WHERE NOT EXISTS (
                    SELECT 1 FROM coaches WHERE first_name = ? AND last_name = ?
                )`,
        [tData.coach.split(' ')[0] || tData.coach, tData.coach.split(' ').slice(1).join(' ') || '', '', tData.club, tData.coach.split(' ')[0] || tData.coach, tData.coach.split(' ').slice(1).join(' ') || '']);

        // Insert Team
        db.run(`INSERT INTO teams (name, category, club, coach, manager)
                SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (
                    SELECT 1 FROM teams WHERE name = ? AND club = ?
                )`,
        [tData.teamName, tData.category, tData.club, tData.coach, tData.manager, tData.teamName, tData.club], function(err) {
            
            // Get Team ID
            db.get(`SELECT id FROM teams WHERE name = ? AND club = ?`, [tData.teamName, tData.club], (err, teamRow) => {
                if (!teamRow) return;
                const teamId = teamRow.id;

                tData.athletes.forEach(aData => {
                    const dobStr = aData.dob_year ? `${aData.dob_year}-01-01` : null;
                    
                    // Insert Athlete if not exists
                    db.run(`INSERT INTO athletes (first_name, last_name, position, dob)
                            SELECT ?, ?, ?, ? WHERE NOT EXISTS (
                                SELECT 1 FROM athletes WHERE first_name = ? AND last_name = ?
                            )`,
                    [aData.first_name, aData.last_name, aData.position, dobStr, aData.first_name, aData.last_name], function(err) {
                        
                        db.get(`SELECT id FROM athletes WHERE first_name = ? AND last_name = ?`, [aData.first_name, aData.last_name], (err, athRow) => {
                            if (!athRow) return;
                            const athId = athRow.id;
                            
                            // Link to team
                            db.run(`INSERT INTO athlete_teams (athlete_id, team_id, is_captain)
                                    SELECT ?, ?, ? WHERE NOT EXISTS (
                                        SELECT 1 FROM athlete_teams WHERE athlete_id = ? AND team_id = ?
                                    )`,
                            [athId, teamId, aData.is_captain || 0, athId, teamId]);
                        });
                    });
                });
            });
        });
    });
});

console.log("Import script 2 execution completed.");
