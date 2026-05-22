'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, LogIn } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, addNotification } = useAppStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'doctor' | 'patient'>('doctor');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ username: form.username, password: form.password });
      const { access_token, user } = res.data;
      setToken(access_token);
      setUser(user);
      addNotification({ message: `Welcome back, ${user.full_name}!`, type: 'success' });
      toast.success(`Welcome, Dr. ${user.full_name || user.username}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r: 'doctor' | 'patient') => {
    setRole(r);
    if (r === 'doctor') setForm({ username: 'drchen', password: 'doctor123' });
    else setForm({ username: 'patient1', password: 'patient123' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] relative overflow-hidden">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">MediFusion</h1>
          <p className="text-gray-500 text-sm mt-1">AI Clinical Intelligence Platform v2.4.1</p>
        </div>

        {/* Card */}
        <div className="card p-8 bg-[#161b22] border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-[#0d1117] rounded-xl">
            {(['doctor', 'patient'] as const).map((r) => (
              <button
                key={r}
                onClick={() => fillDemo(r)}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {r === 'doctor' ? '👨‍⚕️ Doctor' : '🏥 Patient'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Username</label>
              <input
                className="input-field"
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  className="input-field pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-6">
              {loading ? (
                <div className="w-4 h-4 border-2 border-dark-50 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-500 text-xs">No account? </span>
            <button
              onClick={() => router.push('/register')}
              className="text-cyan-400 text-xs hover:underline"
            >
              Register
            </button>
          </div>

          {/* Demo Hint */}
          <div className="mt-6 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-gray-400">
            <strong className="text-cyan-400">Demo:</strong> Click Doctor/Patient above to auto-fill credentials
          </div>
        </div>
      </motion.div>
    </div>
  );
}