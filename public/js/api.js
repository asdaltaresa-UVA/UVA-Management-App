// API Client for DXT Volley
const API_URL = '/api';

const api = {
    getToken() {
        return localStorage.getItem('dxt_token');
    },
    
    setAuth(token, user) {
        localStorage.setItem('dxt_token', token);
        localStorage.setItem('dxt_user', JSON.stringify(user));
    },

    clearAuth() {
        localStorage.removeItem('dxt_token');
        localStorage.removeItem('dxt_user');
    },

    getUser() {
        const u = localStorage.getItem('dxt_user');
        return u ? JSON.parse(u) : null;
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // If FormData is passed, let browser set the content type
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        const config = {
            method: options.method || 'GET',
            headers,
        };

        if (options.body) {
            config.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            
            if (response.status === 401 || response.status === 403) {
                // Unauthorized
                this.clearAuth();
                window.dispatchEvent(new Event('auth-failed'));
                throw new Error('Non autorizzato');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Errore di rete');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    login(username, password) {
        return this.request('/login', {
            method: 'POST',
            body: { username, password }
        });
    },

    getAthletes() {
        return this.request('/athletes');
    },

    getPerformances() {
        return this.request('/performances');
    },

    getCoaches() {
        return this.request('/coaches');
    },

    getAthlete(id) {
        return this.request(`/athletes/${id}`);
    },

    createAthlete(formData) {
        return this.request('/athletes', {
            method: 'POST',
            body: formData
        });
    },

    updateAthlete(id, formData) {
        return this.request(`/athletes/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    deleteAthlete(id) {
        return this.request(`/athletes/${id}`, {
            method: 'DELETE'
        });
    },

    getTeams() {
        return this.request('/teams');
    },

    createTeam(teamData) {
        return this.request('/teams', {
            method: 'POST',
            body: teamData
        });
    },

    updateTeam(id, teamData) {
        return this.request(`/teams/${id}`, {
            method: 'PUT',
            body: teamData
        });
    },

    getNews() {
        return this.request('/news');
    },

    createNews(newsData) {
        return this.request('/news', {
            method: 'POST',
            body: newsData
        });
    },

    getDynamicFields() {
        return this.request('/fields');
    },

    getCoaches() {
        return this.request('/coaches');
    },

    createCoach(coachData) {
        return this.request('/coaches', {
            method: 'POST',
            body: coachData
        });
    },

    updateCoach(id, coachData) {
        return this.request(`/coaches/${id}`, {
            method: 'PUT',
            body: coachData
        });
    },
    
    deleteCoach(id) {
        return this.request(`/coaches/${id}`, {
            method: 'DELETE'
        });
    },
    
    deleteTeam(id) {
        return this.request(`/teams/${id}`, {
            method: 'DELETE'
        });
    },

    getScouting() {
        return this.request('/scouting');
    },

    createScouting(data) {
        return this.request('/scouting', {
            method: 'POST',
            body: data
        });
    },

    updateScouting(id, data) {
        return this.request(`/scouting/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    deleteScouting(id) {
        return this.request(`/scouting/${id}`, {
            method: 'DELETE'
        });
    },

    getClubs() {
        return this.request('/clubs');
    },

    createClub(data) {
        return this.request('/clubs', {
            method: 'POST',
            body: data,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
