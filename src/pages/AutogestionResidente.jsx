import { useState, useEffect } from 'react';
import api from '../services/api';

const AutogestionResidente = () => {
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // Estados simplificados para el formulario
    const [idResidente, setIdResidente] = useState('');
    const [fechaReserva, setFechaReserva] = useState('');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState('12:00:00-17:00:00'); // Turno por defecto

    const cargarReservas = async () => {
        try {
            const respuesta = await api.get('/reservas');
            setReservas(respuesta.data);
        } catch (error) {
            console.error("Error al cargar:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarReservas();
    }, []);

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Separamos el turno seleccionado en horaInicio y horaFin
        const [inicio, fin] = turnoSeleccionado.split('-');

        try {
            const nuevaReserva = {
                residente: { idResidente: parseInt(idResidente) },
                fechaReserva: fechaReserva,
                horaInicio: inicio,
                horaFin: fin
            };

            await api.post('/reservas', nuevaReserva);
            alert('¡Turno reservado con éxito en Kaislo Rooftop!');
            
            setIdResidente(''); setFechaReserva('');
            setTurnoSeleccionado('12:00:00-17:00:00');
            cargarReservas();
            
        } catch (err) {
            setError(err.response?.data || "Error al reservar. El turno ya está ocupado o el ID no existe.");
        }
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center' }}>Zona de Parrillas - Kaislo Rooftop</h1>
            <p style={{ textAlign: 'center', color: '#666' }}>Modelo Self-Service: Recuerda dejar el área limpia al finalizar tu turno.</p>
            
            {/* --- FORMULARIO CON TURNOS FIJOS --- */}
            <div style={{ backgroundColor: '#f4f4f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h3 style={{ marginTop: 0 }}>Reservar un Turno</h3>
                {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
                
                <form onSubmit={manejarSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label>ID Residente:</label><br/>
                        <input type="number" required value={idResidente} onChange={e => setIdResidente(e.target.value)} style={{ padding: '8px', width: '100px' }} />
                    </div>
                    <div>
                        <label>Fecha:</label><br/>
                        <input type="date" required value={fechaReserva} onChange={e => setFechaReserva(e.target.value)} style={{ padding: '8px' }} />
                    </div>
                    <div>
                        <label>Horario Fijo:</label><br/>
                        <select value={turnoSeleccionado} onChange={e => setTurnoSeleccionado(e.target.value)} style={{ padding: '8px', cursor: 'pointer' }}>
                            <option value="12:00:00-17:00:00">Turno Tarde (12:00 PM - 05:00 PM)</option>
                            <option value="18:00:00-23:00:00">Turno Noche (06:00 PM - 11:00 PM)</option>
                        </select>
                    </div>
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Confirmar Turno
                    </button>
                </form>
            </div>

            {/* --- LISTA DE RESERVAS --- */}
            <h2>Turnos Confirmados</h2>
            {cargando ? (
                <p>Cargando datos...</p>
            ) : reservas.length === 0 ? (
                <p>No hay reservas activas. ¡Sé el primero!</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {reservas.map((reserva) => (
                        <li key={reserva.idReserva} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '15px', borderRadius: '8px' }}>
                            <strong>Fecha:</strong> {reserva.fechaReserva} | 
                            <strong> Horario:</strong> {reserva.horaInicio} a {reserva.horaFin} | 
                            <strong> Estado:</strong> <span style={{ color: reserva.estado === 'Confirmada' ? 'green' : 'red', fontWeight: 'bold' }}> {reserva.estado}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutogestionResidente;