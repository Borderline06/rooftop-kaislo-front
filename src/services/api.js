import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

// Interceptor para peticiones salientes (adjuntar token)
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

// INTERCEPTOR DE RESPUESTAS: Detecta si el servidor nos rebota por token vencido
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Limpiamos el token expirado de la sesión
            localStorage.removeItem('kaislo_token');
            // Redirigimos inmediatamente a la pantalla de login del administrador
            window.location.href = '/admin/dashboard';
        }
        return Promise.reject(error);
    }
);

export default api;