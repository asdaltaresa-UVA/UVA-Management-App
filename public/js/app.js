// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        athletes: [],
        teams: [],
        coaches: [],
        news: [],
        fields: [],
        performances: [],
        scouting: [],
        currentView: 'dashboard',
        currentAthleteId: null,
        currentTeamId: null,
        selectedClub: null,
        athleteRadarChart: null,
        dashboardChart: null
    };

    // --- DOM Elements ---
    const screens = {
        app: document.getElementById('app-screen'),
        login: document.getElementById('login-screen'),
        hub: document.getElementById('view-hub')
    };

    const views = {
        hub: document.getElementById('view-hub'),
        dashboard: document.getElementById('view-dashboard'),
        athletes: document.getElementById('view-athletes'),
        athleteDetail: document.getElementById('view-athlete-detail'),
        coaches: document.getElementById('view-coaches'),
        teams: document.getElementById('view-teams'),
        teamDetail: document.getElementById('view-team-detail'),
        scouting: document.getElementById('view-scouting'),
        'dream-team': document.getElementById('view-dream-team'),
        news: document.getElementById('view-news'),
        settings: document.getElementById('view-settings')
    };

    const navItems = document.querySelectorAll('.nav-item');
    const btnLogout = document.getElementById('btn-logout');

    // --- Auth Check ---
    function checkAuth() {
        if (!api.getToken()) {
            if (screens.app) screens.app.style.display = 'none';
            if (screens.login) screens.login.style.display = 'flex';
        } else {
            if (screens.login) screens.login.style.display = 'none';
            if (screens.app) screens.app.style.display = 'flex';
            const user = api.getUser();
            const userNameEl = document.getElementById('current-user-name');
            if (userNameEl && user) userNameEl.textContent = user.fullname || user.username;
            initApp();
        }
    }

    window.addEventListener('auth-failed', checkAuth);

    // --- Login Logic ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('login-username').value;
            const p = document.getElementById('login-password').value;
            const errDiv = document.getElementById('login-error');
            
            try {
                const res = await api.login(u, p);
                if (res.token) {
                    api.setAuth(res.token, res.user);
                    checkAuth();
                } else {
                    errDiv.textContent = res.error || 'Login fallito';
                }
            } catch (err) {
                errDiv.textContent = 'Errore di connessione al server';
            }
        });
    }

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        api.clearAuth();
        checkAuth();
    });

    // Run auth check on start
    checkAuth();

    // --- Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (target) navigateTo(target);
        });
    });

    function navigateTo(viewName, params = null) {
        // Update nav
        navItems.forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-target="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Update views
        Object.values(views).forEach(v => {
            if (v) v.classList.remove('active');
        });
        
        if (viewName === 'athlete-detail') {
            views.athleteDetail.classList.add('active');
            renderAthleteDetail(params.id);
        } else if (viewName === 'team-detail') {
            views.teamDetail.classList.add('active');
        } else {
            views[viewName].classList.add('active');
        }

        if (viewName === 'athletes') renderAthletesList();
        if (viewName === 'coaches') renderCoachesList();
        if (viewName === 'teams') renderTeams();
        if (viewName === 'dashboard') updateDashboardStats();

        if (viewName === 'scouting') renderScoutingList();

        // Title
        const titles = {
            dashboard: 'Dashboard',
            athletes: 'Gestione Atleti',
            coaches: 'Gestione Allenatori',
            teams: 'Le Nostre Squadre',
            scouting: 'Osservatorio',
            news: 'Social & News',
            settings: 'Impostazioni'
        };
        document.getElementById('page-title').textContent = titles[viewName] || 'UVA Management App';
        
        if (viewName === 'dashboard') updateDashboardStats();
        if (viewName === 'athletes') renderAthletesList();
        if (viewName === 'coaches') renderCoachesList();
        if (viewName === 'scouting') renderScoutingList();
        if (viewName === 'teams') renderTeams();
        if (viewName === 'dream-team') renderDreamTeam();
    }

    // --- Init App ---
    async function initApp() {
        await loadInitialData();
        navigateTo('hub');
    }

    async function loadInitialData() {
        try {
            const [athletesRes, teamsRes, newsRes, fieldsRes, perfsRes, coachesRes, scoutingRes] = await Promise.all([
                api.getAthletes(),
                api.getTeams(),
                api.getNews(),
                api.getDynamicFields(),
                api.getPerformances(),
                api.getCoaches(),
                api.getScouting()
            ]);
            state.athletes = athletesRes || [];
            state.teams = teamsRes || [];
            state.news = newsRes || [];
            state.fields = fieldsRes || [];
            state.performances = perfsRes || [];
            state.coaches = coachesRes || [];
            state.scouting = scoutingRes || [];
        } catch (err) {
            console.error('Error loading data', err);
        }
    }

    // --- Dashboard Stats ---
    function updateDashboardStats() {
        const clubAthletes = state.selectedClub ? state.athletes.filter(a => a.teams && a.teams.some(t => t.club === state.selectedClub)) : state.athletes;
        const clubTeams = state.selectedClub ? state.teams.filter(t => t.club === state.selectedClub) : state.teams;
        
        const elTotalAthletes = document.getElementById('stat-total-athletes');
        const elTotalTeams = document.getElementById('stat-total-teams');
        const elRecentPerfs = document.getElementById('stat-recent-perfs');
        const elAvgRating = document.getElementById('stat-avg-rating');

        if (elTotalAthletes) elTotalAthletes.textContent = clubAthletes.length;
        if (elTotalTeams) elTotalTeams.textContent = clubTeams.length;
        
        const recentPerfs = state.performances.filter(p => clubAthletes.some(a => a.id === p.athlete_id));
        if (elRecentPerfs) elRecentPerfs.textContent = recentPerfs.length;
        if (elAvgRating) elAvgRating.textContent = '7.4';

        const newsContainer = document.getElementById('dashboard-news-list');
        newsContainer.innerHTML = state.news.slice(0, 3).map(n => `
            <div class="news-item" style="border-left-color: ${n.is_external ? '#3b5998' : 'var(--primary-color)'}">
                <div class="news-meta">${new Date(n.created_at).toLocaleDateString()} - ${n.author || 'Social'}</div>
                <div class="news-title">${n.title}</div>
            </div>
        `).join('');

        const radarsContainer = document.getElementById('dashboard-teams-radars');
        if (radarsContainer) {
            radarsContainer.innerHTML = '';
            // Store instances to destroy them later if needed
            if (!state.dashboardRadars) state.dashboardRadars = [];
            state.dashboardRadars.forEach(chart => chart.destroy());
            state.dashboardRadars = [];

            if (clubTeams.length === 0) {
                radarsContainer.innerHTML = '<p style="color:#aaa;">Nessuna squadra attiva per questa società.</p>';
            } else {
                clubTeams.forEach(team => {
                    // Create container and canvas
                    const teamDiv = document.createElement('div');
                    teamDiv.className = 'card text-center';
                    teamDiv.style.background = 'rgba(255,255,255,0.02)';
                    teamDiv.style.border = '1px solid #333';
                    teamDiv.innerHTML = `
                        <h3 style="font-size: 16px; margin-bottom: 10px; color: var(--primary-color);">${team.name}</h3>
                        <div style="width: 100%; max-width: 250px; margin: 0 auto;">
                            <canvas id="dash-radar-${team.id}"></canvas>
                        </div>
                        <p style="font-size: 12px; color: #888; margin-top: 10px;">Media Roster</p>
                    `;
                    radarsContainer.appendChild(teamDiv);

                    // Calculate averages for this team
                    const teamAthletes = clubAthletes.filter(a => a.teams && a.teams.some(t => t.team_id == team.id));
                    let attacco = 0, battuta = 0, muro = 0, ricezione = 0, fisico = 3;
                    
                    if (teamAthletes.length > 0) {
                        const ids = teamAthletes.map(a => a.id);
                        const perfs = state.performances.filter(p => ids.includes(p.athlete_id));
                        if (perfs.length > 0) {
                            attacco = perfs.reduce((sum, p) => sum + p.attack_points, 0) / perfs.length;
                            battuta = perfs.reduce((sum, p) => sum + p.aces, 0) / perfs.length;
                            muro = perfs.reduce((sum, p) => sum + p.blocks, 0) / perfs.length;
                            ricezione = perfs.reduce((sum, p) => sum + p.reception_perfect, 0) / perfs.length;
                        }
                    }

                    // Draw chart
                    setTimeout(() => {
                        const ctx = document.getElementById(`dash-radar-${team.id}`);
                        if (ctx) {
                            const chart = new Chart(ctx, {
                                type: 'radar',
                                data: {
                                    labels: ['Attacco', 'Battuta', 'Muro', 'Ricezione', 'Fisico'],
                                    datasets: [{
                                        label: 'Media',
                                        data: [attacco, battuta, muro, ricezione, fisico],
                                        backgroundColor: 'rgba(59, 89, 152, 0.2)',
                                        borderColor: 'rgba(59, 89, 152, 1)',
                                        pointBackgroundColor: '#fff',
                                        pointBorderColor: 'rgba(59, 89, 152, 1)'
                                    }]
                                },
                                options: {
                                    scales: {
                                        r: {
                                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                            pointLabels: { color: '#aaa', font: { size: 10 } },
                                            ticks: { display: false, min: 0, max: 10 }
                                        }
                                    },
                                    plugins: { legend: { display: false } },
                                    animation: { duration: 0 } // Fast render
                                }
                            });
                            state.dashboardRadars.push(chart);
                        }
                    }, 0);
                });
            }
        }
    }

    // --- Render Athletes List ---
    function renderAthletesList(filterTeamId = null) {
        const tbody = document.getElementById('athletes-tbody');
        tbody.innerHTML = '';
        
        // Filter out athletes in scouting if status exists
        let clubAthletes = state.selectedClub ? state.athletes.filter(a => a.teams && a.teams.some(t => t.club === state.selectedClub)) : state.athletes;
        clubAthletes = clubAthletes.filter(a => a.status !== 'scouting');
        
        let filteredAthletes = clubAthletes;
        if (filterTeamId) {
            filteredAthletes = clubAthletes.filter(a => a.teams && a.teams.some(t => t.team_id == filterTeamId));
            document.getElementById('filter-team').value = filterTeamId;
        } else {
            const currentFilter = document.getElementById('filter-team').value;
            if (currentFilter) {
                filteredAthletes = clubAthletes.filter(a => a.teams && a.teams.some(t => t.team_id == currentFilter));
            }
        }
        const searchInput = document.getElementById('search-athlete');
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredAthletes = filteredAthletes.filter(a => 
                `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm)
            );
        }

        const genderFilter = document.getElementById('filter-gender');
        if (genderFilter && genderFilter.value) {
            filteredAthletes = filteredAthletes.filter(a => a.gender === genderFilter.value);
        }

        if (state.athleteSortBy) {
            filteredAthletes.sort((a, b) => {
                let valA = a[state.athleteSortBy] || '';
                let valB = b[state.athleteSortBy] || '';
                if (state.athleteSortBy === 'dob') {
                    valA = valA ? new Date(valA).getFullYear() : 0;
                    valB = valB ? new Date(valB).getFullYear() : 0;
                }
                if (valA < valB) return state.athleteSortDesc ? 1 : -1;
                if (valA > valB) return state.athleteSortDesc ? -1 : 1;
                return 0;
            });
        }
        filteredAthletes.forEach(a => {
            const tr = document.createElement('tr');
            const photoUrl = a.photo_url || 'images/default-avatar.png';
            const teamsList = a.teams ? a.teams.map(t => {
                let s = t.team_name;
                if (t.is_captain) s += ' <span class="tag tag-green">(C)</span>';
                return s;
            }).join('<br>') : 'N/A';
            
            const dobYear = a.dob ? new Date(a.dob).getFullYear() : 'N/D';
            const genderBadge = a.gender === 'M' ? '<span class="tag" style="background:#3b5998; color:#fff;">M</span>' : '<span class="tag" style="background:#e83e8c; color:#fff;">F</span>';
            tr.innerHTML = `
                <td><strong>${a.last_name}</strong></td>
                <td><strong>${a.first_name}</strong></td>
                <td>${genderBadge}</td>
                <td>${dobYear}</td>
                <td><span class="tag">${a.position || 'N/D'}</span></td>
                <td>${teamsList}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-athlete-btn" data-id="${a.id}">Scheda</button>
                    <button class="btn btn-sm btn-secondary edit-athlete-btn" data-id="${a.id}">Modifica</button>
                    <button class="btn btn-sm scouting-athlete-btn" data-id="${a.id}" style="background:#f39c12;color:#fff;" title="Sposta in Osservatorio"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm delete-athlete-btn" data-id="${a.id}" style="background:var(--danger-color);color:#fff;" title="Elimina"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.view-athlete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                navigateTo('athlete-detail', { id: e.currentTarget.getAttribute('data-id') });
            });
        });
        
        document.querySelectorAll('.edit-athlete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const athlete = state.athletes.find(a => a.id == id);
                state.currentAthleteId = id;
                if (typeof openAthleteModal === 'function') openAthleteModal(athlete);
            });
        });

        document.querySelectorAll('.scouting-athlete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const athlete = state.athletes.find(a => a.id == id);
                if (!athlete) return;
                
                if (confirm('Spostare questo atleta in Osservatorio? Non sarà più visibile nelle squadre attive, ma manterrà lo storico.')) {
                    try {
                        const formData = new FormData();
                        formData.append('first_name', athlete.first_name);
                        formData.append('last_name', athlete.last_name);
                        if (athlete.dob) formData.append('dob', athlete.dob);
                        if (athlete.position) formData.append('position', athlete.position);
                        formData.append('status', 'scouting');
                        formData.append('teams', JSON.stringify([])); // Remove from teams
                        
                        // Append other fields to avoid nulling them
                        ['height', 'weight', 'reach', 'spike_reach', 'block_reach', 'notes', 'size_shirt', 'size_pants', 'size_hoodie', 'size_warmup'].forEach(k => {
                            if (athlete[k] !== undefined && athlete[k] !== null) formData.append(k, athlete[k]);
                        });

                        await api.updateAthlete(id, formData);
                        await loadInitialData();
                        renderAthletesList();
                        updateDashboardStats();
                        alert('Atleta spostato in Osservatorio.');
                    } catch (err) {
                        alert("Errore durante lo spostamento: " + err.message);
                    }
                }
            });
        });

        document.querySelectorAll('.delete-athlete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Sei sicuro di voler eliminare questo atleta?')) {
                    try {
                        await api.deleteAthlete(id);
                        await loadInitialData();
                        renderAthletesList();
                        updateDashboardStats();
                    } catch (err) {
                        alert("Errore durante l'eliminazione: " + err.message);
                    }
                }
            });
        });
    }

    document.querySelectorAll('.sortable-header').forEach(th => {
        th.addEventListener('click', (e) => {
            const sortKey = e.currentTarget.getAttribute('data-sort');
            if (state.athleteSortBy === sortKey) {
                state.athleteSortDesc = !state.athleteSortDesc;
            } else {
                state.athleteSortBy = sortKey;
                state.athleteSortDesc = false;
            }
            renderAthletesList();
        });
    });

    const searchAthleteInput = document.getElementById('search-athlete');
    if (searchAthleteInput) searchAthleteInput.addEventListener('input', () => renderAthletesList());

    document.getElementById('filter-team').addEventListener('change', () => renderAthletesList());
    const filterGenderSelect = document.getElementById('filter-gender');
    if (filterGenderSelect) filterGenderSelect.addEventListener('change', () => renderAthletesList());
    document.getElementById('btn-back-athletes').addEventListener('click', () => navigateTo('athletes'));

    // --- Render Coaches ---
    function renderCoachesList() {
        const tbody = document.getElementById('coaches-tbody');
        tbody.innerHTML = '';
        
        let clubCoaches = state.selectedClub ? state.coaches.filter(c => c.club === state.selectedClub) : state.coaches;
        
        const filterTeamId = document.getElementById('filter-coach-team').value;
        const searchTerm = document.getElementById('search-coach').value.toLowerCase();
        
        let filteredCoaches = clubCoaches.filter(c => {
            const nameMatch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm);
            return nameMatch;
        });
        if (state.coachSortBy) {
            filteredCoaches.sort((a, b) => {
                let valA = a[state.coachSortBy] || '';
                let valB = b[state.coachSortBy] || '';
                if (valA < valB) return state.coachSortDesc ? 1 : -1;
                if (valA > valB) return state.coachSortDesc ? -1 : 1;
                return 0;
            });
        }

        filteredCoaches.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.last_name}</strong></td>
                <td><strong>${c.first_name}</strong></td>
                <td>${c.dob_year || 'N/D'}</td>
                <td><span class="tag">${c.level || 'N/D'}</span></td>
                <td>N/D</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-coach-btn" data-id="${c.id}">Modifica</button>
                    <button class="btn btn-sm delete-coach-btn" data-id="${c.id}" style="background:var(--danger-color);color:#fff;">Elimina</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-coach-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const coach = state.coaches.find(c => c.id == id);
                document.getElementById('modal-coach-title').textContent = 'Modifica Allenatore';
                document.getElementById('f-coach-id').value = coach.id;
                document.getElementById('f-coach-first-name').value = coach.first_name;
                document.getElementById('f-coach-last-name').value = coach.last_name;
                document.getElementById('f-coach-level').value = coach.level || '';
                document.getElementById('f-coach-dob-year').value = coach.dob_year || '';
                document.getElementById('modal-coach').classList.add('active');
            });
        });

        document.querySelectorAll('.delete-coach-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Sei sicuro di voler eliminare questo allenatore?')) {
                    try {
                        await api.deleteCoach(id);
                        await loadInitialData();
                        renderCoachesList();
                    } catch (err) {
                        alert("Errore durante l'eliminazione: " + err.message);
                    }
                }
            });
        });
        
        document.querySelectorAll('.sortable-coach-header').forEach(th => {
            // Remove old listeners by replacing element (simple way to avoid duplicates if called multiple times)
            const newTh = th.cloneNode(true);
            th.parentNode.replaceChild(newTh, th);
            newTh.addEventListener('click', (e) => {
                const sortKey = e.currentTarget.getAttribute('data-sort');
                if (state.coachSortBy === sortKey) {
                    state.coachSortDesc = !state.coachSortDesc;
                } else {
                    state.coachSortBy = sortKey;
                    state.coachSortDesc = false;
                }
                renderCoachesList();
            });
        });
    }
    document.getElementById('search-coach').addEventListener('input', () => renderCoachesList());

    // --- Render Athlete Detail ---
    async function renderAthleteDetail(id) {
        state.currentAthleteId = id;
        try {
            const a = await api.getAthlete(id);
            document.getElementById('detail-name').innerHTML = `${a.first_name} ${a.last_name}`;
            document.getElementById('detail-photo').src = a.photo_url || 'images/default-avatar.png';
            
            const dobYear = a.dob ? new Date(a.dob).getFullYear() : '-';
            document.getElementById('detail-age').textContent = dobYear;
            document.getElementById('detail-height').textContent = a.height ? a.height + ' cm' : '-';
            document.getElementById('detail-elev').textContent = a.spike_reach ? a.spike_reach + ' cm' : '-';
            
            // Dati Atletici
            document.getElementById('detail-physical').innerHTML = `
                <li><span>Peso:</span> <strong>${a.weight || '-'} kg</strong></li>
                <li><span>Reach a muro:</span> <strong>${a.block_reach || '-'} cm</strong></li>
                <li><span>Reach:</span> <strong>${a.reach || '-'} cm</strong></li>
            `;

            // Dati Tecnici
            document.getElementById('detail-technical').innerHTML = `
                <li><span>Palleggio:</span> <strong>${a.technical_skills ? JSON.parse(a.technical_skills).palleggio || '-' : '-'} / 5</strong></li>
                <li><span>Bagher:</span> <strong>${a.technical_skills ? JSON.parse(a.technical_skills).bagher || '-' : '-'} / 5</strong></li>
                <li><span>Battuta:</span> <strong>${a.technical_skills ? JSON.parse(a.technical_skills).battuta || '-' : '-'} / 5</strong></li>
                <li><span>Attacco:</span> <strong>${a.technical_skills ? JSON.parse(a.technical_skills).attacco || '-' : '-'} / 5</strong></li>
            `;

            // Scout (Performances)
            const renderPerformances = () => {
                const seasonFilter = document.getElementById('filter-athlete-season').value;
                let athletePerfs = state.performances.filter(p => p.athlete_id == id);
                if (seasonFilter !== 'all') {
                    athletePerfs = athletePerfs.filter(p => p.season === seasonFilter);
                }
                const tBody = document.getElementById('detail-performances');
                tBody.innerHTML = athletePerfs.map(p => `
                    <tr>
                        <td>${new Date(p.date).toLocaleDateString()}</td>
                        <td>${p.match_name}</td>
                        <td><strong>${p.rating || '-'}</strong></td>
                        <td>${p.attack_points + p.aces + p.blocks}</td>
                        <td>${p.notes || ''}</td>
                    </tr>
                `).join('');

                // Draw Radar Chart
                drawRadarChart(athletePerfs);
            };

            renderPerformances();

            // Bind season filter change
            const seasonSelect = document.getElementById('filter-athlete-season');
            seasonSelect.onchange = renderPerformances;

        } catch (err) { console.error(err); }
    }

    function drawRadarChart(perfs) {
        const ctx = document.getElementById('athleteRadarChart').getContext('2d');
        if (state.radarChartInstance) {
            state.radarChartInstance.destroy();
        }

        let attacco = 0, battuta = 0, muro = 0, ricezione = 0, fisico = 0;
        if (perfs.length > 0) {
            attacco = perfs.reduce((sum, p) => sum + p.attack_points, 0) / perfs.length;
            battuta = perfs.reduce((sum, p) => sum + p.aces, 0) / perfs.length;
            muro = perfs.reduce((sum, p) => sum + p.blocks, 0) / perfs.length;
            ricezione = perfs.reduce((sum, p) => sum + p.reception_perfect, 0) / perfs.length;
            fisico = 3; // Placeholder for physical condition rating
        }

        state.radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Attacco', 'Battuta', 'Muro', 'Ricezione', 'Fisico'],
                datasets: [{
                    label: 'Valori Medi',
                    data: [attacco, battuta, muro, ricezione, fisico],
                    backgroundColor: 'rgba(0, 210, 106, 0.2)',
                    borderColor: 'rgba(0, 210, 106, 1)',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(0, 210, 106, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#aaa', font: { size: 12 } },
                        ticks: { display: false, min: 0, max: 10 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // --- Render Teams ---
    function renderTeams() {
        const grid = document.getElementById('teams-grid');
        const clubTeams = state.selectedClub ? state.teams.filter(t => t.club === state.selectedClub) : state.teams;
        
        const categoryOrder = {
            "Serie C": 1,
            "Serie D": 2,
            "1DF": 3,
            "2DF": 4,
            "U19": 5,
            "U18": 6,
            "U17": 7,
            "U16": 8,
            "U15": 9,
            "U14": 10,
            "U13": 11,
            "U12": 12,
            "S3": 13
        };

        clubTeams.sort((a, b) => {
            const orderA = categoryOrder[a.category] || 99;
            const orderB = categoryOrder[b.category] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
        });

        grid.innerHTML = clubTeams.map(t => `
            <div class="card team-card-click" data-team-id="${t.id}" style="cursor: pointer; transition: transform 0.2s;">
                <h3>${t.name}</h3>
                <p><strong>Categoria:</strong> ${t.category}</p>
                <div style="margin-top: 15px; color: var(--primary-color); font-size: 0.9rem;"><i class="fas fa-eye"></i> Vedi Roster</div>
            </div>
        `).join('');
        
        document.querySelectorAll('.team-card-click').forEach(card => {
            card.addEventListener('click', (e) => {
                const teamId = e.currentTarget.getAttribute('data-team-id');
                const team = state.teams.find(t => t.id == teamId);
                renderTeamDetail(team);
            });
            card.addEventListener('mouseover', () => card.style.transform = 'scale(1.02)');
            card.addEventListener('mouseout', () => card.style.transform = 'scale(1)');
        });
    }

    function renderTeamDetail(team) {
        state.currentTeamId = team.id;
        document.getElementById('team-detail-name').textContent = team.name;
        document.getElementById('team-detail-coach').textContent = team.coach || 'N/D';
        document.getElementById('team-detail-manager').textContent = team.manager || 'N/D';
        
        const btnEditTeamDetail = document.getElementById('btn-edit-team-detail');
        if (btnEditTeamDetail) {
            // Remove old listeners by cloning
            const newBtn = btnEditTeamDetail.cloneNode(true);
            btnEditTeamDetail.parentNode.replaceChild(newBtn, btnEditTeamDetail);
            newBtn.addEventListener('click', () => {
                document.getElementById('modal-team-title').textContent = 'Modifica Squadra';
                document.getElementById('f-team-id').value = team.id;
                document.getElementById('f-team-name').value = team.name;
                document.getElementById('f-team-category').value = team.category;
                document.getElementById('f-team-coach').value = team.coach || '';
                document.getElementById('f-team-manager').value = team.manager || '';
                document.getElementById('modal-team').classList.add('active');
            });
        }
        
        // Render Roster
        const teamAthletes = state.athletes.filter(a => a.teams && a.teams.some(t => t.team_id == team.id));
        const rosterTbody = document.getElementById('team-detail-roster');
        if (rosterTbody) {
            rosterTbody.innerHTML = teamAthletes.map(a => {
                const teamData = a.teams.find(t => t.team_id == team.id);
                const jersey = teamData && teamData.jersey_number ? teamData.jersey_number : '-';
                const dobYear = a.dob ? new Date(a.dob).getFullYear() : 'N/D';
                let isCaptainHtml = teamData && teamData.is_captain ? ' <span class="tag tag-green">(C)</span>' : '';
                return `<tr>
                    <td><strong>${jersey}</strong></td>
                    <td><strong>${a.first_name} ${a.last_name}</strong>${isCaptainHtml}</td>
                    <td><span class="tag">${a.position || '-'}</span></td>
                    <td>${dobYear}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-athlete-btn-roster" data-id="${a.id}">Scheda</button>
                    </td>
                </tr>`;
            }).join('');
            
            // Rebind
            document.querySelectorAll('.view-athlete-btn-roster').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    navigateTo('athlete-detail', { id: e.currentTarget.getAttribute('data-id') });
                });
            });
        }

        function calculateAverages(athleteList) {
            if (!athleteList || athleteList.length === 0) return [0,0,0,0,0];
            const ids = athleteList.map(a => a.id);
            const perfs = state.performances.filter(p => ids.includes(p.athlete_id));
            
            let attacco = 0, battuta = 0, muro = 0, ricezione = 0, fisico = 3;
            if (perfs.length > 0) {
                attacco = perfs.reduce((sum, p) => sum + p.attack_points, 0) / perfs.length;
                battuta = perfs.reduce((sum, p) => sum + p.aces, 0) / perfs.length;
                muro = perfs.reduce((sum, p) => sum + p.blocks, 0) / perfs.length;
                ricezione = perfs.reduce((sum, p) => sum + p.reception_perfect, 0) / perfs.length;
            }
            return [attacco, battuta, muro, ricezione, fisico];
        }

        function drawTeamChart(ctxId, dataValues, instanceKey) {
            const ctx = document.getElementById(ctxId);
            if (!ctx) return;
            if (state[instanceKey]) state[instanceKey].destroy();
            
            const color = instanceKey === 'teamRadarInstance' ? '59, 89, 152' : '0, 210, 106';

            state[instanceKey] = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Attacco', 'Battuta', 'Muro', 'Ricezione', 'Fisico'],
                    datasets: [{
                        label: 'Valori Medi',
                        data: dataValues,
                        backgroundColor: `rgba(${color}, 0.2)`,
                        borderColor: `rgba(${color}, 1)`,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: `rgba(${color}, 1)`
                    }]
                },
                options: {
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { color: '#aaa', font: { size: 10 } },
                            ticks: { display: false, min: 0, max: 10 }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        drawTeamChart('teamRadarChart', calculateAverages(teamAthletes), 'teamRadarInstance');

        const updateAthleteName = () => {
            const sixAthletes = [];
            document.querySelectorAll('.court-input').forEach(inp => {
                const nameDiv = inp.parentNode.querySelector('.athlete-name');
                if (!nameDiv) return;
                const jersey = inp.value;
                if (!jersey) {
                    nameDiv.textContent = '';
                    return;
                }
                if (inp.getAttribute('data-pos') === 'coach') {
                    nameDiv.textContent = team.coach || 'Coach';
                    return;
                }
                const athlete = teamAthletes.find(a => {
                    const td = a.teams.find(t => t.team_id == team.id);
                    return td && td.jersey_number == jersey;
                });
                nameDiv.textContent = athlete ? `${athlete.first_name[0]}. ${athlete.last_name}` : '?';
                if (athlete) sixAthletes.push(athlete);
            });
            drawTeamChart('startingSixRadarChart', calculateAverages(sixAthletes), 'startingSixRadarInstance');
        };

        document.querySelectorAll('.court-input').forEach(inp => {
            inp.value = '';
            // Using listener so we can recompute whenever ANY input changes
            inp.oninput = () => updateAthleteName();
        });
        
        if (team.starting_six) {
            const six = JSON.parse(team.starting_six);
            document.querySelectorAll('.court-input').forEach(inp => {
                const pos = inp.getAttribute('data-pos');
                if (six[pos]) {
                    inp.value = six[pos];
                }
            });
        }
        updateAthleteName();

        navigateTo('team-detail');
    }

    document.getElementById('btn-save-formation').addEventListener('click', async () => {
        const formation = {};
        document.querySelectorAll('.court-input').forEach(inp => {
            const pos = inp.getAttribute('data-pos');
            if (inp.value) formation[pos] = inp.value;
        });
        await api.updateTeam(state.currentTeamId, { starting_six: JSON.stringify(formation) });
        alert('Formazione salvata!');
    });

    document.getElementById('btn-back-teams').addEventListener('click', () => navigateTo('teams'));

    // --- Athlete Modal Logic (Create & Edit) ---
    const modalAthlete = document.getElementById('modal-athlete');
    const formAthlete = document.getElementById('form-athlete');
    const btnAddAthlete = document.getElementById('btn-add-athlete');
    const btnEditAthlete = document.getElementById('btn-edit-athlete');
    const btnCloseAthleteModal = document.getElementById('close-athlete-modal');
    
    function openAthleteModal(athlete = null) {
        document.getElementById('modal-athlete-title').textContent = athlete ? 'Modifica Atleta' : 'Nuovo Atleta';
        document.getElementById('f-athlete-id').value = athlete ? athlete.id : '';
        document.getElementById('f-first-name').value = athlete ? athlete.first_name : '';
        document.getElementById('f-last-name').value = athlete ? athlete.last_name : '';
        document.getElementById('f-position').value = athlete ? athlete.position : '';
        document.getElementById('f-dob').value = athlete && athlete.dob ? athlete.dob.split('T')[0] : '';
        document.getElementById('f-gender').value = athlete ? athlete.gender || 'F' : 'F';
        
        document.getElementById('f-size-shirt').value = athlete ? athlete.size_shirt || '' : '';
        document.getElementById('f-size-pants').value = athlete ? athlete.size_pants || '' : '';
        document.getElementById('f-size-hoodie').value = athlete ? athlete.size_hoodie || '' : '';
        document.getElementById('f-size-warmup').value = athlete ? athlete.size_warmup || '' : '';
        
        const teamsListDiv = document.getElementById('f-teams-list');
        teamsListDiv.innerHTML = state.teams.filter(t => !state.selectedClub || t.club === state.selectedClub).map(t => {
            let isChecked = false;
            let isCaptain = false;
            let jersey = '';
            if (athlete && athlete.teams) {
                const at = athlete.teams.find(x => x.team_id == t.id);
                if (at) {
                    isChecked = true;
                    isCaptain = at.is_captain;
                    jersey = at.jersey_number || '';
                }
            }
            return `
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                    <input type="checkbox" class="cb-team-select" data-team-id="${t.id}" ${isChecked ? 'checked' : ''}>
                    <label style="width:150px; margin:0; color:#fff;">${t.club} - ${t.name}</label>
                    <input type="number" class="in-team-jersey" data-team-id="${t.id}" value="${jersey}" placeholder="N° Maglia" style="width:100px; padding:5px;">
                    <label style="margin:0; color:#ccc;"><input type="checkbox" class="cb-team-captain" data-team-id="${t.id}" ${isCaptain ? 'checked' : ''}> Capitano</label>
                </div>
            `;
        }).join('');
        
        modalAthlete.classList.add('active');
    }

    btnCloseAthleteModal.addEventListener('click', () => modalAthlete.classList.remove('active'));
    
    btnAddAthlete.addEventListener('click', () => openAthleteModal());
    
    btnEditAthlete.addEventListener('click', async () => {
        if (!state.currentAthleteId) return;
        try {
            const athlete = await api.getAthlete(state.currentAthleteId);
            openAthleteModal(athlete);
        } catch (err) {
            alert('Errore caricamento dati atleta: ' + err.message);
        }
    });

    formAthlete.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('f-athlete-id').value;
        
        // Build teams array
        const selectedTeams = [];
        document.querySelectorAll('.cb-team-select:checked').forEach(cb => {
            const tId = cb.getAttribute('data-team-id');
            const jerseyInput = document.querySelector(`.in-team-jersey[data-team-id="${tId}"]`).value;
            const captainCb = document.querySelector(`.cb-team-captain[data-team-id="${tId}"]`).checked;
            selectedTeams.push({
                team_id: tId,
                jersey_number: jerseyInput ? parseInt(jerseyInput) : null,
                is_captain: captainCb
            });
        });

        const data = {
            first_name: document.getElementById('f-first-name').value,
            last_name: document.getElementById('f-last-name').value,
            gender: document.getElementById('f-gender').value,
            position: document.getElementById('f-position').value,
            dob: document.getElementById('f-dob').value,
            size_shirt: document.getElementById('f-size-shirt').value,
            size_pants: document.getElementById('f-size-pants').value,
            size_hoodie: document.getElementById('f-size-hoodie').value,
            size_warmup: document.getElementById('f-size-warmup').value,
            teams: JSON.stringify(selectedTeams)
        };
        
        try {
            if (id) {
                await api.updateAthlete(id, data);
            } else {
                await api.createAthlete(data);
            }
            modalAthlete.classList.remove('active');
            await loadInitialData();
            if (id) {
                renderAthleteDetail(id); // reload detail if we were editing
            } else {
                renderAthletesList();
                navigateTo('athletes');
            }
        } catch (err) {
            alert('Errore salvataggio: ' + err.message);
        }
    });

    // --- Delete Athlete ---
    document.getElementById('btn-delete-athlete').addEventListener('click', async () => {
        if (!state.currentAthleteId) return;
        if (confirm('Sei sicuro di voler eliminare questo atleta? Questa azione è irreversibile.')) {
            try {
                await api.deleteAthlete(state.currentAthleteId);
                // Reload data and go to list
                await loadInitialData();
                renderAthletesList();
                updateDashboardStats();
                navigateTo('athletes');
            } catch (err) {
                alert("Errore durante l'eliminazione: " + err.message);
            }
        }
    });

    // --- Team Modal Logic ---
    const modalTeam = document.getElementById('modal-team');
    const btnAddTeam = document.getElementById('btn-add-team');
    const btnCloseTeamModal = document.getElementById('close-team-modal');
    
    if (btnAddTeam) {
        btnAddTeam.addEventListener('click', () => {
            document.getElementById('modal-team-title').textContent = 'Nuova Squadra';
            document.getElementById('f-team-id').value = '';
            document.getElementById('f-team-name').value = '';
            document.getElementById('f-team-coach').value = '';
            document.getElementById('f-team-manager').value = '';
            modalTeam.classList.add('active');
        });
    }

    if (btnCloseTeamModal) {
        btnCloseTeamModal.addEventListener('click', () => modalTeam.classList.remove('active'));
    }

    document.getElementById('form-team').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('f-team-id').value;
        const data = {
            name: document.getElementById('f-team-name').value,
            category: document.getElementById('f-team-category').value,
            club: state.selectedClub || 'UVA',
            coach: document.getElementById('f-team-coach').value,
            manager: document.getElementById('f-team-manager').value
        };
        
        try {
            if (id) {
                await api.updateTeam(id, data);
            } else {
                await api.createTeam(data);
            }
            modalTeam.classList.remove('active');
            await loadInitialData();
            renderTeams();
        } catch (err) {
            alert('Errore salvataggio: ' + err.message);
        }
    });

    // --- Coach Modal Logic ---
    const modalCoach = document.getElementById('modal-coach');
    const btnAddCoach = document.getElementById('btn-add-coach');
    const btnCloseCoachModal = document.getElementById('close-coach-modal');

    if (btnAddCoach) {
        btnAddCoach.addEventListener('click', () => {
            document.getElementById('modal-coach-title').textContent = 'Nuovo Allenatore';
            document.getElementById('f-coach-id').value = '';
            document.getElementById('f-coach-first-name').value = '';
            document.getElementById('f-coach-last-name').value = '';
            document.getElementById('f-coach-level').value = '';
            document.getElementById('f-coach-dob-year').value = '';
            modalCoach.classList.add('active');
        });
    }

    if (btnCloseCoachModal) {
        btnCloseCoachModal.addEventListener('click', () => modalCoach.classList.remove('active'));
    }

    document.getElementById('form-coach').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('f-coach-id').value;
        const data = {
            first_name: document.getElementById('f-coach-first-name').value,
            last_name: document.getElementById('f-coach-last-name').value,
            level: document.getElementById('f-coach-level').value,
            dob_year: document.getElementById('f-coach-dob-year').value ? parseInt(document.getElementById('f-coach-dob-year').value) : null
        };
        
        try {
            if (id) {
                await api.updateCoach(id, data);
            } else {
                await api.createCoach(data);
            }
            modalCoach.classList.remove('active');
            await loadInitialData();
            renderCoachesList();
        } catch (err) {
            alert('Errore salvataggio: ' + err.message);
        }
    });

    // --- Render News ---
    function renderNews() {
        const container = document.getElementById('news-feed-container');
        if (!container) return;
        container.innerHTML = state.news.map(n => `
            <div class="news-item" style="border-left-color: ${n.is_external ? '#3b5998' : 'var(--primary-color)'}">
                <div class="news-meta">
                    <i class="${n.is_external ? 'fab fa-instagram' : 'fas fa-user'}"></i> 
                    ${new Date(n.created_at).toLocaleDateString()} - ${n.author || 'Social'}
                </div>
                <div class="news-title">${n.title}</div>
                <div class="news-content">${n.content}</div>
                ${n.url ? `<a href="${n.url}" target="_blank" class="btn btn-link mt-10">Vedi originale</a>` : ''}
            </div>
        `).join('');
    }

    // --- Render Scouting ---
    function renderScoutingList() {
        const tbody = document.getElementById('scouting-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        const searchTerm = document.getElementById('search-scouting').value.toLowerCase();
        
        const scoutingAthletes = state.athletes.filter(a => a.status === 'scouting');
        
        let filtered = scoutingAthletes.filter(s => {
            const nameMatch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm);
            return nameMatch;
        });
        
        filtered.forEach(s => {
            const tr = document.createElement('tr');
            const dobYear = s.dob ? new Date(s.dob).getFullYear() : 'N/D';
            tr.innerHTML = `
                <td><strong>${s.last_name}</strong></td>
                <td><strong>${s.first_name}</strong></td>
                <td>${dobYear}</td>
                <td><span class="tag">${s.position || 'N/D'}</span></td>
                <td>${s.current_club || 'N/D'}</td>
                <td>${s.owned_club || 'N/D'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-scouting-btn" data-id="${s.id}">Apri Scheda</button>
                    <button class="btn btn-sm view-athlete-btn-scouting" data-id="${s.id}" style="background:#00d26a;color:#1a1a2e;">Valutazioni</button>
                    <button class="btn btn-sm delete-scouting-btn" data-id="${s.id}" style="background:var(--danger-color);color:#fff;">Elimina</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.view-athlete-btn-scouting').forEach(btn => {
            btn.addEventListener('click', (e) => {
                navigateTo('athlete-detail', { id: e.currentTarget.getAttribute('data-id') });
            });
        });

        document.querySelectorAll('.edit-scouting-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const scout = state.athletes.find(s => s.id == id);
                document.getElementById('modal-scouting-title').textContent = 'Modifica Scheda Scout';
                document.getElementById('fs-id').value = scout.id;
                document.getElementById('fs-first-name').value = scout.first_name;
                document.getElementById('fs-last-name').value = scout.last_name;
                document.getElementById('fs-dob-year').value = scout.dob ? new Date(scout.dob).getFullYear() : '';
                document.getElementById('fs-position').value = scout.position || '';
                document.getElementById('fs-current-club').value = scout.current_club || '';
                document.getElementById('fs-owned-club').value = scout.owned_club || '';
                document.getElementById('fs-height').value = scout.height || '';
                document.getElementById('fs-weight').value = scout.weight || '';
                document.getElementById('fs-reach').value = scout.reach || '';
                document.getElementById('fs-spike-reach').value = scout.spike_reach || '';
                document.getElementById('fs-block-reach').value = scout.block_reach || '';
                document.getElementById('fs-technical-skills').value = scout.technical_skills || '';
                document.getElementById('fs-notes').value = scout.notes || '';
                document.getElementById('modal-scouting').classList.add('active');
            });
        });

        document.querySelectorAll('.delete-scouting-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Sei sicuro di voler eliminare questa scheda?')) {
                    try {
                        await api.deleteAthlete(id);
                        await loadInitialData();
                        renderScoutingList();
                    } catch (err) {
                        alert("Errore durante l'eliminazione: " + err.message);
                    }
                }
            });
        });
    }

    const searchScouting = document.getElementById('search-scouting');
    if (searchScouting) searchScouting.addEventListener('input', () => renderScoutingList());

    const btnAddScouting = document.getElementById('btn-add-scouting');
    if (btnAddScouting) {
        btnAddScouting.addEventListener('click', () => {
            document.getElementById('modal-scouting-title').textContent = 'Nuova Scheda Scout';
            document.getElementById('fs-id').value = '';
            document.getElementById('fs-first-name').value = '';
            document.getElementById('fs-last-name').value = '';
            document.getElementById('fs-dob-year').value = '';
            document.getElementById('fs-position').value = '';
            document.getElementById('fs-current-club').value = '';
            document.getElementById('fs-owned-club').value = '';
            document.getElementById('fs-height').value = '';
            document.getElementById('fs-weight').value = '';
            document.getElementById('fs-reach').value = '';
            document.getElementById('fs-spike-reach').value = '';
            document.getElementById('fs-block-reach').value = '';
            document.getElementById('fs-technical-skills').value = '';
            document.getElementById('fs-notes').value = '';
            document.getElementById('modal-scouting').classList.add('active');
        });
    }

    const closeScoutingModal = document.getElementById('close-scouting-modal');
    if (closeScoutingModal) {
        closeScoutingModal.addEventListener('click', () => document.getElementById('modal-scouting').classList.remove('active'));
    }

    const formScouting = document.getElementById('form-scouting');
    if (formScouting) {
        formScouting.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('fs-id').value;
            try {
                const formData = new FormData();
                formData.append('first_name', document.getElementById('fs-first-name').value);
                formData.append('last_name', document.getElementById('fs-last-name').value);
                const dobY = document.getElementById('fs-dob-year').value;
                if (dobY) formData.append('dob', `${dobY}-01-01`);
                formData.append('position', document.getElementById('fs-position').value);
                formData.append('current_club', document.getElementById('fs-current-club').value);
                formData.append('owned_club', document.getElementById('fs-owned-club').value);
                formData.append('height', document.getElementById('fs-height').value);
                formData.append('weight', document.getElementById('fs-weight').value);
                formData.append('reach', document.getElementById('fs-reach').value);
                formData.append('spike_reach', document.getElementById('fs-spike-reach').value);
                formData.append('block_reach', document.getElementById('fs-block-reach').value);
                formData.append('technical_skills', document.getElementById('fs-technical-skills').value);
                formData.append('notes', document.getElementById('fs-notes').value);
                formData.append('status', 'scouting');

                if (id) {
                    await api.updateAthlete(id, formData);
                } else {
                    await api.createAthlete(formData);
                }
                document.getElementById('modal-scouting').classList.remove('active');
                await loadInitialData();
                renderScoutingList();
            } catch (err) {
                alert('Errore salvataggio: ' + err.message);
            }
        });
    }

    // Boot
    checkAuth();

    // --- Excel Export ---
    document.getElementById('btn-export-athletes').addEventListener('click', () => {
        const clubAthletes = state.selectedClub ? state.athletes.filter(a => a.teams && a.teams.some(t => t.club === state.selectedClub)) : state.athletes;
        const data = clubAthletes.map(a => {
            const dobYear = a.dob ? new Date(a.dob).getFullYear() : 'N/D';
            const teamsList = a.teams ? a.teams.map(t => t.team_name).join(', ') : '';
            return {
                NOME: a.first_name, 
                COGNOME: a.last_name,
                ANNO: dobYear,
                RUOLO: a.position || 'N/D',
                SQUADRE: teamsList
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Atleti");
        XLSX.writeFile(wb, "Roster_UVA.xlsx");
    });
    
    // --- Dream Team Simulator ---
    const btnOpenDreamTeam = document.getElementById('btn-open-dream-team');
    if (btnOpenDreamTeam) btnOpenDreamTeam.addEventListener('click', () => navigateTo('dream-team'));

    const btnBackFromDreamTeam = document.getElementById('btn-back-from-dream-team');
    if (btnBackFromDreamTeam) btnBackFromDreamTeam.addEventListener('click', () => navigateTo('scouting'));

    let dreamTeamState = { p4: null, p3: null, p2: null, p5: null, p6: null, p1: null, l: null };
    let currentSelectingPos = null;

    function renderDreamTeam() {
        updateDreamTeamUI();
    }

    function drawDreamTeamChart() {
        const selectedAthletes = Object.values(dreamTeamState).filter(a => a !== null);
        
        // Use the existing calculateAverages from renderTeamDetail or replicate it here
        // Replicating since it was scoped to renderTeamDetail previously.
        let attacco = 0, battuta = 0, muro = 0, ricezione = 0, fisico = 3;
        
        if (selectedAthletes.length > 0) {
            const ids = selectedAthletes.map(a => a.id);
            const perfs = state.performances.filter(p => ids.includes(p.athlete_id));
            if (perfs.length > 0) {
                attacco = perfs.reduce((sum, p) => sum + p.attack_points, 0) / perfs.length;
                battuta = perfs.reduce((sum, p) => sum + p.aces, 0) / perfs.length;
                muro = perfs.reduce((sum, p) => sum + p.blocks, 0) / perfs.length;
                ricezione = perfs.reduce((sum, p) => sum + p.reception_perfect, 0) / perfs.length;
            }
        }

        const ctx = document.getElementById('dreamTeamRadarChart');
        if (!ctx) return;
        if (state.dreamTeamRadarInstance) state.dreamTeamRadarInstance.destroy();
        
        state.dreamTeamRadarInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Attacco', 'Battuta', 'Muro', 'Ricezione', 'Fisico'],
                datasets: [{
                    label: 'Media Dream Team',
                    data: [attacco, battuta, muro, ricezione, fisico],
                    backgroundColor: 'rgba(255, 184, 108, 0.2)',
                    borderColor: 'rgba(255, 184, 108, 1)',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(255, 184, 108, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#aaa', font: { size: 10 } },
                        ticks: { display: false, min: 0, max: 10 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    function updateDreamTeamUI() {
        document.querySelectorAll('.dt-court-pos').forEach(posDiv => {
            const posKey = posDiv.getAttribute('data-dt-pos');
            const athlete = dreamTeamState[posKey];
            const nameDiv = posDiv.querySelector('.athlete-name');
            const imgDiv = posDiv.querySelector('.dt-avatar');
            
            if (athlete) {
                nameDiv.textContent = `${athlete.first_name[0]}. ${athlete.last_name}`;
                if (athlete.photo_url) {
                    imgDiv.innerHTML = `<img src="${athlete.photo_url}">`;
                } else {
                    imgDiv.innerHTML = `<i class="fas fa-user-check" style="color: #00d26a;"></i>`;
                }
            } else {
                nameDiv.textContent = 'Vuoto';
                const isLibero = posKey === 'l';
                imgDiv.innerHTML = `<i class="fas fa-user-plus" ${isLibero ? 'style="color:#ffb86c;"' : ''}></i>`;
            }
        });
        drawDreamTeamChart();
    }

    document.querySelectorAll('.dt-court-pos').forEach(posDiv => {
        posDiv.addEventListener('click', () => {
            currentSelectingPos = posDiv.getAttribute('data-dt-pos');
            openPlayerSelectorModal();
        });
    });

    const btnClearDreamTeam = document.getElementById('btn-clear-dream-team');
    if (btnClearDreamTeam) {
        btnClearDreamTeam.addEventListener('click', () => {
            if (confirm('Svuotare l\'intera formazione ideale?')) {
                dreamTeamState = { p4: null, p3: null, p2: null, p5: null, p6: null, p1: null, l: null };
                updateDreamTeamUI();
            }
        });
    }

    // --- Player Selector Modal ---
    const modalPlayerSelector = document.getElementById('modal-player-selector');
    const inputPlayerSearch = document.getElementById('input-player-search');
    const playerSelectorList = document.getElementById('player-selector-list');
    
    function openPlayerSelectorModal() {
        inputPlayerSearch.value = '';
        renderPlayerSelectorList('');
        modalPlayerSelector.classList.add('active');
        setTimeout(() => inputPlayerSearch.focus(), 100);
    }

    document.getElementById('close-player-selector').addEventListener('click', () => {
        modalPlayerSelector.classList.remove('active');
    });

    inputPlayerSearch.addEventListener('input', (e) => {
        renderPlayerSelectorList(e.target.value);
    });

    function renderPlayerSelectorList(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        // Include ALL athletes
        let availableAthletes = [...state.athletes];
        if (searchTerm) {
            availableAthletes = availableAthletes.filter(a => 
                `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm)
            );
        }
        
        playerSelectorList.innerHTML = availableAthletes.map(a => {
            const photoUrl = a.photo_url || 'images/default-avatar.png';
            const club = (a.teams && a.teams.length > 0) ? a.teams[0].club : (a.status === 'scouting' ? 'Osservato' : 'Svincolato');
            const role = a.position || 'Ruolo N/D';
            return `
                <div class="player-select-item card" style="display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; border: 1px solid transparent;" data-athlete-id="${a.id}">
                    <img src="${photoUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #fff;">${a.first_name} ${a.last_name}</div>
                        <div style="font-size: 12px; color: #aaa;">${role} | ${club}</div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.player-select-item').forEach(item => {
            item.addEventListener('mouseover', () => item.style.borderColor = 'var(--primary-color)');
            item.addEventListener('mouseout', () => item.style.borderColor = 'transparent');
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-athlete-id');
                const athlete = state.athletes.find(a => a.id == id);
                if (currentSelectingPos && athlete) {
                    dreamTeamState[currentSelectingPos] = athlete;
                    updateDreamTeamUI();
                }
                modalPlayerSelector.classList.remove('active');
            });
        });
    }

    // --- Club Hub Selection ---
    document.querySelectorAll('.club-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const club = e.currentTarget.getAttribute('data-club');
            state.selectedClub = club;
            document.getElementById('sidebar-club-name').textContent = club.toUpperCase();
            document.getElementById('main-sidebar').style.display = 'flex';
            
            const filterTeam = document.getElementById('filter-team');
            filterTeam.innerHTML = '<option value="">Tutte le Squadre</option>';
            state.teams.filter(t => t.club === club).forEach(t => {
                filterTeam.innerHTML += `<option value="${t.id}">${t.name}</option>`;
            });
            
            navigateTo('dashboard');
        });
    });

    document.getElementById('btn-back-hub').addEventListener('click', () => {
        state.selectedClub = null;
        document.getElementById('main-sidebar').style.display = 'none';
        navigateTo('hub');
    });

    const btnBackup = document.getElementById('btn-full-backup');
    if (btnBackup) {
        btnBackup.addEventListener('click', async () => {
            try {
                btnBackup.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Download...';
                const token = api.getToken();
                const response = await fetch('/api/backup', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Backup fallito');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `UVA_Backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                btnBackup.innerHTML = '<i class="fas fa-download"></i> Backup Completo DB';
            } catch (err) {
                alert('Errore durante il backup: ' + err.message);
                btnBackup.innerHTML = '<i class="fas fa-download"></i> Backup Completo DB';
            }
        });
    }
});
