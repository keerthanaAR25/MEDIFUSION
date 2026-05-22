'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import { reportsAPI, patientsAPI } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell
} from 'recharts';
import { Activity, FileText, Globe, Cpu } from 'lucide-react';

interface Stats {
  total_cases: number;
  total_summaries: number;
  languages_supported: number;
  avg_confidence: number;
  ai_modules: Record<string, number>;
  activity_24h: number[];
}

export default function Dashboard() {
  const { user, darkMode } = useAppStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [sRes, pRes] = await Promise.all([reportsAPI.getStats(), patientsAPI.getAll()]);
      setStats(sRes.data);
      setPatients(pRes.data.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const bg = darkMode ? 'bg-[#0d1117]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const activityData = (stats?.activity_24h || Array(24).fill(0)).map((v, i) => ({
    hour: `${i.toString().padStart(2,'0')}h`, value: v
  }));

  const moduleData = stats?.ai_modules ? Object.entries(stats.ai_modules).map(([name, val]) => ({
    name, value: val,
    color: name === 'Whisper ASR' ? '#00d4ff' : name === 'Vision Analyzer' ? '#bf91f3' :
           name === 'OCR Engine' ? '#3fb950' : name === 'LLM Reasoner' ? '#e3b341' : '#f85149'
  })) : [];

  const statCards = [
    { label: 'Cases Processed', value: stats?.total_cases?.toLocaleString() || '—', color: 'cyan', icon: Activity },
    { label: 'Summaries Generated', value: stats?.total_summaries?.toLocaleString() || '—', color: 'purple', icon: FileText },
    { label: 'Languages Supported', value: stats?.languages_supported?.toString() || '8', color: 'green', icon: Globe },
    { label: 'Avg AI Confidence', value: stats?.avg_confidence ? `${stats.avg_confidence}%` : '—', color: 'yellow', icon: Cpu },
  ];

  const colorMap: any = {
    cyan: 'text-cyan-400', purple: 'text-purple-400',
    green: 'text-green-400', yellow: 'text-yellow-400',
  };

  return (
    <div className={`min-h-screen ${bg} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`card p-5 ${cardBg}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs ${textSecondary}`}>{card.label}</span>
                    <Icon size={16} className={colorMap[card.color]} />
                  </div>
                  {loading ? (
                    <div className="skeleton h-8 w-24 mb-1" />
                  ) : (
                    <div className={`text-3xl font-bold font-mono ${colorMap[card.color]}`}>{card.value}</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Activity Chart */}
            <div className={`card p-5 ${cardBg}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-semibold ${textPrimary}`}>AI Processing Activity</span>
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">24h</span>
              </div>
              {loading ? (
                <div className="skeleton h-40" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={activityData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#8b949e' }} interval={5} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#1c2333', border: '1px solid #30363d', borderRadius: 8 }}
                      labelStyle={{ color: '#8b949e', fontSize: 11 }}
                      itemStyle={{ color: '#00d4ff', fontSize: 11 }}
                    />
                    <Bar dataKey="value" fill="#00d4ff" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* AI Module Status */}
            <div className={`card p-5 ${cardBg}`}>
              <div className={`text-sm font-semibold ${textPrimary} mb-4`}>AI Module Status</div>
              {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-6" />)}</div>
              ) : (
                <div className="space-y-3">
                  {moduleData.map((m) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      <span className={`text-xs flex-1 ${textSecondary}`}>{m.name}</span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.value}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: m.color }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: m.color }}>{m.value}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Cases Table */}
          <div className={`card p-5 ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-semibold ${textPrimary}`}>Recent Patient Cases</span>
              <button
                onClick={() => router.push('/patients')}
                className="text-xs text-cyan-400 hover:underline"
              >
                View All →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className={textSecondary}>
                    <th className="text-left pb-3 font-medium">CASE ID</th>
                    <th className="text-left pb-3 font-medium">PATIENT</th>
                    <th className="text-left pb-3 font-medium">AGE</th>
                    <th className="text-left pb-3 font-medium">DIAGNOSIS</th>
                    <th className="text-left pb-3 font-medium">CONFIDENCE</th>
                    <th className="text-left pb-3 font-medium">STATUS</th>
                    <th className="text-left pb-3 font-medium">UPDATED</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.case_id} className="border-t border-gray-800/50">
                      <td className="py-3 text-cyan-400 font-mono font-bold">{p.case_id}</td>
                      <td className={`py-3 font-medium ${textPrimary}`}>{p.name}</td>
                      <td className={`py-3 ${textSecondary}`}>{p.age}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">{p.diagnosis}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                              style={{ width: `${p.confidence}%` }} />
                          </div>
                          <span className="text-cyan-400 font-mono">{p.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'Completed' ? 'status-completed' :
                          p.status === 'Processing' ? 'status-processing' :
                          p.status === 'Under Review' ? 'status-review' : 'status-pending'
                        }`}>{p.status}</span>
                      </td>
                      <td className={`py-3 ${textSecondary}`}>{p.updated_at || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}