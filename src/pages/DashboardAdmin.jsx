import { useState, useEffect } from 'react';
import api from '../services/api';

const DashboardAdmin = () => {
    // 1. PERSISTENCIA: Inicializamos logueado leyendo el localStorage
    const [logueado, setLogueado] = useState(!!localStorage.getItem('kaislo_token'));
    
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [errorLogin, setErrorLogin] = useState('');
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);
    // Nuevos estados para paginación
    const [paginaActual, setPaginaActual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    
    // 2. CANDADOS ASÍNCRONOS
    const [procesandoLogin, setProcesandoLogin] = useState(false);
    const [procesandoCancelacion, setProcesandoCancelacion] = useState(null); // Guarda el ID de la reserva cancelándose

    const cargarReservas = async () => {
        setCargando(true);
        try {
            // Le pasamos la página actual y le pedimos 5 registros por página
            const respuesta = await api.get(`/reservas?page=${paginaActual}&size=5`);
            
            // Spring Boot mete los datos dentro del atributo "content"
            setReservas(respuesta.data.content); 
            setTotalPaginas(respuesta.data.totalPages);
        } catch (error) {
            console.error("Error al cargar reservas:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                cerrarSesion();
            }
        } finally {
            setCargando(false);
        }
    };

    
    useEffect(() => { 
        if (logueado) cargarReservas(); 
    }, [logueado, paginaActual]);

    const manejarLogin = async (e) => {
        e.preventDefault();
        if (procesandoLogin) return; // Evita doble clic
        
        setErrorLogin('');
        setProcesandoLogin(true);
        
        try {
            const respuesta = await api.post('/admin/login', { usuarioAcceso: usuario, password });
            
            // Guardamos el token real en el navegador
            localStorage.setItem('kaislo_token', respuesta.data.token);
            setLogueado(true);
        } catch {
            setErrorLogin('Credenciales incorrectas. Acceso denegado.');
        } finally {
            setProcesandoLogin(false);
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem('kaislo_token');
        setLogueado(false);
        setUsuario('');
        setPassword('');
    };

    const cancelarReserva = async (idReserva) => {
        if (procesandoCancelacion) return; // Previene doble clic en cancelar
        
        if (window.confirm("¿Seguro que deseas cancelar esta reserva?")) {
            setProcesandoCancelacion(idReserva);
            try {
                await api.put(`/reservas/${idReserva}/estado?estado=Cancelada`);
                cargarReservas();
            } catch (err) {
                alert("Error al cancelar la reserva");
            } finally {
                setProcesandoCancelacion(null);
            }
        }
    };

    // Estadísticas
    const totalReservas = reservas.length;
    const confirmadas = reservas.filter(r => r.estado === 'Confirmada').length;
    const canceladas = reservas.filter(r => r.estado === 'Cancelada').length;

    // --- VISTA 1: LOGIN ---
    if (!logueado) {
        return (
            <div style={s.containerLogin}>
                <div style={s.cardLogin}>
                    <h2 style={s.titleLogin}>Kaislo Admin</h2>
                    {errorLogin && <p style={s.alertError}>{errorLogin}</p>}
                    <form onSubmit={manejarLogin} style={s.form}>
                        <input type="text" placeholder="Usuario" required value={usuario} onChange={e => setUsuario(e.target.value)} style={s.input} />
                        <input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} style={s.input} />
                        <button 
                            type="submit" 
                            disabled={procesandoLogin} 
                            style={{ ...s.btnPrimary, opacity: procesandoLogin ? 0.7 : 1, cursor: procesandoLogin ? 'not-allowed' : 'pointer' }}
                        >
                            {procesandoLogin ? 'Verificando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- VISTA 2: DASHBOARD ---
    return (
        <div style={s.containerDash}>
            <div style={s.headerDash}>
                <div>
                    <h1 style={s.titleDash}>Panel de Control</h1>
                    <p style={s.subtitleDash}>Inmobiliaria Kaislo</p>
                </div>
                <button onClick={cerrarSesion} style={s.btnLogout}>Cerrar Sesión</button>
            </div>

            <div style={s.statsGrid}>
                <div style={s.statCard}><div style={s.statValue}>{totalReservas}</div><div style={s.statLabel}>Total</div></div>
                <div style={s.statCard}><div style={{...s.statValue, color: '#10b981'}}>{confirmadas}</div><div style={s.statLabel}>Confirmadas</div></div>
                <div style={s.statCard}><div style={{...s.statValue, color: '#ef4444'}}>{canceladas}</div><div style={s.statLabel}>Canceladas</div></div>
            </div>

            <div style={s.tableContainer}>
                <div style={s.tableHeader}>
                    <h3 style={s.tableTitle}>Gestión de Turnos</h3>
                    <button onClick={cargarReservas} style={s.btnRefresh}>{cargando ? '↻' : 'Actualizar'}</button>
                </div>
                
                {cargando ? (
                    <p style={s.empty}>Cargando datos del servidor...</p>
                ) : reservas.length === 0 ? (
                    <p style={s.empty}>No hay reservas registradas en el sistema.</p>
                ) : (
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>ID</th>
                                <th style={s.th}>Residente</th>
                                <th style={s.th}>Fecha</th>
                                <th style={s.th}>Horario</th>
                                <th style={s.th}>Estado</th>
                                <th style={s.th}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservas.map(reserva => (
                                <tr key={reserva.idReserva} style={s.tr}>
                                    <td style={s.td}>#{reserva.idReserva}</td>
                                    <td style={s.td}>Residente {reserva.residente?.idResidente || 'N/A'}</td>
                                    <td style={s.td}>{reserva.fechaReserva}</td>
                                    <td style={s.td}>{reserva.horaInicio} - {reserva.horaFin}</td>
                                    <td style={s.td}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                                            background: reserva.estado === 'Confirmada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: reserva.estado === 'Confirmada' ? '#10b981' : '#ef4444'
                                        }}>
                                            {reserva.estado}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        {reserva.estado === 'Confirmada' && (
                                            <button 
                                                onClick={() => cancelarReserva(reserva.idReserva)} 
                                                disabled={procesandoCancelacion === reserva.idReserva}
                                                style={{ 
                                                    ...s.btnAction, 
                                                    opacity: procesandoCancelacion === reserva.idReserva ? 0.5 : 1,
                                                    cursor: procesandoCancelacion === reserva.idReserva ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {procesandoCancelacion === reserva.idReserva ? 'Cancelando...' : 'Cancelar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {/* CONTROLES DE PAGINACIÓN */}
                {!cargando && totalPaginas > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderTop: '1px solid #2e2e36' }}>
                        <span style={{ color: '#a1a1aa', fontSize: '13px' }}>
                            Página {paginaActual + 1} de {totalPaginas}
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 0))}
                                disabled={paginaActual === 0}
                                style={{ ...s.btnRefresh, opacity: paginaActual === 0 ? 0.5 : 1, cursor: paginaActual === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                ← Anterior
                            </button>
                            <button 
                                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas - 1))}
                                disabled={paginaActual >= totalPaginas - 1}
                                style={{ ...s.btnRefresh, opacity: paginaActual >= totalPaginas - 1 ? 0.5 : 1, cursor: paginaActual >= totalPaginas - 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── ESTILOS ──────────────────────────────────────────────
const s = {
    // LOGIN
    loginPage: {
        minHeight: '100vh',
        background: '#0f0f11',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    loginCard: {
        background: '#1a1a1f',
        border: '1px solid #2e2e36',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '360px',
    },
    loginIcon: { fontSize: '36px', marginBottom: '8px' },
    loginTitle: { fontSize: '22px', fontWeight: '700', color: '#f4f4f5', margin: '0 0 4px' },
    loginSub: { fontSize: '13px', color: '#52525b', margin: 0 },
    loginForm: { display: 'flex', flexDirection: 'column', gap: '16px' },

    // DASHBOARD
    page: {
        minHeight: '100vh',
        background: '#0f0f11',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#a1a1aa',
    },
    topbar: {
        background: '#1a1a1f',
        borderBottom: '1px solid #2e2e36',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topbarTitle: { fontSize: '15px', fontWeight: '600', color: '#f4f4f5' },
    main: { maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' },

    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '28px',
    },
    statCard: {
        background: '#1a1a1f',
        border: '1px solid #2e2e36',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
    },
    statLabel: { fontSize: '12px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' },
    statNum: { fontSize: '32px', fontWeight: '700', color: '#f4f4f5', margin: 0 },

    tableCard: {
        background: '#1a1a1f',
        border: '1px solid #2e2e36',
        borderRadius: '16px',
        padding: '24px',
    },
    tableHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    tableTitle: { fontSize: '16px', fontWeight: '600', color: '#f4f4f5', margin: 0 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: {
        padding: '10px 14px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: '600',
        color: '#52525b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid #2e2e36',
    },
    td: { padding: '12px 14px', borderBottom: '1px solid #1f1f24', color: '#a1a1aa' },
    badge: {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },

    // COMPARTIDOS
    alertError: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#fca5a5',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        marginBottom: '16px',
    },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12px', fontWeight: '500', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: {
        background: '#0f0f11',
        border: '1px solid #2e2e36',
        borderRadius: '8px',
        padding: '10px 12px',
        color: '#f4f4f5',
        fontSize: '14px',
        outline: 'none',
        colorScheme: 'dark',
    },
    empty: { color: '#52525b', fontSize: '14px', textAlign: 'center', padding: '40px 0' },
    btnPrimary: {
        background: '#f97316',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        marginTop: '4px',
    },
    btnLogout: {
        background: 'transparent',
        border: '1px solid #2e2e36',
        color: '#a1a1aa',
        borderRadius: '8px',
        padding: '7px 14px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    btnRefresh: {
        background: 'transparent',
        border: '1px solid #2e2e36',
        color: '#a1a1aa',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    btnCancel: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#ef4444',
        borderRadius: '6px',
        padding: '5px 12px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer',
    },
};

export default DashboardAdmin;