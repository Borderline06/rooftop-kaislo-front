import { useState, useEffect } from 'react';
import api from '../services/api';

const DashboardAdmin = () => {
    // Estados para el Login
    const [logueado, setLogueado] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [errorLogin, setErrorLogin] = useState('');

    // Estados para el Dashboard
    const [reservas, setReservas] = useState([]);

    const cargarReservas = async () => {
        try {
            const respuesta = await api.get('/reservas');
            setReservas(respuesta.data);
        } catch (error) {
            console.error("Error al cargar reservas:", error);
        }
    };

    useEffect(() => {
        if (logueado) cargarReservas();
    }, [logueado]);

    const manejarLogin = async (e) => {
        e.preventDefault();
        setErrorLogin('');
        try {
            // Llama al endpoint de login que usa BCrypt en Java
            await api.post('/admin/login', {
                usuarioAcceso: usuario,
                password: password
            });
            setLogueado(true);
        } catch (err) {
            setErrorLogin('Credenciales incorrectas. Acceso denegado.');
        }
    };

    const cancelarReserva = async (idReserva) => {
        if (window.confirm("¿Seguro que deseas cancelar esta reserva?")) {
            try {
                // Llama al método PUT para cambiar el estado
                await api.put(`/reservas/${idReserva}/estado?estado=Cancelada`);
                cargarReservas(); // Recargamos la tabla
            } catch (err) {
                alert("Error al cancelar la reserva");
            }
        }
    };

    // --- VISTA 1: PANTALLA DE LOGIN ---
    if (!logueado) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#eee', fontFamily: 'system-ui' }}>
                <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '300px' }}>
                    <h2 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>Kaislo Admin</h2>
                    {errorLogin && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{errorLogin}</p>}
                    
                    <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" placeholder="Usuario" required value={usuario} onChange={e => setUsuario(e.target.value)} style={{ padding: '10px' }} />
                        <input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px' }} />
                        <button type="submit" style={{ padding: '10px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>Ingresar</button>
                    </form>
                </div>
            </div>
        );
    }

    // --- VISTA 2: DASHBOARD (Solo visible si el login fue exitoso) ---
    return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Panel de Control - Inmobiliaria Kaislo</h1>
                <button onClick={() => setLogueado(false)} style={{ padding: '8px 16px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>
            </div>
            
            <h3>Gestión de Reservas</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f5', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ID Reserva</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ID Residente</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Fecha</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Turno</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Estado</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {reservas.map(reserva => (
                        <tr key={reserva.idReserva}>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{reserva.idReserva}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{reserva.residente?.idResidente || 'N/A'}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{reserva.fechaReserva}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{reserva.horaInicio} - {reserva.horaFin}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                <span style={{ color: reserva.estado === 'Confirmada' ? 'green' : 'red', fontWeight: 'bold' }}>{reserva.estado}</span>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                {reserva.estado === 'Confirmada' && (
                                    <button onClick={() => cancelarReserva(reserva.idReserva)} style={{ padding: '6px 12px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DashboardAdmin;