import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-bg-card border border-border-subtle rounded-lg shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-text-primary">Admin Portal</h2>
          <p className="font-mono text-xs text-text-muted mt-2 uppercase tracking-widest">
            Restricted Access
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red text-accent-red rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-mono text-xs text-text-muted uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-bg-primary border border-border-subtle text-text-primary px-4 py-3 rounded focus:outline-none focus:border-accent-red transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block font-mono text-xs text-text-muted uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-bg-primary border border-border-subtle text-text-primary px-4 py-3 rounded focus:outline-none focus:border-accent-red transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-white text-black font-ui font-semibold py-3 rounded hover:bg-accent-red hover:text-white transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
