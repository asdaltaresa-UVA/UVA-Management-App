const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

const data = [
    {
        teamName: 'Alta Resa U12',
        category: 'U12',
        club: 'Alta Resa',
        coach: 'Danila Turchet',
        manager: 'Isacco Battistella',
        athletes: [
            { first_name: 'Shannon', last_name: 'Doimo', position: '', dob_year: 2014 },
            { first_name: 'Gaia', last_name: 'Zorzetto', position: '', dob_year: 2014 },
            { first_name: 'Eleonora', last_name: 'Zanus', position: '', dob_year: 2014 },
            { first_name: 'Giulia', last_name: 'Boltin', position: '', dob_year: 2014 },
            { first_name: 'Matteo', last_name: 'Brancaleone', position: '', dob_year: 2015 },
            { first_name: 'Beatrice', last_name: 'Albertini', position: '', dob_year: 2015 },
            { first_name: 'Elena', last_name: 'Basso-Luca', position: '', dob_year: 2014 },
            { first_name: 'Eilyn', last_name: 'Cobaj', position: '', dob_year: 2014 },
            { first_name: 'Catalina', last_name: 'Martinez', position: '', dob_year: 2014 },
            { first_name: 'Chloe', last_name: 'Mengolli', position: '', dob_year: 2014 },
            { first_name: 'Giulia', last_name: 'Soangher', position: '', dob_year: 2014 },
        ]
    },
    {
        teamName: 'Alta Resa S3',
        category: 'S3',
        club: 'Alta Resa',
        coach: 'Barbara CF',
        manager: 'Isacco Battistella',
        athletes: [
            { first_name: 'Mattia', last_name: 'Marson', position: '', dob_year: 2012 },
            { first_name: 'Celeste', last_name: 'Roveredo', position: '', dob_year: 2014 },
            { first_name: 'STEJSI', last_name: 'DEMIRI', position: '', dob_year: 2014 },
            { first_name: 'Bianca Fortunata', last_name: 'Gaspardo', position: '', dob_year: 2014 },
            { first_name: 'Serena', last_name: 'Lazri', position: '', dob_year: 2014 },
            { first_name: 'Esmeralda', last_name: 'Gaspar Benhafa', position: '', dob_year: 2015 },
            { first_name: 'Aisha', last_name: 'Sene', position: '', dob_year: 2015 },
            { first_name: 'Sveva', last_name: 'Vendrame', position: '', dob_year: 2015 },
            { first_name: 'Stella', last_name: 'Ricci', position: '', dob_year: 2015 },
            { first_name: 'Giulia Maria', last_name: 'Soangher', position: '', dob_year: 2015 },
            { first_name: 'Catalina', last_name: 'Martinez de Diego', position: '', dob_year: 2015 },
            { first_name: 'Gaia', last_name: 'Zorzetto', position: '', dob_year: 2015 },
            { first_name: 'Amira', last_name: 'El khiari', position: '', dob_year: 2015 },
            { first_name: 'Amira', last_name: 'Khelifat', position: '', dob_year: 2015 },
            { first_name: 'Flavia', last_name: 'Di Bernardo', position: '', dob_year: 2016 },
            { first_name: 'Emily', last_name: 'Cimolino', position: '', dob_year: 2016 },
            { first_name: 'Alice', last_name: 'Dorligo', position: '', dob_year: 2016 },
            { first_name: 'Mathias', last_name: 'Boron', position: '', dob_year: 2016 },
            { first_name: 'Aylin', last_name: 'Mehmeti', position: '', dob_year: 2016 },
            { first_name: 'Evelyn', last_name: 'Barsan', position: '', dob_year: 2016 },
            { first_name: 'MARIAGIULIA', last_name: 'CIRANDA', position: '', dob_year: 2016 },
            { first_name: 'Emily', last_name: 'Hu', position: '', dob_year: 2016 },
            { first_name: 'ANNA', last_name: 'BAILOT ERODI', position: '', dob_year: 2017 },
            { first_name: 'Adele Carola', last_name: 'De Bianchi', position: '', dob_year: 2017 },
            { first_name: 'Treasure', last_name: 'Moretti', position: '', dob_year: 2017 },
            { first_name: 'Esmeralda', last_name: 'Paludet', position: '', dob_year: 2017 },
            { first_name: 'MARIA ALLEGRA', last_name: 'DIAN', position: '', dob_year: 2017 },
            { first_name: 'Sveva', last_name: 'Carniel', position: '', dob_year: 2017 },
            { first_name: 'Emma', last_name: 'Castellarin', position: '', dob_year: 2017 },
        ]
    },
    {
        teamName: 'Alta Resa 1DF',
        category: '1DF',
        club: 'Alta Resa',
        coach: 'Claudio Bertoncin',
        manager: 'Andrea Ros',
        athletes: [
            { first_name: 'Elisa', last_name: 'Barro', position: 'B', dob_year: 1994 },
            { first_name: 'Jasmine', last_name: 'Maronese', position: 'C/O', dob_year: 1998, is_captain: 1 },
            { first_name: 'Ilaria', last_name: 'Bianchin', position: 'B', dob_year: 1998 },
            { first_name: 'Elisabetta', last_name: 'Borlina', position: 'C', dob_year: 1998 },
            { first_name: 'Laura', last_name: 'Savoia', position: 'L', dob_year: 1998 },
            { first_name: 'Eleonora', last_name: 'Felletti', position: 'B', dob_year: 1999 },
            { first_name: 'Camilla', last_name: 'Russo', position: 'C', dob_year: 2000 },
            { first_name: 'Valentina', last_name: 'Malerba', position: 'P', dob_year: 2000 },
            { first_name: 'Serena', last_name: 'Cover', position: 'O', dob_year: 2000 },
            { first_name: 'Silvia', last_name: 'Gruarin', position: 'B', dob_year: 2001 },
            { first_name: 'Gaia', last_name: 'Pagura', position: 'B/O', dob_year: 2002 },
            { first_name: 'Giada', last_name: 'Carlet', position: 'P', dob_year: 2005 },
            { first_name: 'Emma', last_name: 'Pagura', position: 'L', dob_year: 2006 },
            { first_name: 'Enrica', last_name: 'Scandolo Di Maio', position: 'C', dob_year: 2006 },
            { first_name: 'Elena', last_name: 'Giotta', position: 'C', dob_year: 2008 },
            { first_name: 'Gaia', last_name: 'De Franceschi', position: 'O/B', dob_year: 2009 },
            { first_name: 'Sara', last_name: 'Villalta', position: 'L/O', dob_year: 2001 },
        ]
    },
    {
        teamName: 'Alta Resa 2DF',
        category: '2DF',
        club: 'Alta Resa',
        coach: 'Max Cesarin',
        manager: 'Andrea Ros',
        athletes: [
            { first_name: 'Sara', last_name: 'Venerus', position: 'B', dob_year: 2001 },
            { first_name: 'Nicole', last_name: 'Sturzi', position: 'L', dob_year: 2004, is_captain: 1 },
            { first_name: 'Eleonora', last_name: 'Taiariol', position: 'O', dob_year: 2006 },
            { first_name: 'Emma', last_name: 'Missio', position: 'C', dob_year: 2007 },
            { first_name: 'Gioia', last_name: 'Fioretti', position: 'L', dob_year: 2007 },
            { first_name: 'Lara', last_name: 'Dal Bon', position: 'B', dob_year: 2007 },
            { first_name: 'Giorgia', last_name: 'Stramare', position: 'B', dob_year: 2007 },
            { first_name: 'Benedetta', last_name: 'Bachetta', position: 'B', dob_year: 2008 },
            { first_name: 'Beatrice', last_name: 'Bachetta', position: 'P', dob_year: 2008 },
            { first_name: 'Margherita', last_name: 'Braccini', position: 'P', dob_year: 2008 },
            { first_name: 'Martina', last_name: 'Martinel', position: 'B', dob_year: 2008 },
            { first_name: 'Nicole', last_name: 'Parisini', position: 'C', dob_year: 2008 },
            { first_name: 'Asia', last_name: 'Mottin', position: 'B', dob_year: 2008 },
            { first_name: 'Ludovica', last_name: 'Riem', position: 'O', dob_year: 2008 },
            { first_name: 'Bich Ngoc', last_name: 'D\'Andrea', position: 'L', dob_year: 2009 },
            { first_name: 'Cecilia', last_name: 'Fagnini', position: 'B/L', dob_year: 2010 },
            { first_name: 'Elisa', last_name: 'Cerabolini', position: 'C', dob_year: 2008 },
            { first_name: 'Djamila Anna', last_name: 'Chezzi', position: 'P', dob_year: 2010 },
        ]
    },
    {
        teamName: 'Blu Volley 2DF',
        category: '2DF',
        club: 'Blu Volley PN',
        coach: 'Isa Da Ros',
        manager: '',
        athletes: [
            { first_name: 'Martina', last_name: 'Assunta', position: 'B', dob_year: 2008 },
            { first_name: 'Marta', last_name: 'Di Paolo', position: '', dob_year: 2009 },
            { first_name: 'Olimpia', last_name: 'Campagnolo', position: '', dob_year: 2009 },
            { first_name: 'Nicole', last_name: 'Sturiolo', position: 'O', dob_year: 2009 },
            { first_name: 'Ginevra', last_name: 'Sautto', position: 'L', dob_year: 2010 },
            { first_name: 'Giulia', last_name: 'Toppan', position: '', dob_year: 2010 },
            { first_name: 'Victoria', last_name: 'Brandolin', position: '', dob_year: 2010 },
            { first_name: 'Marlene', last_name: 'Brandolin', position: 'B/L', dob_year: 2010 },
            { first_name: 'Anna', last_name: 'Sperotto', position: 'P', dob_year: 2010 },
            { first_name: 'Rachele', last_name: 'Perissinotti', position: 'C', dob_year: 2009 },
            { first_name: 'Asia', last_name: 'Buso', position: 'O', dob_year: 2009, is_captain: 1 },
            { first_name: 'Alessandra', last_name: 'Sciarpa', position: 'P', dob_year: 2009 },
            { first_name: 'Sharon', last_name: 'Angels Santana', position: 'L', dob_year: 2009 },
            { first_name: 'Ormela', last_name: 'Merja', position: 'B', dob_year: 2010 },
            { first_name: 'Martina', last_name: 'Conti', position: 'C', dob_year: 2005 },
            { first_name: 'Victoria', last_name: 'Lugaric', position: 'C', dob_year: 2010 },
            { first_name: 'Alessia', last_name: 'Delle Vedove', position: '', dob_year: 2009 },
        ]
    }
];

db.serialize(() => {
    // We will insert missing teams, coaches, and athletes.
    // If athlete already exists (by name and dob), we just ensure they are in the team.
    
    data.forEach(tData => {
        // Insert Coach
        db.run(`INSERT INTO coaches (first_name, last_name, level)
                SELECT ?, ?, ? WHERE NOT EXISTS (
                    SELECT 1 FROM coaches WHERE first_name = ? AND last_name = ?
                )`,
        [tData.coach.split(' ')[0] || tData.coach, tData.coach.split(' ').slice(1).join(' ') || '', '', tData.coach.split(' ')[0] || tData.coach, tData.coach.split(' ').slice(1).join(' ') || '']);

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

console.log("Import script execution completed.");
