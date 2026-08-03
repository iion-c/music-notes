import React, { useState } from 'react';
import { X, LogIn, UserPlus, LogOut, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';
import type { User } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest, logoutUser } from '../../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Por favor completa correo y contraseña');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMsg('Error al conectar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      await loginAsGuest();
      onClose();
    } catch (err: any) {
      setErrorMsg('Error al ingresar como invitado');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#fdfbf7] border border-amber-200/90 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#f8f5ee] border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <UserIcon size={18} className="text-amber-600" />
            <span>{currentUser ? 'Perfil de Usuario' : 'Cuenta & Sincronización'}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {currentUser ? (
          /* Estado cuando ya ha iniciado sesión */
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-md shadow-amber-600/20">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '👤'}
              </div>
              <h4 className="font-bold text-sm text-slate-900">
                {currentUser.isAnonymous ? 'Usuario Invitado' : currentUser.email}
              </h4>
              <p className="text-slate-600 text-[11px]">
                {currentUser.isAnonymous 
                  ? 'Tus notas se guardan de forma anónima en este navegador.' 
                  : 'Sincronización automática activada en la nube.'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          /* Formulario de Login / Registro */
          <div className="p-6 space-y-4">
            <div className="flex rounded-xl bg-amber-100/60 p-1 border border-amber-200 text-xs font-bold">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${mode === 'login' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700'}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${mode === 'register' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700'}`}
              >
                Crear Cuenta
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Correo Electrónico:</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contraseña:</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-amber-600/20"
              >
                {loading ? 'Cargando...' : mode === 'login' ? 'Entrar a Mi Cuaderno' : 'Crear Mi Cuenta'}
              </button>
            </form>

            <div className="relative my-2 text-center text-[10px] text-slate-400">
              <span className="bg-[#fdfbf7] px-2 font-semibold text-slate-500">O entra rápidamente con</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={handleGoogleLogin}
                className="py-2 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-slate-800 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>🌐 Google</span>
              </button>

              <button
                onClick={handleGuestLogin}
                className="py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center gap-1.5"
              >
                <span>👤 Modo Invitado</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
