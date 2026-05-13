import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const AutogestionResidente = () => <div>Vista de Autogestión (Calendario)</div>;
const DashboardAdmin = () => <div>Panel de Control Kaislo</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AutogestionResidente />} />
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;