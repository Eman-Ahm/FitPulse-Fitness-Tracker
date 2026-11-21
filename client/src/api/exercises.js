import api from './axios';
export const getExercises   = (params) => api.get('/exercises', { params });
export const createExercise = (data)   => api.post('/exercises', data);
export const deleteExercise = (id)     => api.delete(`/exercises/${id}`);
export const logExercise    = (id, data) => api.post(`/exercises/${id}/log`, data);
