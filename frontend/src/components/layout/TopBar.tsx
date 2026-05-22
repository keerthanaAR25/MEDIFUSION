'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { usePathname } from 'next/navigation';

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patient Cases',
  '/processing': 'AI Processing',
  '/fusion': 'Data Fusion',
  '/summary': 'Discharge Summary',
  '/multilingual': 'Multilingual',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function TopBar() {
  const [time, setTime] = useState('');
  const pathname = usePathname();
  const { user, darkMode, toggleDarkMode, notifications } = useAppStore();
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const pageName = pageNames[pathname] || 'MediFusion';
  const unread = notifications.length;

  return (
    <header className={`fixed top-0 left-56 right-0 h-14 z-40 flex items-center justify-between px-6 border-b ${
      darkMode
        ? 'bg-dark-50/95 border-gray-800 text-white'
        : 'bg-white/95 border-gray-200 text-gray-900'
    } backdrop-blur-xl`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">MediFusion</span>
        <span className="text-gray-600">›</span>
        <span className="text-cyan-400 font-semibold">{pageName}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <span className={`text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{time}</span>
        
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>

        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotif(!showNotif)}
            className={`relative p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          >
            <Bell size={18} className="text-gray-400" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </motion.button>
          
          {showNotif && (
            <div className={`absolute right-0 top-10 w-72 rounded-xl border shadow-xl z-50 p-3 ${
              darkMode ? 'bg-dark-200 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="text-xs font-semibold text-gray-400 mb-2">Notifications</div>
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`p-2 rounded-lg mb-1 text-xs ${
                  n.type === 'success' ? 'text-green-400 bg-green-500/10' :
                  n.type === 'error' ? 'text-red-400 bg-red-500/10' :
                  'text-cyan-400 bg-cyan-500/10'
                }`}>{n.message}</div>
              ))}
              {notifications.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-2">No notifications</div>
              )}
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
        </motion.button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
          {user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}