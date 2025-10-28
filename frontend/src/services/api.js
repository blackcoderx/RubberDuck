import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Explanations API
export const explanationsAPI = {
  // Create new explanation
  create: async (concept) => {
    const response = await api.post('/api/explanations', { concept });
    return response.data;
  },

  // Get all explanations (for sidebar)
  getAll: async () => {
    const response = await api.get('/api/explanations');
    return response.data;
  },

  // Get specific explanation with chapters
  getById: async (id) => {
    const response = await api.get(`/api/explanations/${id}`);
    return response.data;
  },

  // Get explanation status (for polling)
  getStatus: async (id) => {
    const response = await api.get(`/api/explanations/${id}/status`);
    return response.data;
  },
};

// Chapters API
export const chaptersAPI = {
  // Get chapter with all content
  getById: async (id) => {
    const response = await api.get(`/api/chapters/${id}`);
    return response.data;
  },
};

export default api;