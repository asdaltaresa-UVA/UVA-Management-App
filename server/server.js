const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'dxt_volley_secret_key'; // In production, use environment variables

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- Configure Multer for Image Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Middleware for Auth ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Credenziali non valide' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname } });
    });
});

// --- Athletes Routes ---
app.get('/api/athletes', authenticateToken, (req, res) => {
    db.all("SELECT * FROM athletes", [], (err, athletes) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT at.athlete_id, at.team_id, at.is_captain, at.jersey_number, t.name as team_name, t.club 
                FROM athlete_teams at 
                JOIN teams t ON at.team_id = t.id`, [], (err, teams) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Map teams to athletes
            athletes.forEach(a => {
                a.teams = teams.filter(t => t.athlete_id === a.id);
            });
            res.json(athletes);
        });
    });
});

app.get('/api/athletes/:id', authenticateToken, (req, res) => {
    db.get("SELECT * FROM athletes WHERE id = ?", [req.params.id], (err, athlete) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
        
        db.all(`SELECT at.team_id, at.is_captain, at.jersey_number, t.name as team_name, t.club 
                FROM athlete_teams at 
                JOIN teams t ON at.team_id = t.id 
                WHERE at.athlete_id = ?`, [req.params.id], (err, teams) => {
            if (err) return res.status(500).json({ error: err.message });
            athlete.teams = teams;
            
            // Also fetch performances
            db.all(`SELECT * FROM performances WHERE athlete_id = ? ORDER BY date DESC`, [req.params.id], (err, perfs) => {
                if (err) return res.status(500).json({ error: err.message });
                athlete.performances = perfs;
                res.json(athlete);
            });
        });
    });
});

app.post('/api/athletes', authenticateToken, upload.single('photo'), (req, res) => {
    const data = req.body;
    const photoUrl = req.file ? `/images/${req.file.filename}` : '';
    
    // Parse teams array. It should be a stringified JSON array from frontend
    let teams = [];
    try {
        if (data.teams) teams = JSON.parse(data.teams);
    } catch(e) {}
    
    const h = data.height === '' ? null : data.height;
    const w = data.weight === '' ? null : data.weight;
    const r = data.reach === '' ? null : data.reach;
    const sr = data.spike_reach === '' ? null : data.spike_reach;
    const br = data.block_reach === '' ? null : data.block_reach;

    const sql = `INSERT INTO athletes (first_name, last_name, dob, gender, position, status, photo_url, height, weight, reach, spike_reach, block_reach, notes, size_shirt, size_pants, size_hoodie, size_warmup, technical_skills, dominant_arm) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        data.first_name, data.last_name, data.dob, data.gender || 'F', data.position, data.status, 
        photoUrl, h, w, r, sr, br, data.notes,
        data.size_shirt, data.size_pants, data.size_hoodie, data.size_warmup, data.technical_skills, data.dominant_arm
    ];
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const athleteId = this.lastID;
        
        // Insert into athlete_teams
        if (teams.length > 0) {
            const stmt = db.prepare("INSERT INTO athlete_teams (athlete_id, team_id, is_captain, jersey_number) VALUES (?, ?, ?, ?)");
            teams.forEach(t => {
                const jn = (t.jersey_number && t.jersey_number.toString().trim() !== '') ? t.jersey_number : null;
                stmt.run([athleteId, t.team_id, t.is_captain ? 1 : 0, jn]);
            });
            stmt.finalize();
        }
        
        res.json({ id: athleteId });
    });
});

app.put('/api/athletes/:id', authenticateToken, upload.single('photo'), (req, res) => {
    const data = req.body;
    const athleteId = req.params.id;
    
    let teams = [];
    try {
        if (data.teams) teams = JSON.parse(data.teams);
    } catch(e) {}
    
    const h = data.height === '' ? null : data.height;
    const w = data.weight === '' ? null : data.weight;
    const r = data.reach === '' ? null : data.reach;
    const sr = data.spike_reach === '' ? null : data.spike_reach;
    const br = data.block_reach === '' ? null : data.block_reach;

    let sql = `UPDATE athletes SET first_name=?, last_name=?, dob=?, gender=?, position=?, status=?, height=?, weight=?, reach=?, spike_reach=?, block_reach=?, notes=?, size_shirt=?, size_pants=?, size_hoodie=?, size_warmup=?, technical_skills=?, dominant_arm=?`;
    let params = [
        data.first_name, data.last_name, data.dob, data.gender || 'F', data.position, data.status || 'Tesserato', 
        h, w, r, sr, br, data.notes,
        data.size_shirt, data.size_pants, data.size_hoodie, data.size_warmup, data.technical_skills, data.dominant_arm
    ];
    
    if (req.file) {
        sql += `, photo_url=?`;
        params.push(`/images/${req.file.filename}`);
    }
    
    sql += ` WHERE id=?`;
    params.push(athleteId);
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update athlete_teams (Delete all and re-insert)
        db.run("DELETE FROM athlete_teams WHERE athlete_id = ?", [athleteId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (teams.length > 0) {
                const stmt = db.prepare("INSERT INTO athlete_teams (athlete_id, team_id, is_captain, jersey_number) VALUES (?, ?, ?, ?)");
                teams.forEach(t => {
                    const jn = (t.jersey_number && t.jersey_number.toString().trim() !== '') ? t.jersey_number : null;
                    stmt.run([athleteId, t.team_id, t.is_captain ? 1 : 0, jn]);
                });
                stmt.finalize();
            }
            res.json({ success: true, changes: this.changes });
        });
    });
});

app.delete('/api/athletes/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM athletes WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// --- Teams Routes ---
app.get('/api/teams', authenticateToken, (req, res) => {
    db.all("SELECT * FROM teams", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/teams', authenticateToken, (req, res) => {
    const { name, category, club, coach, manager, starting_six } = req.body;
    db.run("INSERT INTO teams (name, category, club, coach, manager, starting_six) VALUES (?, ?, ?, ?, ?, ?)", 
           [name, category, club, coach, manager, starting_six], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/teams/:id', authenticateToken, (req, res) => {
    const { name, category, club, coach, manager, starting_six } = req.body;
    let sql = "UPDATE teams SET ";
    let params = [];
    if (name !== undefined) { sql += "name=?, "; params.push(name); }
    if (category !== undefined) { sql += "category=?, "; params.push(category); }
    if (club !== undefined) { sql += "club=?, "; params.push(club); }
    if (coach !== undefined) { sql += "coach=?, "; params.push(coach); }
    if (manager !== undefined) { sql += "manager=?, "; params.push(manager); }
    if (starting_six !== undefined) { sql += "starting_six=?, "; params.push(starting_six); }
    
    // remove trailing comma and space
    sql = sql.slice(0, -2);
    sql += " WHERE id=?";
    params.push(req.params.id);
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.delete('/api/teams/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM teams WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// --- News Routes ---
app.get('/api/news', authenticateToken, (req, res) => {
    db.all(`SELECT n.*, u.fullname as author 
            FROM news n 
            LEFT JOIN users u ON n.user_id = u.id 
            ORDER BY n.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/news', authenticateToken, (req, res) => {
    const { title, content, is_external, url } = req.body;
    db.run(`INSERT INTO news (user_id, title, content, is_external, url) 
            VALUES (?, ?, ?, ?, ?)`, 
            [req.user.id, title, content, is_external ? 1 : 0, url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// --- Dynamic Fields Routes ---
app.get('/api/fields', authenticateToken, (req, res) => {
    db.all("SELECT * FROM dynamic_fields", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Performances Routes ---
app.get('/api/performances', authenticateToken, (req, res) => {
    db.all("SELECT * FROM performances ORDER BY date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/performances', authenticateToken, (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO performances (athlete_id, date, match_name, aces, serve_errors, reception_perfect, reception_errors, attack_points, attack_errors, blocks, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [d.athlete_id, d.date, d.match_name, d.aces, d.serve_errors, d.reception_perfect, d.reception_errors, d.attack_points, d.attack_errors, d.blocks, d.rating, d.notes];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// --- Coaches Routes ---
app.get('/api/coaches', authenticateToken, (req, res) => {
    db.all("SELECT * FROM coaches", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/coaches', authenticateToken, (req, res) => {
    const { first_name, last_name, level, dob_year } = req.body;
    db.run("INSERT INTO coaches (first_name, last_name, level, dob_year) VALUES (?, ?, ?, ?)",
           [first_name, last_name, level, dob_year], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/coaches/:id', authenticateToken, (req, res) => {
    const { first_name, last_name, level, dob_year } = req.body;
    db.run("UPDATE coaches SET first_name=?, last_name=?, level=?, dob_year=? WHERE id=?",
           [first_name, last_name, level, dob_year, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.delete('/api/coaches/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM coaches WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

// --- Scouting Routes ---
app.get('/api/scouting', authenticateToken, (req, res) => {
    db.all("SELECT * FROM scouting_athletes ORDER BY last_name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/scouting', authenticateToken, (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO scouting_athletes (first_name, last_name, dob_year, position, current_club, owned_club, height, weight, reach, spike_reach, block_reach, technical_skills, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [d.first_name, d.last_name, d.dob_year, d.position, d.current_club, d.owned_club, d.height, d.weight, d.reach, d.spike_reach, d.block_reach, d.technical_skills, d.notes];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.put('/api/scouting/:id', authenticateToken, (req, res) => {
    const d = req.body;
    const sql = `UPDATE scouting_athletes SET first_name=?, last_name=?, dob_year=?, position=?, current_club=?, owned_club=?, height=?, weight=?, reach=?, spike_reach=?, block_reach=?, technical_skills=?, notes=? WHERE id=?`;
    const params = [d.first_name, d.last_name, d.dob_year, d.position, d.current_club, d.owned_club, d.height, d.weight, d.reach, d.spike_reach, d.block_reach, d.technical_skills, d.notes, req.params.id];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.delete('/api/scouting/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM scouting_athletes WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});
app.get('/api/backup', authenticateToken, (req, res) => {
    // Generate a full JSON dump of the key tables
    const dump = {};
    let tablesToDump = 4;
    
    function sendIfDone() {
        tablesToDump--;
        if (tablesToDump === 0) {
            res.setHeader('Content-disposition', 'attachment; filename=uva_backup.json');
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify(dump, null, 2));
        }
    }

    db.all("SELECT * FROM athletes", [], (err, rows) => { dump.athletes = rows || []; sendIfDone(); });
    db.all("SELECT * FROM teams", [], (err, rows) => { dump.teams = rows || []; sendIfDone(); });
    db.all("SELECT * FROM performances", [], (err, rows) => { dump.performances = rows || []; sendIfDone(); });
    db.all("SELECT * FROM scouting_athletes", [], (err, rows) => { dump.scouting = rows || []; sendIfDone(); });
});

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
