import api from './axios';
export const getAchievements = () => api.get('/achievements');
export const checkAchievements = () => api.post('/achievements/check');
