import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, UserCircle, Building2 } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) return toast.error('Please enter a valid email address');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { ...form, role: 'citizen' });
      login(res.data.data.user, res.data.data.token);
      toast.success('Account created! Welcome to Namma Clean Bengaluru');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
        <Link to="/" className="text-xl font-bold text-gov-900">Namma Clean Bengaluru</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gov-900 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Join Namma Bengaluru Clean</h1>
            <p className="text-gray-500 mt-1">Create your citizen account</p>
          </div>

          <form onSubmit={handleSubmit} className="gov-card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Enter your full name" className="input-field !pl-11" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className="input-field !pl-11" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" className="input-field !pl-11" required minLength={8} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !text-base">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gov-800 hover:text-gov-900 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
