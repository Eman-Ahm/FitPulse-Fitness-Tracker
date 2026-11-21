import api from './axios';
export const getWater   = (params) => api.get('/water', { params });
export const logWater   = (data)   => api.post('/water', data);
export const deleteWater = (id)    => api.delete(`/water/${id}`);
