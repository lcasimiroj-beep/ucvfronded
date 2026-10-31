import { useEffect, useState } from 'react';
import { api } from './api';

const money = value => `S/ ${Number(value).toFixed(2)}`;
const dateText = value => new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
const statusText = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Atendida', CANCELLED: 'Cancelada' };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', document: '' });
  const [tests, setTests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [booking, setBooking] = useState({ labTestId: '', scheduledAt: '', notes: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadData(currentToken = token, currentUser = user) {
    const testData = await api('/lab-tests');
    setTests(testData.tests || []);
    if (currentToken) {
      const path = currentUser?.role === 'ADMIN' ? '/appointments' : '/appointments/my';
      const data = await api(path, { token: currentToken });
      setAppointments(data.appointments || []);
    }
  }
  useEffect(() => { loadData().catch(e => setError(e.message)); }, [token]);

  async function submitAuth(e) {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload = mode === 'register' ? form : { email: form.email, password: form.password };
      const data = await api(path, { method: 'POST', body: JSON.stringify(payload) });
      if (mode === 'register') { setMode('login'); setMessage('Registro correcto. Ahora inicia sesión.'); }
      else { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setToken(data.token); setUser(data.user); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function createAppointment(e) {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      await api('/appointments', { token, method: 'POST', body: JSON.stringify({ ...booking, scheduledAt: new Date(booking.scheduledAt).toISOString() }) });
      setMessage('Tu solicitud de cita fue registrada.'); setBooking({ labTestId: '', scheduledAt: '', notes: '' }); await loadData();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function updateStatus(id, status) {
    setError('');
    try { await api(`/appointments/${id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) }); await loadData(); }
    catch (e) { setError(e.message); }
  }
  async function cancel(id) {
    setError('');
    try { await api(`/appointments/${id}/cancel`, { token, method: 'PATCH' }); await loadData(); }
    catch (e) { setError(e.message); }
  }
  function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(''); setUser(null); setAppointments([]); }

  return <main className="page">
    <header className="top"><div className="brand"><span className="logo">UCV</span><div><strong>Laboratorio</strong><small>Sistema de citas</small></div></div>{user && <div className="profile"><span>{user.fullName} · {user.role === 'ADMIN' ? 'Administrador' : 'Paciente'}</span><button className="ghost" onClick={logout}>Cerrar sesión</button></div>}</header>
    <section className="hero"><p className="eyebrow">ATENCIÓN MÁS SIMPLE</p><h1>Agenda tus análisis<br/>de laboratorio</h1><p>Solicita tu cita de manera rápida y consulta su estado desde aquí.</p></section>
    {(error || message) && <div className={error ? 'alert error' : 'alert success'}>{error || message}</div>}
    {!token ? <section className="panel auth"><div className="tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Iniciar sesión</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Crear cuenta</button></div><form onSubmit={submitAuth} className="form">
      {mode === 'register' && <><label>Nombre completo<input required minLength="3" value={form.fullName} onChange={e => setForm({...form,fullName:e.target.value})}/></label><label>DNI / Documento<input required minLength="8" value={form.document} onChange={e => setForm({...form,document:e.target.value})}/></label><label>Teléfono<input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></label></>}
      <label>Correo electrónico<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label><label>Contraseña<input required type="password" minLength="8" value={form.password} onChange={e => setForm({...form,password:e.target.value})}/></label><button className="primary" disabled={busy}>{busy ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Registrarme'}</button>
    </form></section> : <>
      {user?.role !== 'ADMIN' && <section className="panel"><div className="section-title"><div><p className="eyebrow">NUEVA RESERVA</p><h2>Solicitar una cita</h2></div></div><form className="form grid" onSubmit={createAppointment}><label>Tipo de análisis<select required value={booking.labTestId} onChange={e => setBooking({...booking,labTestId:e.target.value})}><option value="">Selecciona un análisis</option>{tests.map(t => <option key={t.id} value={t.id}>{t.name} · {money(t.price)}</option>)}</select></label><label>Fecha y hora<input required type="datetime-local" min={new Date(Date.now()+3600000).toISOString().slice(0,16)} value={booking.scheduledAt} onChange={e => setBooking({...booking,scheduledAt:e.target.value})}/></label><label className="wide">Observaciones (opcional)<textarea rows="2" maxLength="500" value={booking.notes} onChange={e => setBooking({...booking,notes:e.target.value})}/></label><button className="primary wide" disabled={busy || !tests.length}>{busy ? 'Enviando…' : 'Solicitar cita'}</button></form></section>}
      <section className="panel"><div className="section-title"><div><p className="eyebrow">SEGUIMIENTO</p><h2>{user?.role === 'ADMIN' ? 'Gestión de citas' : 'Mis citas'}</h2></div><span className="count">{appointments.length} registros</span></div>{appointments.length === 0 ? <p className="empty">Todavía no hay citas registradas.</p> : <div className="appointments">{appointments.map(a => <article className="appointment" key={a.id}><div><strong>{a.labTest?.name || 'Análisis de laboratorio'}</strong><p>{dateText(a.scheduledAt)}</p>{user?.role === 'ADMIN' && <p>{a.user?.fullName} · {a.user?.document || a.user?.email}</p>}<span className={`status ${a.status.toLowerCase()}`}>{statusText[a.status]}</span></div><div className="actions">{user?.role === 'ADMIN' && <><button onClick={() => updateStatus(a.id,'CONFIRMED')}>Confirmar</button><button onClick={() => updateStatus(a.id,'COMPLETED')}>Atendida</button><button className="danger" onClick={() => updateStatus(a.id,'CANCELLED')}>Cancelar</button></>}{user?.role !== 'ADMIN' && ['PENDING','CONFIRMED'].includes(a.status) && <button className="danger" onClick={() => cancel(a.id)}>Cancelar cita</button>}</div></article>)}</div>}</section>
    </>}
    <footer>UCV Laboratorio · Plataforma de citas</footer>
  </main>;
}
