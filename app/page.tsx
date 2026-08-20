'use client';

import { useState, useEffect } from 'react';
import { api } from './api';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) loadServices();
  }, [user]);

  useEffect(() => {
    if (selectedService && selectedDate && user) loadAvailability();
  }, [selectedService, selectedDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.data.user);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data.data);
      if (data.data.length > 0) setSelectedService(data.data[0]);
    } catch (err) { console.error(err); }
  };

  const loadAvailability = async () => {
    if (!selectedService || !selectedDate || !user) return;
    setLoading(true);
    try {
      const data = await api.getAvailability(user.id, selectedService.id, selectedDate);
      setAvailableSlots(data.data.availableSlots);
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (slot: string) => {
    if (!selectedService || !user) return;
    setLoading(true);
    setMessage('');
    try {
      await api.createAppointment(user.id, selectedService.id, slot);
      setMessage(`✅ Cita reservada para las ${new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setAvailableSlots(prev => prev.filter(s => s !== slot));
    } catch (err: any) {
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // --- PANTALLA DE LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Efecto de fondo sutil */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Sistema de Reservas</h1>
            <p className="text-slate-400 mt-2 text-sm">Inicia sesión para gestionar tu agenda</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none placeholder-slate-600"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none placeholder-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
            
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Autenticando...' : 'Iniciar Sesión'}
            </button>
          </form>
          <p className="text-xs text-slate-600 text-center mt-6">Demo: bro@ejemplo.com / miPasswordSeguro123</p>
        </div>
      </div>
    );
  }

  // --- PANTALLA PRINCIPAL (DASHBOARD) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white">Hola, {user.fullName}</h1>
            <p className="text-slate-400 text-sm mt-1">Panel de gestión de citas</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 text-sm text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 px-4 py-2 rounded-lg transition-all duration-300"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* Mensajes de Estado */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl border backdrop-blur-sm ${
            message.includes('✅') 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Configuración */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selector de Servicio */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">1. Servicio</h2>
              <div className="space-y-3">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                      selectedService?.id === s.id
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-900/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`font-semibold ${selectedService?.id === s.id ? 'text-emerald-400' : 'text-white'}`}>
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>⏱️ {s.durationMinutes} min</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span>💰 ${s.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Fecha */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">2. Fecha</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Columna Derecha: Horarios */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm h-full">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                3. Horarios Disponibles
                {loading && <span className="text-emerald-500 text-xs animate-pulse">● Buscando...</span>}
              </h2>
              
              {!selectedService || !selectedDate ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                  <span className="text-4xl mb-3">📅</span>
                  <p>Selecciona un servicio y una fecha para ver la disponibilidad.</p>
                </div>
              ) : availableSlots.length === 0 && !loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <span className="text-4xl mb-3">🚫</span>
                  <p>No hay horarios disponibles para esta fecha.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availableSlots.map(slot => {
                    const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        key={slot}
                        onClick={() => handleReserve(slot)}
                        disabled={loading}
                        className="group relative bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 py-4 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <span className="relative z-10">{timeStr}</span>
                        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all duration-300"></div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};