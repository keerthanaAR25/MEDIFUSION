'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, UserPlus } from 'lucide-react';
import { authAPI } from '@/lib/api';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', email: '', password: '', full_name: '',
    role: 'doctor', specialty: '', license_number: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Please login.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] relative overflow-hidden py-8">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
        </div>
        <div className="card p-7 bg-[#161b22] border-gray-800">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['doctor','patient'] as const).map((r) => (
                <button type="button" key={r}
                  onClick={() => setForm({...form, role: r})}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    form.role === r ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-[#0d1117] text-gray-500'
                  }`}
                >
                  {r === 'doctor' ? '👨‍⚕️ Doctor' : '🏥 Patient'}
                </button>
              ))}
            </div>
            {[
              { key: 'full_name', label: 'Full Name', placeholder: 'Dr. Jane Smith' },
              { key: 'username', label: 'Username', placeholder: 'drjane' },
              { key: 'email', label: 'Email', placeholder: 'jane@hospital.com', type: 'email' },
              { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                <input
                  className="input-field"
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required
                />
              </div>
            ))}
            {form.role === 'doctor' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Specialty</label>
                  <select
                    className="input-field"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  >
                    <option value="">Select specialty</option>
                    {['Cardiology','Pulmonology','Neurology','Surgery','Endocrinology','General Medicine'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">License Number</label>
                  <input className="input-field" placeholder="MED-12345" value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-dark-50 border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <span className="text-gray-500 text-xs">Already have an account? </span>
            <button onClick={() => router.push('/login')} className="text-cyan-400 text-xs hover:underline">Login</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}