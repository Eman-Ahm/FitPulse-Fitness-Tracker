import api from './axios';
export const getMeasurements   = ()       => api.get('/measurements');
export const createMeasurement = (data)   => api.post('/measurements', data);
export const deleteMeasurement = (id)     => api.delete(`/measurements/${id}`);
