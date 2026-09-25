import React, { useState } from 'react';
import { Cloud, LogOut } from 'lucide-react';
import type { User } from 'firebase/auth';
import { loginAsGuest, loginWithEmail, loginWithGoogle, logoutUser, registerWithEmail } from '../../services/firebase';
import { Modal, Segmented } from '../ui/primitives';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Correo o contraseña incorrectos.';
  if (code.includes('email-already-in-use')) return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code.includes('invalid-email')) return 'El correo no es válido.';
  if (code.includes('popup-closed')) return 'Se cerró la ventana de Google antes de terminar.';
  if (code.includes('network')) return 'Sin conexión. Inténtalo de nuevo.';
  return 'No se pudo completar. Inténtalo de nuevo.';
}

export function AuthModal({ isOpen, onClose, currentUser }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    setLoading(true);
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={currentUser ? 'Tu cuenta' : 'Guarda tus apuntes en la nube'} subtitle={currentUser ? undefined : 'Sincroniza entre el móvil, la tablet y el computador'} width={420}>
      {currentUser ? (
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-lg border border-line p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {currentUser.email ? currentUser.email[0].toUpperCase() : '?'}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{currentUser.isAnonymous ? 'Invitado' : currentUser.email}</div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Cloud size={12} /> {currentUser.isAnonymous ? 'Guardado de forma anónima en este dispositivo' : 'Sincronización activa, también sin conexión'}
              </div>
            </div>
          </div>
          <button className="btn btn-outline w-full" onClick={() => void run(logoutUser)}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'login', label: 'Iniciar sesión' },
              { value: 'register', label: 'Crear cuenta' },
            ]}
          />
          {error && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }} role="alert">
              {error}
            </div>
          )}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => (mode === 'login' ? loginWithEmail(email, password) : registerWithEmail(email, password)));
            }}
          >
            <label className="block">
              <span className="label">Correo</span>
              <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Contraseña</span>
              <input className="field" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> o <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-outline" disabled={loading} onClick={() => void run(loginWithGoogle)}>
              Google
            </button>
            <button className="btn btn-outline" disabled={loading} onClick={() => void run(loginAsGuest)}>
              Invitado
            </button>
          </div>
          <p className="text-xs text-muted">Sin sesión, tus apuntes se guardan solo en este navegador.</p>
        </div>
      )}
    </Modal>
  );
}
