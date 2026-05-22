'use client';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import {
  LayoutDashboard, Users, Cpu, GitMerge,
  FileText, Globe, BarChart2, Settings, LogOut, Zap
} from 'lucide-react';

const doctorNav = [
  { label: 'Dashboard', sub: 'Overview & Analytics', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Patient Cases', sub: 'Manage Patients', icon: Users, path: '/patients' },
  { label: 'AI Processing', sub: 'Upload & Analyze', icon: Cpu, path: '/processing' },
  { label: 'Data Fusion', sub: 'Multimodal Engine', icon: GitMerge, path: '/fusion' },
  { label: 'Discharge Summary', sub: 'Generate & Edit', icon: FileText, path: '/summary' },
  { label: 'Multilingual', sub: 'Patient Instructions', icon: Globe, path: '/multilingual' },
  { label: 'Reports', sub: 'Analytics & Logs', icon: BarChart2, path: '/reports' },
  { label: 'Settings', sub: 'Configuration', icon: Settings, path: '/settings' },
];

const patientNav = [
  { label: 'My Summary', sub: 'Discharge Info', icon: FileText, path: '/summary' },
  { label: 'My Instructions', sub: 'Patient Instructions', icon: Globe, path: '/multilingual' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, darkMode } = useAppStore();

  const navItems = user?.role === 'patient' ? patientNav : doctorNav;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed left-0 top-0 h-full w-56 z-50 flex flex-col border-r ${
        darkMode
          ? 'bg-dark-100/95 border-gray-800 text-white'
          : 'bg-white/95 border-gray-200 text-gray-900'
      } backdrop-blur-xl`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              MediFusion
            </div>
            <div className="text-xs text-gray-500">v2.4.1 · AI Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                active
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                  : darkMode
                  ? 'hover:bg-gray-800/60 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon size={16} className={active ? 'text-cyan-400' : ''} />
              <div>
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-xs opacity-60">{item.sub}</div>
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`p-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-500">AI Engine · Online</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-xs"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </motion.aside>
  );
}