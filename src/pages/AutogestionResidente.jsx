import { useState, useEffect } from 'react';
import api from '../services/api';

import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es'; 


registerLocale('es', es);

const TURNOS_DISPONIBLES = [
    { id: '12:00:00-15:00:00', label: '12:00 PM - 03:00 PM', icono: '☀️' },
    { id: '15:00:00-18:00:00', label: '03:00 PM - 06:00 PM', icono: '🌤️' },
    { id: '18:00:00-21:00:00', label: '06:00 PM - 09:00 PM', icono: '🌙' },
    { id: '21:00:00-00:00:00', label: '09:00 PM - 12:00 AM', icono: '✨' }
];

const AutogestionResidente = () => {
    // SESIÓN DEL VECINO
    const [residenteLogueado, setResidenteLogueado] = useState(null); // Guarda { numeroDepartamento, pinAcceso }
    const [vistaActual, setVistaActual] = useState('NUEVA_RESERVA'); // 'NUEVA_RESERVA' o 'MIS_RESERVAS'

    // ESTADOS FORMULARIO LOGIN
    const [depaLogin, setDepaLogin] = useState('');
    const [pinLogin, setPinLogin] = useState('');
    const [errorLogin, setErrorLogin] = useState('');

    // ESTADOS RESERVA
    const [fechaReserva, setFechaReserva] = useState('');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
    
    // DATOS DEL SISTEMA
    const [todasLasReservas, setTodasLasReservas] = useState([]);
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [mostrarModal, setMostrarModal] = useState(false);

    useEffect(() => {
        // 1. Buscamos en la bóveda del navegador
        const tokenGuardado = localStorage.getItem('vecino_token');
        const depaGuardado = localStorage.getItem('vecino_depa');

        // 2. Si ambas cosas existen, significa que el usuario ya se había logueado antes
        if (tokenGuardado && depaGuardado) {
            // 3. Restauramos la sesión en la memoria RAM de React
            setResidenteLogueado({ 
                numeroDepartamento: depaGuardado 
            });
        }
    }, []);

    const cargarReservasGlobales = async () => {
        try {
            const respuesta = await api.get('/reservas?page=0&size=100'); 
            const confirmadas = (respuesta.data.content || []).filter(r => r.estado === 'Confirmada');
            setTodasLasReservas(confirmadas);
        } catch (error) {
            console.error("Error al cargar disponibilidad:", error);
        }
    };

    useEffect(() => {
        if (residenteLogueado) cargarReservasGlobales();
    }, [residenteLogueado]);

    // --- LÓGICA DE LOGIN ---
    const manejarLogin = async (e) => {
        e.preventDefault();
        setErrorLogin('');
        setMensaje({ texto: '', tipo: '' }); // Limpiamos alertas previas
        setProcesando(true);
        try {
            // Recibimos la respuesta completa que ahora trae el token
            const respuesta = await api.post('/reservas/vecino/login', { 
                numeroDepartamento: depaLogin, 
                pinAcceso: pinLogin 
            });
            
            //Guardamos el token y el depa en el LocalStorage
            localStorage.setItem('vecino_token', respuesta.data.token);
            localStorage.setItem('vecino_depa', respuesta.data.numeroDepartamento); // <-- ¡ESTA LÍNEA FALTABA!
            
            // Guardamos el estado para la interfaz
            setResidenteLogueado({ 
                numeroDepartamento: respuesta.data.numeroDepartamento, 
                pinAcceso: pinLogin 
            });
        } catch (err) {
            setErrorLogin('Departamento o PIN incorrectos.');
        } finally {
            setProcesando(false);
        }
    };

    const cerrarSesion = () => {
        setResidenteLogueado(null);
        setDepaLogin('');
        setPinLogin('');
        setVistaActual('NUEVA_RESERVA');
        setMensaje({ texto: '', tipo: '' });
        setFechaReserva('');
        setTurnoSeleccionado('');
        
        //LIMPIEZA: Borramos la llave al salir
        localStorage.removeItem('vecino_token');
    };

    // --- LÓGICA DE RESERVAS ---
    const esTurnoOcupado = (idTurno) => {
        if (!fechaReserva) return false;
        const [inicio, fin] = idTurno.split('-');
        return todasLasReservas.some(r => r.fechaReserva === fechaReserva && r.horaInicio === inicio && r.horaFin === fin);
    };

    const confirmarReserva = async () => {
        setProcesando(true);
        const [inicio, fin] = turnoSeleccionado.split('-');

        try {
            await api.post('/reservas', {
                residente: { numeroDepartamento: residenteLogueado.numeroDepartamento, pinAcceso: residenteLogueado.pinAcceso },
                fechaReserva, horaInicio: inicio, horaFin: fin
            });
            
            setMensaje({ texto: '¡Reserva confirmada!', tipo: 'exito' });
            setFechaReserva('');
            setTurnoSeleccionado('');
            setMostrarModal(false);
            cargarReservasGlobales();
            setVistaActual('MIS_RESERVAS'); // Lo mandamos a ver su reserva
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } catch (error) {
            setMostrarModal(false);
            setMensaje({ texto: error.response?.data || "Error al reservar.", tipo: 'error' });
        } finally {
            setProcesando(false);
        }
    };

    const cancelarMiReserva = async (idReserva) => {
        if (window.confirm("¿Seguro que deseas cancelar esta reserva? Este horario quedará libre para otros vecinos.")) {
            try {
                await api.put(`/reservas/${idReserva}/estado?estado=Cancelada`);
                cargarReservasGlobales();
            } catch (err) {
                alert("Error al cancelar.");
            }
        }
    };

    // Filtramos para mostrar solo las reservas del vecino logueado
    const misReservas = todasLasReservas.filter(r => r.residente?.numeroDepartamento === residenteLogueado?.numeroDepartamento);
    const fechaMinima = new Date().toISOString().split('T')[0];

    // ==========================================
    // PANTALLA 1: LOGIN VECINO (Wireframe 1)
    // ==========================================
    if (!residenteLogueado) {
        return (
            <div style={s.contenedorCentrado}>
                <div style={s.tarjeta}>
                    <div style={s.cabecera}>
                        <h1 style={s.titulo}>Kaislo Rooftop</h1>
                        <p style={s.subtitulo}>Portal de Residentes</p>
                    </div>
                    <form onSubmit={manejarLogin} style={{ padding: '30px 24px' }}>
                        {errorLogin && <p style={s.alertaError}>{errorLogin}</p>}
                        <div style={s.field}>
                            <label style={s.label}>N° Departamento</label>
                            <input type="text" required value={depaLogin} onChange={e => setDepaLogin(e.target.value)} placeholder="Ej: 101" style={s.inputBlanco} />
                        </div>
                        <div style={{ ...s.field, marginTop: '16px' }}>
                            <label style={s.label}>PIN de Acceso</label>
                            <input type="password" required value={pinLogin} onChange={e => setPinLogin(e.target.value)} placeholder="••••" maxLength="4" style={s.inputBlanco} />
                        </div>
                        <button type="submit" disabled={procesando} style={{ ...s.btnPrimario, marginTop: '24px' }}>
                            {procesando ? 'Verificando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ==========================================
    // PANTALLAS 2 Y 3: PORTAL DEL RESIDENTE
    // ==========================================
    return (
        <div style={s.contenedorCentrado}>
            <div style={s.tarjeta}>
                {/* Cabecera del Portal */}
                <div style={s.cabecera}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={s.titulo}>Depa {residenteLogueado.numeroDepartamento}</h1>
                            <p style={s.subtitulo}>Kaislo Rooftop</p>
                        </div>
                        <button onClick={cerrarSesion} style={s.btnSalir}>Salir</button>
                    </div>
                </div>

                {/* Navegación de Pestañas */}
                <div style={s.tabsContainer}>
                    <button onClick={() => setVistaActual('NUEVA_RESERVA')} style={vistaActual === 'NUEVA_RESERVA' ? s.tabActivo : s.tabInactivo}>
                        📅 Reservar
                    </button>
                    <button onClick={() => setVistaActual('MIS_RESERVAS')} style={vistaActual === 'MIS_RESERVAS' ? s.tabActivo : s.tabInactivo}>
                        📋 Mis Reservas ({misReservas.length})
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {mensaje.texto && <div style={mensaje.tipo === 'error' ? s.alertaError : s.alertaExito}>{mensaje.texto}</div>}

                    {/* VISTA: NUEVA RESERVA (Wireframe 2) */}
                    {vistaActual === 'NUEVA_RESERVA' && (
                        <div>
                            <div style={s.field}>
                                <label style={s.label}>1. Elige una fecha</label>
                                
                                {/* EL NUEVO CALENDARIO */}
                                <div style={s.calendarioContenedor}>
                                    <DatePicker
                                        selected={fechaReserva ? new Date(fechaReserva + 'T12:00:00') : null}
                                        onChange={(date) => {
                                            // Convertimos la fecha de JS al formato YYYY-MM-DD que espera Java
                                            const fechaFormateada = date.toISOString().split('T')[0];
                                            setFechaReserva(fechaFormateada);
                                            setTurnoSeleccionado(''); 
                                        }}
                                        minDate={new Date()}
                                        locale="es"
                                        inline 
                                    />
                                </div>
                            </div>

                            {fechaReserva && (
                                <div style={{ marginTop: '24px' }}>
                                    <label style={s.label}>2. Selecciona un horario</label>
                                    <div style={s.gridHorarios}>
                                        {TURNOS_DISPONIBLES.map((turno) => {
                                            const ocupado = esTurnoOcupado(turno.id);
                                            const seleccionado = turnoSeleccionado === turno.id;
                                            return (
                                                <button key={turno.id} type="button" disabled={ocupado} onClick={() => setTurnoSeleccionado(turno.id)}
                                                    style={{
                                                        ...s.btnHorario,
                                                        background: ocupado ? '#f1f5f9' : seleccionado ? '#1e3a8a' : '#ffffff',
                                                        color: ocupado ? '#94a3b8' : seleccionado ? '#ffffff' : '#334155',
                                                        borderColor: seleccionado ? '#1e3a8a' : '#cbd5e1',
                                                        cursor: ocupado ? 'not-allowed' : 'pointer'
                                                    }}>
                                                    <span style={{ fontSize: '18px' }}>{turno.icono}</span>
                                                    <span style={{ fontWeight: '500', fontSize: '13px', marginTop: '4px' }}>
                                                        {ocupado ? 'Ocupado' : turno.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => { if(turnoSeleccionado) setMostrarModal(true); else setMensaje({texto: 'Elige un horario', tipo:'error'}) }} style={{ ...s.btnPrimario, marginTop: '24px' }}>
                                        Confirmar Reserva
                                    </button>

                                    {/* LISTA DE OCUPADOS DEL DÍA */}
                                    {fechaReserva && (
                                        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                            <h4 style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>
                                                Disponibilidad para el {fechaReserva.split('-').reverse().join('-')}:
                                            </h4>
                                            
                                            {todasLasReservas.filter(r => r.fechaReserva === fechaReserva).length === 0 ? (
                                                <p style={{ fontSize: '13px', color: '#16a34a' }}>✨ ¡Todo el día está libre!</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {todasLasReservas
                                                        .filter(r => r.fechaReserva === fechaReserva)
                                                        .map(r => {
                                                            // Buscamos el nombre del turno para mostrarlo bonito
                                                            const turnoInfo = TURNOS_DISPONIBLES.find(t => t.id === `${r.horaInicio}-${r.horaFin}`);
                                                            return (
                                                                <div key={r.idReserva} style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}>
                                                                    <span style={{ color: '#64748b' }}>⏰ {turnoInfo?.label}</span>
                                                                    <span style={{ fontWeight: '600', color: '#94a3b8' }}>Reservado</span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    )}


                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA: MIS RESERVAS (Wireframe 3) */}
                    {vistaActual === 'MIS_RESERVAS' && (
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b' }}>Tus horarios confirmados</h3>
                            {misReservas.length === 0 ? (
                                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No tienes reservas activas.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {misReservas.map(r => (
                                        <div key={r.idReserva} style={s.tarjetaReserva}>
                                            <div>
                                                <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#0f172a' }}>
                                                    📅 {r.fechaReserva.split('-').reverse().join('-')}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>⏰ {TURNOS_DISPONIBLES.find(t => t.id === `${r.horaInicio}-${r.horaFin}`)?.label || `${r.horaInicio} - ${r.horaFin}`}</p>
                                            </div>
                                            <button onClick={() => cancelarMiReserva(r.idReserva)} style={s.btnEliminar}>❌ Cancelar</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {mostrarModal && (
                <div style={s.modalOverlay}>
                    <div style={s.modalContenido}>
                        <h2 style={s.modalTitulo}>Confirmar Reserva</h2>
                        <div style={s.modalDetalles}>
                            <p>📅 <strong>{fechaReserva}</strong></p>
                            <p>⏰ <strong>{TURNOS_DISPONIBLES.find(t => t.id === turnoSeleccionado)?.label}</strong></p>
                        </div>
                        <div style={s.modalBotones}>
                            <button onClick={() => setMostrarModal(false)} disabled={procesando} style={s.btnCancelar}>Volver</button>
                            <button onClick={confirmarReserva} disabled={procesando} style={s.btnConfirmar}>{procesando ? 'Procesando...' : 'Sí, reservar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ESTILOS
const s = {
    contenedorCentrado: { minHeight: '100vh', background: '#f8fafc', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', fontFamily: 'system-ui, sans-serif' },
    tarjeta: { background: '#ffffff', width: '100%', maxWidth: '450px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '2vh' },
    cabecera: { background: '#1e3a8a', padding: '24px', color: '#ffffff' },
    titulo: { margin: 0, fontSize: '22px', fontWeight: '700' },
    subtitulo: { margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 },
    btnSalir: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
    
    // TABS
    tabsContainer: { display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
    tabActivo: { flex: 1, padding: '14px', background: '#ffffff', border: 'none', borderBottom: '2px solid #1e3a8a', color: '#1e3a8a', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
    tabInactivo: { flex: 1, padding: '14px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#64748b', fontWeight: '500', fontSize: '14px', cursor: 'pointer' },
    
    // FORMULARIO
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
    inputBlanco: { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', outline: 'none', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' },
    gridHorarios: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    btnHorario: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', border: '2px solid', borderRadius: '10px', transition: 'all 0.2s' },
    btnPrimario: { width: '100%', padding: '14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    
    // ALERTAS
    alertaError: { background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #fecaca', marginBottom: '16px' },
    alertaExito: { background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #bbf7d0', marginBottom: '16px' },
    
    // MIS RESERVAS
    tarjetaReserva: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px' },
    btnEliminar: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    
    // MODAL
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 1000 },
    modalContenido: { background: '#ffffff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '320px' },
    modalTitulo: { margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', textAlign: 'center' },
    modalDetalles: { background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '15px', color: '#334155', border: '1px solid #e2e8f0' },
    modalBotones: { display: 'flex', gap: '10px' },
    btnCancelar: { flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
    btnConfirmar: { flex: 1, padding: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },

    calendarioContenedor: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10px',
        // Inyectamos variables CSS para sobreescribir el azul por defecto de la librería por el azul Kaislo
        '--react-datepicker-bg': '#ffffff',
        '--react-datepicker-primary-color': '#1e3a8a', 
    },
};

export default AutogestionResidente;