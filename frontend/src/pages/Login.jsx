import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Building2, Shield, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.display_name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const quickLogin = async (role) => {
    const accounts = { admin: 'admin@civiclens.io', citizen: 'citizen@civiclens.io' };
    setEmail(accounts[role]); setPassword('password123');
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: accounts[role], password: 'password123' });
      login(res.data.data.user, res.data.data.token);
      toast.success(`Logged in as ${role}`);
      navigate('/dashboard');
    } catch (err) { toast.error('Quick login failed — is the backend running?'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
        <Link to="/" className="text-xl font-bold text-gov-900">Namma Bengaluru Clean</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gov-900 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 mt-1">Sign in to BBMP Citizen Portal</p>
          </div>

          {/* Quick Login - 2 options only: Admin & User */}
          <div className="gov-card p-4 mb-6">
            <p className="text-xs text-gray-400 text-center mb-3">Quick Login (Demo)</p>
            <div className="flex gap-3">
              <button onClick={() => quickLogin('admin')}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg bg-gray-50 text-gray-700 hover:bg-gov-50 hover:text-gov-900 border border-gray-200 hover:border-gov-300 transition-all">
                <Shield className="w-4 h-4" /> Admin
              </button>
              <button onClick={() => quickLogin('citizen')}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg bg-gray-50 text-gray-700 hover:bg-gov-50 hover:text-gov-900 border border-gray-200 hover:border-gov-300 transition-all">
                <User className="w-4 h-4" /> User
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="gov-card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field !pl-11" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field !pl-11 !pr-11" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-gov-800 hover:text-gov-900 font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
