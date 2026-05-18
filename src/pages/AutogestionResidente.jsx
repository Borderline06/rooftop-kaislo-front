import { useState, useEffect } from 'react';
import api from '../services/api';

const AutogestionResidente = () => {
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    const [idResidente, setIdResidente] = useState('');
    const [fechaReserva, setFechaReserva] = useState('');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState('12:00:00-17:00:00');

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

    useEffect(() => { cargarReservas(); }, []);

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito(false);
        const [inicio, fin] = turnoSeleccionado.split('-');
        try {
            await api.post('/reservas', {
                residente: { idResidente: parseInt(idResidente) },
                fechaReserva,
                horaInicio: inicio,
                horaFin: fin
            });
            setExito(true);
            setIdResidente('');
            setFechaReserva('');
            setTurnoSeleccionado('12:00:00-17:00:00');
            cargarReservas();
            setTimeout(() => setExito(false), 4000);
        } catch (err) {
            setError(err.response?.data || "El turno ya está ocupado o el ID no existe.");
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
    };

    const turnoLabel = (inicio) =>
        inicio?.startsWith('12') ? '🌤 Tarde' : '🌙 Noche';

    return (
        <div style={s.page}>
            {/* HEADER */}
            <header style={s.header}>
                <div style={s.headerInner}>
                    <div>
                        <h1 style={s.title}>Kaislo Rooftop</h1>
                        <p style={s.subtitle}>Zona de Parrillas — Self Service</p>
                    </div>
                </div>
                <p style={s.notice}>Recuerda dejar el área limpia al finalizar tu turno</p>
            </header>

            <main style={s.main}>
                {/* FORMULARIO */}
                <section style={s.card}>
                    <h2 style={s.cardTitle}>
                        <span style={s.dot} />
                        Reservar un Turno
                    </h2>

                    {error && (
                        <div style={s.alertError}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {exito && (
                        <div style={s.alertSuccess}>
                            <span>✅</span> ¡Turno reservado con éxito!
                        </div>
                    )}

                    <form onSubmit={manejarSubmit} style={s.form}>
                        <div style={s.formGrid}>
                            <div style={s.field}>
                                <label style={s.label}>ID Residente</label>
                                <input
                                    type="number"
                                    required
                                    value={idResidente}
                                    onChange={e => setIdResidente(e.target.value)}
                                    placeholder="Ej: 101"
                                    style={s.input}
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={fechaReserva}
                                    onChange={e => setFechaReserva(e.target.value)}
                                    style={s.input}
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Horario</label>
                                <select
                                    value={turnoSeleccionado}
                                    onChange={e => setTurnoSeleccionado(e.target.value)}
                                    style={s.input}
                                >
                                    <option value="12:00:00-17:00:00">🌤 Tarde (12:00 PM – 5:00 PM)</option>
                                    <option value="18:00:00-23:00:00">🌙 Noche (6:00 PM – 11:00 PM)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" style={s.btn}>
                            Confirmar Turno →
                        </button>
                    </form>
                </section>

                {/* LISTA */}
                <section style={{ marginTop: '36px' }}>
                    <h2 style={s.sectionTitle}>Turnos Confirmados</h2>

                    {cargando ? (
                        <p style={s.empty}>Cargando...</p>
                    ) : reservas.length === 0 ? (
                        <p style={s.empty}>No hay reservas activas. ¡Sé el primero!</p>
                    ) : (
                        <div style={s.grid}>
                            {reservas.map((r) => (
                                <div key={r.idReserva} style={s.reservaCard}>
                                    <div style={s.reservaTop}>
                                        <span style={s.turnoTag}>{turnoLabel(r.horaInicio)}</span>
                                        <span style={{
                                            ...s.estadoBadge,
                                            background: r.estado === 'Confirmada' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: r.estado === 'Confirmada' ? '#22c55e' : '#ef4444',
                                        }}>
                                            {r.estado}
                                        </span>
                                    </div>
                                    <p style={s.reservaFecha}>📅 {formatearFecha(r.fechaReserva)}</p>
                                    <p style={s.reservaHora}>🕐 {r.horaInicio?.slice(0,5)} – {r.horaFin?.slice(0,5)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

// ── ESTILOS ──────────────────────────────────────────────
const s = {
    page: {
        minHeight: '100vh',
        background: '#0f0f11',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#a1a1aa',
    },
    header: {
        background: 'linear-gradient(135deg, #1a1a1f 0%, #0f0f11 100%)',
        borderBottom: '1px solid #2e2e36',
        padding: '32px 24px 24px',
        textAlign: 'center',
    },
    headerInner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginBottom: '8px',
    },
    flame: { fontSize: '40px' },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#f4f4f5',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: '13px',
        color: '#f97316',
        margin: '2px 0 0',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    notice: {
        fontSize: '13px',
        color: '#52525b',
        margin: '8px 0 0',
    },
    main: {
        maxWidth: '720px',
        margin: '0 auto',
        padding: '36px 20px',
    },
    card: {
        background: '#1a1a1f',
        border: '1px solid #2e2e36',
        borderRadius: '16px',
        padding: '28px',
    },
    cardTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#f4f4f5',
        margin: '0 0 20px',
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#f97316',
        display: 'inline-block',
        flexShrink: 0,
    },
    alertError: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#fca5a5',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '14px',
        marginBottom: '16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    alertSuccess: {
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid rgba(34,197,94,0.3)',
        color: '#86efac',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '14px',
        marginBottom: '16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
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
        width: '100%',
        colorScheme: 'dark',
    },
    btn: {
        background: '#f97316',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        alignSelf: 'flex-start',
        letterSpacing: '0.2px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#f4f4f5',
        marginBottom: '16px',
    },
    empty: { color: '#52525b', fontSize: '14px', textAlign: 'center', padding: '40px 0' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px',
    },
    reservaCard: {
        background: '#1a1a1f',
        border: '1px solid #2e2e36',
        borderRadius: '12px',
        padding: '16px',
    },
    reservaTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    turnoTag: { fontSize: '13px', fontWeight: '500', color: '#f4f4f5' },
    estadoBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '3px 8px',
        borderRadius: '20px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    reservaFecha: { fontSize: '13px', color: '#a1a1aa', margin: '0 0 4px' },
    reservaHora: { fontSize: '12px', color: '#52525b', margin: 0 },
};

export default AutogestionResidente;