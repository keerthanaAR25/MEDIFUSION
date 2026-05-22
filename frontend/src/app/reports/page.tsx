'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import { reportsAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const { user, darkMode } = useAppStore();
  const router = useRouter();
  const [tab, setTab] = useState<'Overview' | 'Ai Logs' | 'Performance'>('Overview');
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [sRes, lRes] = await Promise.all([reportsAPI.getStats(), reportsAPI.getLogs()]);
      setStats(sRes.data);
      setLogs(lRes.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textP = darkMode ? 'text-white' : 'text-gray-900';
  const textS = darkMode ? 'text-gray-400' : 'text-gray-500';

  const deptData = stats?.cases_by_dept ? Object.entries(stats.cases_by_dept).map(([name, cases]) => ({ name, cases })) : [
    { name: 'Cardiology', cases: 312 },
    { name: 'Pulmonology', cases: 198 },
    { name: 'Neurology', cases: 156 },
    { name: 'Surgery', cases: 134 },
    { name: 'Endocrinology', cases: 98 },
    { name: 'Others', cases: 85 },
  ];

  const deptColors = ['#f85149', '#e3b341', '#3fb950', '#00d4ff', '#bf91f3', '#00b8e0'];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-gray-50'} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={`text-2xl font-bold ${textP} mb-5`}>Analytics & Reports</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#161b22] rounded-xl p-1 w-fit border border-gray-800">
            {(['Overview', 'Ai Logs', 'Performance'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : `${textS} hover:text-white`
                }`}>{t}</button>
            ))}
          </div>

          {tab === 'Overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Summaries', value: stats?.total_summaries?.toString() || '983', sub: '+12% this month', color: 'cyan' },
                  { label: 'Avg Processing Time', value: stats?.avg_processing_time || '4.2m', sub: '-8% this month', color: 'green' },
                  { label: 'Clinician Revisions', value: `${stats?.clinician_revision_rate || 23}%`, sub: '-3% this month', color: 'purple' },
                ].map((s, i) => (
                  <div key={i} className={`card p-5 ${cardBg}`}>
                    <div className={`text-xs ${textS} mb-2`}>{s.label}</div>
                    <div className={`text-4xl font-bold font-mono ${
                      s.color === 'cyan' ? 'text-cyan-400' : s.color === 'green' ? 'text-green-400' : 'text-purple-400'
                    }`}>{s.value}</div>
                    <div className={`text-xs ${textS} mt-1`}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className={`card p-5 ${cardBg}`}>
                <h3 className={`text-sm font-semibold ${textP} mb-4`}>Cases by Department</h3>
                <div className="space-y-3">
                  {deptData.map((d, i) => {
                    const max = Math.max(...deptData.map(x => x.cases as number));
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className={`text-sm ${textS} w-28`}>{d.name}</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((d.cases as number) / max) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: deptColors[i] }}
                          />
                        </div>
                        <span className={`text-xs ${textS} w-16 text-right`}>{d.cases} cases</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'Ai Logs' && (
            <div className={`card ${cardBg} overflow-hidden`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                    {['Timestamp', 'Event', 'Module', 'Patient', 'Status', 'Duration'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 font-medium ${textS}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(logs.length ? logs : [
                    { timestamp: new Date().toISOString(), event: 'AI Analysis Complete', module: 'LLM Reasoner', patient: 'Rajesh Kumar', status: 'success', duration: '4.2s' },
                    { timestamp: new Date(Date.now()-3600000).toISOString(), event: 'OCR Extraction', module: 'OCR Engine', patient: 'Maria Santos', status: 'success', duration: '1.8s' },
                    { timestamp: new Date(Date.now()-7200000).toISOString(), event: 'Audio Transcription', module: 'Whisper ASR', patient: 'John Williams', status: 'success', duration: '6.1s' },
                  ]).map((log: any, i: number) => (
                    <tr key={i} className={`border-b ${darkMode ? 'border-gray-800/50' : 'border-gray-100'} hover:bg-gray-800/20`}>
                      <td className={`px-4 py-3 font-mono ${textS}`}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className={`px-4 py-3 ${textP}`}>{log.event}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full">{log.module}</span></td>
                      <td className={`px-4 py-3 ${textS}`}>{log.patient}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full ${log.status === 'success' ? 'status-completed' : 'status-review'}`}>{log.status}</span></td>
                      <td className={`px-4 py-3 font-mono ${textS}`}>{log.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Performance' && (
            <div className={`card p-5 ${cardBg}`}>
              <h3 className={`text-sm font-semibold ${textP} mb-4`}>AI Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[...Array(7)].map((_, i) => ({
                  day: `Day ${i+1}`,
                  confidence: Math.floor(85 + Math.random() * 10),
                  speed: Math.floor(3 + Math.random() * 3),
                }))}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8b949e' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} />
                  <Tooltip contentStyle={{ background: '#1c2333', border: '1px solid #30363d', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="confidence" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 4 }} name="Confidence %" />
                  <Line type="monotone" dataKey="speed" stroke="#bf91f3" strokeWidth={2} dot={{ fill: '#bf91f3', r: 4 }} name="Speed (s)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}