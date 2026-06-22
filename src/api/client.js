import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach Bearer token from localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('splatform_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401, clear session and redirect to /login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('splatform_token');
      localStorage.removeItem('splatform_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  verifyEmail: (token) => client.get(`/auth/verify-email?token=${token}`),
  login: (data) => client.post('/auth/login', data),
  me: () => client.get('/auth/me'),
};

// ── Students API ─────────────────────────────────────────────────────────
export const studentAPI = {
  getInterests: () => client.get('/students/interests'),
  saveInterests: (ids) => client.post('/students/interests', { interestIds: ids }),
  getMyInterests: () => client.get('/students/me/interests'),
  getProfile: (studentId) => client.get(`/students/${studentId}`),
  search: (params) => client.get('/students/search', { params }),
};

// ── Roadmap API ──────────────────────────────────────────────────────────
export const roadmapAPI = {
  generate: () => client.post('/roadmap/generate'),
  getMy: () => client.get('/roadmap/my'),
  getById: (id) => client.get(`/roadmap/${id}`),
  recommendationProfile: () => client.post('/roadmap/recommendation-profile'),
};

// ── Buddy API ────────────────────────────────────────────────────────────
export const buddyAPI = {
  getSuggestions: () => client.get('/buddies/suggestions'),
  sendRequest: (data) => client.post('/buddies/request', data),
  respond: (id, action) => client.patch(`/buddies/${id}/respond`, { action }),
  getMy: () => client.get('/buddies/my'),
  getRequests: () => client.get('/buddies/requests'),
};

// ── Skill Exchange API ───────────────────────────────────────────────────
export const skillAPI = {
  post: (data) => client.post('/skills/offer', data),
  getOpen: () => client.get('/skills/open'),
  getMy: () => client.get('/skills/my'),
};

// ── Credits API ──────────────────────────────────────────────────────────
export const creditsAPI = {
  getBalance: () => client.get('/credits/balance'),
  getHistory: () => client.get('/credits/history'),
  getLeaderboard: () => client.get('/credits/leaderboard'),
};

export default client;
