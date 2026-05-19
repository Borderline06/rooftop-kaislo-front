import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('kaislo_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.request.use(
    (config) => {
        // 1. Si es un login, pasa directo sin token
        if (config.url.includes('/vecino/login') || config.url.includes('/admin/login')) {
            return config;
        }

        // 2. ¿De qué lado de la aplicación estamos navegando?
        const isAdminRoute = window.location.pathname.includes('/admin');
        
        // 3. Elegimos la llave correcta
        const tokenName = isAdminRoute ? 'kaislo_token' : 'vecino_token';
        const token = localStorage.getItem(tokenName);

        // 4. Adjuntamos la llave si existe
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;