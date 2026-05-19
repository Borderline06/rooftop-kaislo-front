import { useState, useEffect } from 'react';
import api from '../services/api';

const AutogestionResidente = () => {
    const [reservas, setReservas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    // Solo debe existir UNA copia de este bloque:
    const [idResidente, setIdResidente] = useState('');
    const [pin, setPin] = useState(''); // El nuevo estado del PIN
    const [fechaReserva, setFechaReserva] = useState('');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState('12:00:00-17:00:00');

    const [paginaActual, setPaginaActual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    //para prevenir el spam de clics
    const [enviando, setEnviando] = useState(false);

    // Función para obtener la fecha de hoy en formato YYYY-MM-DD
    const obtenerFechaHoy = () => {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const cargarReservas = async () => {
            try {
                // Le enviamos la página actual al servidor
                const respuesta = await api.get(`/reservas?page=${paginaActual}&size=6`); // Traemos de 6 en 6 para que la cuadrícula se vea simétrica
                setReservas(respuesta.data.content || []);
                setTotalPaginas(respuesta.data.totalPages || 0); // Guardamos el total de páginas
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setCargando(false);
            }
        };

        // Ahora React volverá a cargar si el usuario cambia de página
        useEffect(() => { 
            cargarReservas(); 
        }, [paginaActual]);


    // Analiza si el turno seleccionado ya está tomado en la fecha elegida
    const verificarTurnoOcupado = () => {
        if (!fechaReserva) return false;
        const [inicioSel, finSel] = turnoSeleccionado.split('-');
        
        return reservas.some(reserva => 
            reserva.fechaReserva === fechaReserva && 
            reserva.horaInicio === inicioSel && 
            reserva.horaFin === finSel &&
            reserva.estado === 'Confirmada'
        );
    };

    const turnoYaReservado = verificarTurnoOcupado();

    const manejarSubmit = async (e) => {
        e.preventDefault();
        
        
        if (enviando) return; 

        setError('');
        setEnviando(true); 
        
        const [inicio, fin] = turnoSeleccionado.split('-');

        try {
            const nuevaReserva = {
                residente: { 
                    idResidente: parseInt(idResidente),
                    pinAcceso: pin 
                },
                fechaReserva: fechaReserva,
                horaInicio: inicio,
                horaFin: fin
            };

            await api.post('/reservas', nuevaReserva);
            
            setExito(true);
            setTimeout(() => setExito(false), 4000);
            
            // Limpiamos los campos
            setIdResidente(''); 
            setPin(''); 
            setFechaReserva('');
            setTurnoSeleccionado('12:00:00-17:00:00');
            cargarReservas();
            
        } catch (err) {
            setError(err.response?.data || "Error al reservar. El turno ya está ocupado.");
        } finally {
            setEnviando(false); 
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

                    {error && <p style={s.error}>{error}</p>}
                    {exito && <p style={s.exito}>¡Reserva confirmada con éxito!</p>}
                    
                    {/* ALERTA PREVENTIVA SI EL HORARIO YA ESTÁ RESERVADO */}
                    {turnoYaReservado && (
                        <p style={{ 
                            background: 'rgba(234, 179, 8, 0.1)', 
                            color: '#eab308', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            fontSize: '14px', 
                            marginBottom: '16px', 
                            border: '1px solid rgba(234, 179, 8, 0.2)',
                            textAlign: 'center'
                        }}>
                            ⚠️ Este turno ya se encuentra reservado por otro residente. Por favor, elija otra fecha u horario.
                        </p>
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

                            <div>
                                <label style={{ color: '#f4f4f5', fontSize: '14px', marginBottom: '8px', display: 'block' }}>ID Residente:</label>
                                <input type="number" required value={idResidente} onChange={e => setIdResidente(e.target.value)} style={s.input} />
                            </div>
                            
                            {/* --- NUEVO INPUT DE PIN --- */}
                            <div>
                                <label style={{ color: '#f4f4f5', fontSize: '14px', marginBottom: '8px', display: 'block' }}>PIN de Acceso:</label>
                                <input type="password" required value={pin} onChange={e => setPin(e.target.value)} style={{...s.input, width: '120px'}} placeholder="****" />
                            </div>
                            {/* -------------------------- */}
                            <div style={s.field}>
                                <label style={s.label}>Fecha</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={fechaReserva} 
                                    min={obtenerFechaHoy()} 
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
                        <button 
                        type="submit" 
                        disabled={enviando || turnoYaReservado} // Bloqueado si está cargando o si el turno ya fue tomado
                        style={{ 
                            ...s.btn, 
                            opacity: (enviando || turnoYaReservado) ? 0.5 : 1, 
                            cursor: (enviando || turnoYaReservado) ? 'not-allowed' : 'pointer' 
                        }}
                    >
                        {enviando ? 'Procesando...' : 'Confirmar Turno'}
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

                                    {/* CONTROLES DE PAGINACIÓN DEL RESIDENTE */}
                    {!cargando && totalPaginas > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', alignItems: 'center' }}>
                            <button 
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 0))}
                                disabled={paginaActual === 0}
                                style={{ 
                                    background: 'transparent', border: '1px solid #2e2e36', color: '#f4f4f5', 
                                    borderRadius: '6px', padding: '8px 16px', cursor: paginaActual === 0 ? 'not-allowed' : 'pointer',
                                    opacity: paginaActual === 0 ? 0.5 : 1
                                }}
                            >
                                ← Anteriores
                            </button>
                            
                            <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
                                Página {paginaActual + 1} de {totalPaginas}
                            </span>
                            
                            <button 
                                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas - 1))}
                                disabled={paginaActual >= totalPaginas - 1}
                                style={{ 
                                    background: 'transparent', border: '1px solid #2e2e36', color: '#f4f4f5', 
                                    borderRadius: '6px', padding: '8px 16px', cursor: paginaActual >= totalPaginas - 1 ? 'not-allowed' : 'pointer',
                                    opacity: paginaActual >= totalPaginas - 1 ? 0.5 : 1
                                }}
                            >
                                Siguientes →
                            </button>
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