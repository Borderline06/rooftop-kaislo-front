import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import PanelAdmin from './pages/PanelAdmin';


import AutogestionResidente from './pages/AutogestionResidente'; 


function App() {
    return (
        <Router>
            <Routes>
                {/* 1. RUTA PÚBLICA  */}
                <Route path="/" element={<AutogestionResidente />} />

                

                {/* REDIRECCIÓN*/}
                <Route path="*" element={<Navigate to="/" />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/panel" element={<PanelAdmin />} />
            </Routes>
        </Router>
    );
}

export default App;