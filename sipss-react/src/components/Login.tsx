import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  initialMode?: 'login' | 'register';
}

const Login: React.FC<LoginProps> = ({ onLogin, initialMode = 'login' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'login') {
      if (!username || !password) {
        setError('Please enter both username and password');
        return;
      }
      onLogin(username, password);
    } else {
      if (!username || !password || !fullName || !email) {
        setError('Please fill in all required fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setSuccess('Registration successful! You can now login with your credentials.');
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-coffee text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-black">Sip Station</h1>
          <p className="text-gray-600 mt-1 text-sm">POS & IBMS</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-black text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-black text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-black text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter your full name"
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="block text-black text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-black text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-black text-sm font-medium mb-1">Phone (Optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="mb-3">
              <label className="block text-black text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Create a password (min 6 characters)"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-black text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              Sign Up
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <>
              <p className="text-gray-600 text-sm">Don't have an account?</p>
              <button
                onClick={() => setMode('register')}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Sign up here
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-sm">Already have an account?</p>
              <button
                onClick={() => setMode('login')}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Login here
              </button>
            </>
          )}
        </div>

        {mode === 'login' && (
          <div className="mt-4 text-center text-gray-500 text-xs">
            <p>Default: admin / admin123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
