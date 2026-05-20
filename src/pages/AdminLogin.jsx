import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [procesando, setProcesando] = useState(false);
    const navigate = useNavigate();

    const manejarLogin = async (e) => {
        e.preventDefault();
        setError('');
        setProcesando(true);

        try {
            const respuesta = await api.post('/admin/login', {
                usuarioAcceso: email, 
                password: password
            });

            localStorage.setItem('admin_token', respuesta.data.token);
            localStorage.setItem('admin_email', respuesta.data.usuario);
            navigate('/admin/panel');
        } catch (err) {
            setError(err.response?.data?.error || 'Credenciales incorrectas');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', border: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Kaislo Admin</h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Panel de Administración</p>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Correo Electrónico</label>
                        <input 
                            type="email" 
                            placeholder="admin@kaislo.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Contraseña</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={procesando} 
                        style={{ background: '#1d4ed8', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1, transition: 'background-color 0.2s', marginTop: '10px' }}
                    >
                        {procesando ? 'Verificando...' : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;