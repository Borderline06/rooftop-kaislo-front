import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AutogestionResidente from './pages/AutogestionResidente';
// ¡Aquí importamos tu nuevo archivo real!
import DashboardAdmin from './pages/DashboardAdmin'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal para los vecinos */}
        <Route path="/" element={<AutogestionResidente />} />
        
        {/* Ruta restringida para la inmobiliaria */}
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;