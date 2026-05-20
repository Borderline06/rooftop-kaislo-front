# 💻 Kaislo Rooftop - Interfaz Web (Front-End)

Portal de autogestión de reservas para residentes y centro de mando administrativo para el edificio Kaislo. Diseñado con un enfoque en la experiencia de usuario (UX), seguridad de sesiones y sincronización de datos en tiempo real.

## 🚀 Tecnologías y Herramientas

- Core: React 18 + Vite
- Enrutamiento: React Router DOM
- Peticiones HTTP: Axios (con interceptores dinámicos para JWT)
- Componentes UI: React DatePicker
- Estilos: CSS estructurado e integrado en componentes

## ⚙️ Características Clave

- Sincronización en Tiempo Real: Implementación de "Short Polling" (actualización silenciosa cada 5 segundos) para reflejar nuevas reservas y cancelaciones instantáneamente, previniendo el cruce de horarios.
- Seguridad y Aislamiento (Anti-Colisión): Manejo de sesiones independiente para administradores (admin_token) y vecinos (vecino_token) mediante interceptores de Axios que evalúan la ruta activa.
- Resiliencia (UX): Sistema blindado contra caídas de renderizado (Pantalla Negra) mediante la extracción limpia y segura de mensajes de error JSON provenientes de las respuestas HTTP (ej. 403 Forbidden).

## 🛠️ Instalación y Ejecución Local

1. Clonar el repositorio e ingresar a la carpeta del proyecto:
   git clone https://github.com/Borderline06/rooftop-kaislo-front.git
   cd rooftop-frontend

2. Instalar las dependencias de Node.js:
   npm install

3. Configurar las variables de entorno. Crea un archivo llamado ".env" en la raíz del proyecto y añade la ruta de tu Back-End:
   VITE_API_URL=http://localhost:8080/api

4. Levantar el entorno de desarrollo:
   npm run dev

(El proyecto se ejecutará por defecto en http://localhost:5173)

---

Desarrollado para Kaislo Inmobiliaria.
