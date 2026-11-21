import api from './axios';
export const getProfile      = ()       => api.get('/profile');
export const updateName      = (name)   => api.put('/profile/name', { name });
export const changePassword  = (data)   => api.put('/profile/password', data);
export const deleteAccount   = (password) => api.delete('/profile', { data: { password } });
