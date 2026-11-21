import api from './axios';
export const getAnalytics      = ()           => api.get('/analytics');
export const getDailyChart     = (days = 7)   => api.get('/analytics/daily', { params: { days } });
