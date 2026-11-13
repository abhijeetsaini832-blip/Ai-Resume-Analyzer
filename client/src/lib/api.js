import axios from 'axios';

/** Single axios instance: attaches JWT, normalises 401s. */
const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 180000 });

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    // Only treat as "logged out" if we actually sent a token that was rejected
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

/** Human-readable error text from an axios error */
export const errMsg = (e) => {
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (e?.request && !e.response) return 'Network error — check your connection and try again.';
  return e?.message || 'Something went wrong';
};

export const authApi = {
  register: (b) => http.post('/auth/register', b).then((r) => r.data),
  login: (b) => http.post('/auth/login', b).then((r) => r.data),
  me: () => http.get('/auth/me').then((r) => r.data),
};

export const companyApi = {
  list: () => http.get('/companies').then((r) => r.data.companies),
};

export const analysisApi = {
  create: (formData) => http.post('/analyses', formData).then((r) => r.data.analysis),
  list: (mode = 'candidate') => http.get('/analyses', { params: { mode } }).then((r) => r.data.analyses),
  get: (id) => http.get(`/analyses/${id}`).then((r) => r.data.analysis),
  remove: (id) => http.delete(`/analyses/${id}`),
  chat: (id, message) => http.post(`/analyses/${id}/chat`, { message }).then((r) => r.data.reply),
  chatHistory: (id) => http.get(`/analyses/${id}/chat`).then((r) => r.data.messages),
  /** ✨ One-click STAR rewrite of a weak bullet */
  rewriteBullet: (analysisId, weakPointId, instructions) => http.post('/rewrite-bullet', { analysisId, weakPointId, instructions }).then((r) => r.data),
  coverLetter: (id, body) => http.post(`/analyses/${id}/cover-letter`, body).then((r) => r.data.letter),
};

export const recruiterApi = {
  createBatch: (formData) => http.post('/recruiter/batches', formData).then((r) => r.data),
  getBatch: (id) => http.get(`/recruiter/batches/${id}`).then((r) => r.data),
  listBatches: () => http.get('/recruiter/batches').then((r) => r.data.batches),
};
