import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', 
});


api.interceptors.request.use(
    (config) => {
   
        const esRutaAdmin = window.location.pathname.includes('/admin');
        
        
        const token = esRutaAdmin 
            ? localStorage.getItem('admin_token')   
            : localStorage.getItem('vecino_token'); 
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;