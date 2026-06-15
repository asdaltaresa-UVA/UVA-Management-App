const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }
    console.log('Connected to the SQLite database for seeding.');
    seedData();
});

function seedData() {
    db.serialize(() => {
        // Teams
        db.run("INSERT INTO teams (name, category, club) VALUES ('Alta Resa 1 Div', '1° Divisione F', 'A.S.D. Alta Resa')");
        db.run("INSERT INTO teams (name, category, club) VALUES ('Blu Volley 1 Div', '1° Divisione M', 'A.S.D. Blu Volley Pordenone')");
        db.run("INSERT INTO teams (name, category, club) VALUES ('DXT U18', 'Under 18 F', 'DXT Volley')");

        // Athletes
        const athletes = [
            { fn: 'Giulia', ln: 'Rossi', dob: '2005-04-12', team: 1, pos: 'Schiacciatore', h: 175, w: 65, r: 220, sr: 285, br: 270 },
            { fn: 'Martina', ln: 'Bianchi', dob: '2006-08-22', team: 1, pos: 'Centrale', h: 182, w: 70, r: 235, sr: 300, br: 285 },
            { fn: 'Chiara', ln: 'Verdi', dob: '2005-11-05', team: 1, pos: 'Palleggiatore', h: 168, w: 60, r: 215, sr: 260, br: 250 },
            { fn: 'Marco', ln: 'Neri', dob: '2004-02-15', team: 2, pos: 'Opposto', h: 188, w: 82, r: 240, sr: 320, br: 305 },
            { fn: 'Sara', ln: 'Gialli', dob: '2008-09-30', team: 3, pos: 'Libero', h: 160, w: 55, r: 205, sr: 245, br: 235 }
        ];

        const stmt = db.prepare(`INSERT INTO athletes 
            (first_name, last_name, dob, team_id, position, status, height, weight, reach, spike_reach, block_reach) 
            VALUES (?, ?, ?, ?, ?, 'Tesserato', ?, ?, ?, ?, ?)`);

        athletes.forEach(a => {
            stmt.run([a.fn, a.ln, a.dob, a.team, a.pos, a.h, a.w, a.r, a.sr, a.br]);
        });
        stmt.finalize();

        // Performances
        const perfs = [
            { a_id: 1, date: '2026-05-01', match: 'Alta Resa vs Chions', pts: 12, err: 3, rating: 7.5 },
            { a_id: 1, date: '2026-05-08', match: 'Azzanese vs Alta Resa', pts: 18, err: 2, rating: 8.5 },
            { a_id: 2, date: '2026-05-08', match: 'Azzanese vs Alta Resa', pts: 9, err: 1, rating: 7.0 }
        ];

        const stmtPerf = db.prepare(`INSERT INTO performances 
            (athlete_id, date, match_name, attack_points, attack_errors, rating) 
            VALUES (?, ?, ?, ?, ?, ?)`);

        perfs.forEach(p => {
            stmtPerf.run([p.a_id, p.date, p.match, p.pts, p.err, p.rating]);
        });
        stmtPerf.finalize();

        // News
        db.run("INSERT INTO news (user_id, title, content, is_external, url) VALUES (1, 'Vittoria in trasferta!', 'Grandissima prestazione delle ragazze della 1° divisione che vincono 3-1 fuori casa.', 0, null)");
        db.run("INSERT INTO news (user_id, title, content, is_external, url) VALUES (1, 'Post Instagram: I nuovi arrivi', 'Guarda le foto del nuovo roster sul nostro profilo Instagram.', 1, 'https://instagram.com')");

        console.log('Dummy data seeded successfully!');
    });
}
