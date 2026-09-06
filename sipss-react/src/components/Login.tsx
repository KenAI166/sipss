import React, { useState } from 'react';
import { Coffee, X, Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  // Returns an error message to display, or null on success.
  onLogin: (username: string, password: string) => Promise<string | null>;
  embedded?: boolean;
  onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, embedded = false, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const failure = await onLogin(username.trim(), password);
      if (failure) setError(failure);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embedded ? 'w-full' : 'min-h-screen bg-white flex items-center justify-center p-4'}>
      <div className={`bg-white w-full p-8 relative ${embedded ? '' : 'max-w-md rounded-lg shadow-xl'}`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Coffee className="w-8 h-8 text-amber-50" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Sip Station</h1>
          <p className="text-stone-500 mt-1 text-sm">POS & IBMS</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-black text-sm font-medium mb-2">Username or Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              placeholder="Enter your username or email"
              required
              autoFocus
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-black text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-amber-50 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-xs">
          Accounts are created by the administrator.
        </p>
      </div>
    </div>
  );
};

export default Login;
