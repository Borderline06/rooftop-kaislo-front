import { useState, useEffect } from 'react';
import api from '../services/api';

const DashboardAdmin = () => {
    const [logueado, setLogueado] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [errorLogin, setErrorLogin] = useState('');
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarReservas = async () => {
        setCargando(true);
        try {
            const respuesta = await api.get('/reservas');
            setReservas(respuesta.data);
        } catch (error) {
            console.error("Error al cargar reservas:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { if (logueado) cargarReservas(); }, [logueado]);

    const manejarLogin = async (e) => {
        e.preventDefault();
        setErrorLogin('');
        try {
            await api.post('/admin/login', { usuarioAcceso: usuario, password });
            setLogueado(true);
        } catch {
            setErrorLogin('Credenciales incorrectas. Acceso denegado.');
        }
    };

    const cancelarReserva = async (idReserva) => {
        if (window.confirm("¿Seguro que deseas cancelar esta reserva?")) {
            try {
                await api.put(`/reservas/${idReserva}/estado?estado=Cancelada`);
                cargarReservas();
            } catch {
                alert("Error al cancelar la reserva");
            }
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
    };

    const confirmadas = reservas.filter(r => r.estado === 'Confirmada').length;
    const canceladas = reservas.filter(r => r.estado === 'Cancelada').length;

    // ── LOGIN ──
    if (!logueado) {
        return (
            <div style={s.loginPage}>
                <div style={s.loginCard}>
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={s.loginIcon}>🔥</div>
                        <h2 style={s.loginTitle}>Kaislo Admin</h2>
                        <p style={s.loginSub}>Panel de control interno</p>
                    </div>

                    {errorLogin && (
                        <div style={s.alertError}>⚠️ {errorLogin}</div>
                    )}

                    <form onSubmit={manejarLogin} style={s.loginForm}>
                        <div style={s.field}>
                            <label style={s.label}>Usuario</label>
                            <input
                                type="text"
                                required
                                placeholder="admin"
                                value={usuario}
                                onChange={e => setUsuario(e.target.value)}
                                style={s.input}
                            />
                        </div>
                        <div style={s.field}>
                            <label style={s.label}>Contraseña</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={s.input}
                            />
                        </div>
                        <button type="submit" style={s.btnPrimary}>
                            Ingresar →
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ── DASHBOARD ──
    return (
        <div style={s.page}>
            {/* TOPBAR */}
            <header style={s.topbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🔥</span>
                    <span style={s.topbarTitle}>Kaislo Rooftop — Admin</span>
                </div>
                <button onClick={() => setLogueado(false)} style={s.btnLogout}>
                    Cerrar Sesión
                </button>
            </header>

            <main style={s.main}>
                {/* STATS */}
                <div style={s.statsGrid}>
                    <div style={s.statCard}>
                        <p style={s.statLabel}>Total Reservas</p>
                        <p style={s.statNum}>{reservas.length}</p>
                    </div>
                    <div style={s.statCard}>
                        <p style={s.statLabel}>Confirmadas</p>
                        <p style={{ ...s.statNum, color: '#22c55e' }}>{confirmadas}</p>
                    </div>
                    <div style={s.statCard}>
                        <p style={s.statLabel}>Canceladas</p>
                        <p style={{ ...s.statNum, color: '#ef4444' }}>{canceladas}</p>
                    </div>
                </div>

                {/* TABLA */}
                <div style={s.tableCard}>
                    <div style={s.tableHeader}>
                        <h2 style={s.tableTitle}>Gestión de Reservas</h2>
                        <button onClick={cargarReservas} style={s.btnRefresh}>↻ Actualizar</button>
                    </div>

                    {cargando ? (
                        <p style={s.empty}>Cargando...</p>
                    ) : reservas.length === 0 ? (
                        <p style={s.empty}>No hay reservas registradas.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={s.table}>
                                <thead>
                                <tr>
                                    {['ID', 'Residente', 'Fecha', 'Turno', 'Estado', 'Acción'].map(col => (
                                        <th key={col} style={s.th}>{col}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {reservas.map((r, i) => (
                                    <tr key={r.idReserva} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                        <td style={s.td}>#{r.idReserva}</td>
                                        <td style={s.td}>{r.residente?.idResidente || 'N/A'}</td>
                                        <td style={s.td}>{formatearFecha(r.fechaReserva)}</td>
                                        <td style={s.td}>
                                            {r.horaInicio?.startsWith('12') ? '🌤 Tarde' : '🌙 Noche'}
                                        </td>
                                        <td style={s.td}>
                                                <span style={{
                                                    ...s.badge,
                                                    background: r.estado === 'Confirmada' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                                    color: r.estado === 'Confirmada' ? '#22c55e' : '#ef4444',
                                                }}>
                                                    {r.estado}
                                                </span>
                                        </td>
                                        <td style={s.td}>
                                            {r.estado === 'Confirmada' && (
                                                <button
                                                    onClick={() => cancelarReserva(r.idReserva)}
                                                    style={s.btnCancel}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
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