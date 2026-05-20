import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PanelAdmin = () => {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [vistaActiva, setVistaActiva] = useState('DASHBOARD');

    // --- ESTADOS DEL MÓDULO RESIDENTES ---
    const [residentes, setResidentes] = useState([]);
    const [nuevoDepa, setNuevoDepa] = useState('');
    const [nuevoPin, setNuevoPin] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoTelefono, setNuevoTelefono] = useState('');

    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEditando, setIdEditando] = useState(null);

    // --- ESTADOS DEL MÓDULO RESERVAS ---
    const [reservas, setReservas] = useState([]);
    const [busquedaDepa, setBusquedaDepa] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const email = localStorage.getItem('admin_email');
        if (!token) {
            navigate('/admin/login');
        } else {
            setAdminEmail(email);
        }
    }, [navigate]);

    // POLLING
    useEffect(() => {
        let motorActualizacion; 

        if (vistaActiva === 'RESIDENTES') {
            cargarResidentes();
        } else if (vistaActiva === 'RESERVAS') {
            cargarReservasAdmin(); 

            
            motorActualizacion = setInterval(() => {
                cargarReservasAdmin();
            }, 5000); 
        }

        
        return () => {
            if (motorActualizacion) clearInterval(motorActualizacion);
        };
    }, [vistaActiva]);

    // ==========================================
    // LÓGICA DE RESIDENTES
    // ==========================================
    const cargarResidentes = async () => {
        try {
            const respuesta = await api.get('/residentes');
            setResidentes(respuesta.data);
        } catch (error) {
            console.error("Error al cargar residentes:", error);
        }
    };

    const iniciarEdicion = (residente) => {
        setModoEdicion(true);
        setIdEditando(residente.idResidente);
        setNuevoNombre(residente.nombreContacto || '');
        setNuevoTelefono(residente.telefonoContacto || '');
        setNuevoDepa(residente.numeroDepartamento || '');
        setNuevoPin(''); 
        setMensaje({ texto: '', tipo: '' });
    };

    const cancelarEdicion = () => {
        setModoEdicion(false);
        setIdEditando(null);
        setNuevoNombre('');
        setNuevoTelefono('');
        setNuevoDepa('');
        setNuevoPin('');
        setMensaje({ texto: '', tipo: '' });
    };

    const guardarResidente = async (e) => {
        e.preventDefault();
        setProcesando(true);
        setMensaje({ texto: '', tipo: '' });

        try {
            if (modoEdicion) {
                await api.put(`/residentes/${idEditando}`, {
                    nombreContacto: nuevoNombre,
                    telefonoContacto: nuevoTelefono,
                    numeroDepartamento: nuevoDepa
                });
                setMensaje({ texto: '¡Datos actualizados con éxito!', tipo: 'exito' });
            } else {
                await api.post('/residentes', {
                    nombreContacto: nuevoNombre,
                    telefonoContacto: nuevoTelefono,
                    numeroDepartamento: nuevoDepa,
                    pinAcceso: nuevoPin
                });
                setMensaje({ texto: '¡Departamento registrado con éxito!', tipo: 'exito' });
            }
            
            cargarResidentes();
            setTimeout(() => cancelarEdicion(), 2000); 
        } catch (error) {
            setMensaje({ texto: error.response?.data?.error || 'Error al guardar. Verifica los datos.', tipo: 'error' });
        } finally {
            setProcesando(false);
        }
    };

    const reiniciarPin = async (idResidente, numDepa) => {
        const nuevoPin = window.prompt(`Ingresa el nuevo PIN (4 dígitos) para el Departamento ${numDepa}:`);
        if (nuevoPin === null) return; 
        if (nuevoPin.length !== 4 || isNaN(nuevoPin)) {
            alert("El PIN debe ser estrictamente de 4 números.");
            return;
        }
        try {
            await api.put(`/residentes/${idResidente}/pin`, { pinAcceso: nuevoPin });
            alert(`✅ PIN actualizado con éxito para el Depa ${numDepa}`);
            cargarResidentes(); 
        } catch (error) {
            alert("Error al actualizar el PIN en el servidor.");
        }
    };

    const eliminarResidente = async (idResidente, numDepa) => {
        const confirmar = window.confirm(`⚠️ ¿Estás totalmente seguro de eliminar el Departamento ${numDepa}? Esta acción no se puede deshacer.`);
        if (confirmar) {
            try {
                await api.delete(`/residentes/${idResidente}`);
                alert(`Departamento ${numDepa} eliminado correctamente.`);
                cargarResidentes(); 
            } catch (error) {
                alert(error.response?.data?.error || "Error al eliminar el residente. Es probable que tenga reservas registradas.");
            }
        }
    };

    // ==========================================
    // LÓGICA DE RESERVAS 
    // ==========================================
    const cargarReservasAdmin = async () => {
        try {
            
            const respuesta = await api.get('/reservas?size=500');
            
            setReservas(respuesta.data.content || []);
        } catch (error) {
            console.error("Error al cargar las reservas:", error);
        }
    };

    const cancelarReservaAdmin = async (idReserva, numDepa, fecha) => {
        const confirmar = window.confirm(`⚠️ ATENCIÓN: ¿Estás seguro que deseas CANCELAR la reserva del Departamento ${numDepa} para el día ${fecha}?`);
        
        if (confirmar) {
            try {
                await api.put(`/reservas/${idReserva}/cancelar`);
                alert(`La reserva ha sido cancelada exitosamente.`);
                cargarReservasAdmin(); 
            } catch (error) {
                alert("Error al intentar cancelar la reserva.");
            }
        }
    };

    
    const reservasFiltradas = reservas
        .filter(res => res.residente?.numeroDepartamento.includes(busquedaDepa))
        .sort((a, b) => b.idReserva - a.idReserva); 

    // ==========================================
    // LÓGICA DE SESIÓN
    // ==========================================
    const cerrarSesion = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        navigate('/admin/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* TOPBAR */}
            <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Kaislo</h1>
                        <span style={{ color: '#1d4ed8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Centro de Mando</span>
                    </div>
                    {vistaActiva !== 'DASHBOARD' && (
                        <button onClick={() => setVistaActiva('DASHBOARD')} style={{ marginLeft: '20px', padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                            ← Volver al Inicio
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <span style={{ fontWeight: '500', color: '#64748b', fontSize: '14px' }}>👤 {adminEmail}</span>
                    <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* VISTA 1: DASHBOARD PRINCIPAL */}
                {vistaActiva === 'DASHBOARD' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '10px', borderRadius: '10px' }}>🏢</div>
                                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Gestión de Residentes</h2>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Administra los departamentos del edificio. Crea nuevos accesos y reinicia los PINs de seguridad de los vecinos.</p>
                            <button 
                                onClick={() => setVistaActiva('RESIDENTES')}
                                style={{ marginTop: '20px', padding: '10px 20px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                            >
                                Ingresar al Módulo
                            </button>
                        </div>

                        {/* MÓDULO DE RESERVAS */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px', borderRadius: '10px' }}>📅</div>
                                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Control de Reservas</h2>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Audita el calendario completo de parrillas. Cancela reservas por emergencias o mantenimientos preventivos.</p>
                            <button 
                                onClick={() => setVistaActiva('RESERVAS')}
                                style={{ marginTop: '20px', padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                            >
                                Ingresar al Módulo
                            </button>
                        </div>
                    </div>
                )}

                {/* VISTA 2: MÓDULO DE RESIDENTES */}
                {vistaActiva === 'RESIDENTES' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                        {/* COLUMNA IZQUIERDA: FORMULARIO */}
                        <div style={{ flex: '1 1 300px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 20px 0', color: modoEdicion ? '#db2777' : '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {modoEdicion ? '✏️ Editando Departamento' : 'Alta de Departamento'}
                            </h3>
                            {mensaje.texto && (
                                <div style={{ background: mensaje.tipo === 'exito' ? '#f0fdf4' : '#fef2f2', color: mensaje.tipo === 'exito' ? '#16a34a' : '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', textAlign: 'center' }}>
                                    {mensaje.texto}
                                </div>
                            )}
                            <form onSubmit={guardarResidente} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nombre del Titular</label>
                                    <input type="text" placeholder="Ej. Juan Pérez" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Teléfono de Contacto</label>
                                    <input type="text" placeholder="Ej. 987654321" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>N° de Departamento</label>
                                    <input type="text" placeholder="Ej. 101" value={nuevoDepa} onChange={(e) => setNuevoDepa(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                                </div>
                                {!modoEdicion && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>PIN de Acceso (4 dígitos)</label>
                                        <input type="text" maxLength="4" placeholder="Ej. 1234" value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <button type="submit" disabled={procesando} style={{ flex: 1, background: modoEdicion ? '#db2777' : '#1d4ed8', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1 }}>
                                        {procesando ? 'Guardando...' : (modoEdicion ? 'Actualizar Datos' : 'Registrar')}
                                    </button>
                                    {modoEdicion && (
                                        <button type="button" onClick={cancelarEdicion} style={{ padding: '12px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* COLUMNA DERECHA: TABLA DE DATOS */}
                        <div style={{ flex: '2 1 500px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>Directorio Activo</h3>
                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                    Total: {residentes.length}
                                </span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Depa</th>
                                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Titular</th>
                                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Teléfono</th>
                                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>PIN</th>
                                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {residentes.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay departamentos registrados.</td>
                                            </tr>
                                        ) : (
                                            residentes.map((res) => (
                                                <tr key={res.idResidente} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{res.numeroDepartamento}</td>
                                                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{res.nombreContacto || '---'}</td>
                                                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{res.telefonoContacto || '---'}</td>
                                                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569', fontFamily: 'monospace' }}>{res.pinAcceso}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button 
                                                                onClick={() => reiniciarPin(res.idResidente, res.numeroDepartamento)}
                                                                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                            >
                                                                🔑 Cambiar PIN
                                                            </button>
                                                            <button 
                                                                onClick={() => iniciarEdicion(res)}
                                                                style={{ background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                            >
                                                                ✏️ Editar Datos
                                                            </button>
                                                            <button 
                                                                onClick={() => eliminarResidente(res.idResidente, res.numeroDepartamento)}
                                                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 3: MÓDULO DE RESERVAS */}
                {vistaActiva === 'RESERVAS' && (
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                        
                        {/* CABECERA Y BUSCADOR */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Historial Global de Reservas</h3>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Auditoría completa de la zona de parrillas</p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por N° Depa..." 
                                        value={busquedaDepa}
                                        onChange={(e) => setBusquedaDepa(e.target.value)}
                                        style={{ padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', width: '250px', outline: 'none' }}
                                    />
                                </div>
                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                                    Mostrando: {reservasFiltradas.length}
                                </span>
                            </div>
                        </div>
                        
                        {/* TABLA DE RESERVAS */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>ID / Depa</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Fecha Solicitada</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Horario (Turno)</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservasFiltradas.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                                No se encontraron reservas con ese criterio.
                                            </td>
                                        </tr>
                                    ) : (
                                        reservasFiltradas.map((res) => {
                                            // Evaluamos si ya está cancelada
                                            const estaCancelada = res.estado?.toUpperCase() === 'CANCELADA';
                                            
                                            return (
                                                <tr key={res.idReserva} style={{ borderBottom: '1px solid #f1f5f9', background: estaCancelada ? '#fffbfa' : '#ffffff' }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>Depa {res.residente?.numeroDepartamento}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Ref: #{res.idReserva}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                        {}
                                                        📅 {res.fechaReserva ? res.fechaReserva.split('-').reverse().join('-') : '---'}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                                                        ⏰ {res.horaInicio} - {res.horaFin}
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ 
                                                            background: estaCancelada ? '#fef2f2' : '#f0fdf4', 
                                                            color: estaCancelada ? '#ef4444' : '#16a34a', 
                                                            padding: '6px 12px', 
                                                            borderRadius: '20px', 
                                                            fontSize: '12px', 
                                                            fontWeight: '700' 
                                                        }}>
                                                            {estaCancelada ? 'CANCELADA' : res.estado?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                        {!estaCancelada && (
                                                            <button 
                                                                onClick={() => cancelarReservaAdmin(res.idReserva, res.residente?.numeroDepartamento, res.fechaReserva)}
                                                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                title="Cancelar reserva"
                                                            >
                                                                🚫 Cancelar
                                                            </button>
                                                        )}
                                                        {estaCancelada && (
                                                            <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Sin acciones</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanelAdmin;