import api from './axios';

export const getWorkouts  = (params) => api.get('/workouts', { params });
export const getWorkout   = (id)     => api.get(`/workouts/${id}`);
export const createWorkout = (data)  => api.post('/workouts', data);
export const updateWorkout = (id, data) => api.put(`/workouts/${id}`, data);
export const deleteWorkout = (id)    => api.delete(`/workouts/${id}`);
