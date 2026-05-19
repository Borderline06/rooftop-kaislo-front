import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importamos las dos vistas que hemos construido
import AutogestionResidente from './pages/AutogestionResidente'; 
import DashboardAdmin from './pages/DashboardAdmin'; 

function App() {
    return (
        <Router>
            <Routes>
                {/* 1. LA RUTA PÚBLICA (El código QR apuntará aquí) */}
                <Route path="/" element={<AutogestionResidente />} />

                {/* 2. LA RUTA PRIVADA (Solo para la Inmobiliaria) */}
                <Route path="/admin/dashboard" element={<DashboardAdmin />} />

                {/* 3. REDIRECCIÓN DE SEGURIDAD (Si escriben una URL que no existe, los manda al inicio) */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;