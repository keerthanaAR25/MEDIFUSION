'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';

export default function FusionPage() {
  const { user, darkMode, currentAnalysis } = useAppStore();
  const router = useRouter();
  const [tab, setTab] = useState<'Timeline' | 'Fusion' | 'Graph'>('Timeline');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
  }, [user]);

  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textP = darkMode ? 'text-white' : 'text-gray-900';
  const textS = darkMode ? 'text-gray-400' : 'text-gray-500';

  const defaultTimeline = [
    { time: '08:00', event: 'Patient admitted via ER', source: 'Clinical Notes', icon: '📋', color: 'purple' },
    { time: '08:30', event: 'Doctor-patient interview recorded & transcribed', source: 'Whisper ASR', icon: '🎙️', color: 'cyan' },
    { time: '09:15', event: 'Medical imaging analyzed', source: 'Vision AI', icon: '🔬', color: 'purple' },
    { time: '10:00', event: 'Lab results processed', source: 'OCR Engine', icon: '🧪', color: 'green' },
    { time: '11:30', event: 'AI differential diagnosis generated', source: 'LLM Reasoner', icon: '🧠', color: 'pink' },
    { time: '13:00', event: 'Treatment plan formulated', source: 'RAG + LLM', icon: '💊', color: 'yellow' },
    { time: '15:00', event: 'Summary approved by Clinician', source: 'Clinician', icon: '✅', color: 'green' },
  ];

  const timeline = currentAnalysis?.timeline?.length ? currentAnalysis.timeline : defaultTimeline;

  const colorMap: any = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    green: 'bg-green-500/20 text-green-400 border-green-500/40',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-gray-50'} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={`text-2xl font-bold ${textP} mb-1`}>Multimodal Fusion Engine</h1>
          <p className={`text-sm ${textS} mb-6`}>Combines speech, imaging, OCR, and clinical data into unified patient timeline</p>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#161b22] rounded-xl p-1 w-fit border border-gray-800">
            {(['Timeline', 'Fusion', 'Graph'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : `${textS} hover:text-white`
                }`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'Timeline' && (
            <div className="space-y-3">
              {timeline.map((event: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`card p-4 ${cardBg} flex items-center gap-4`}
                >
                  <div className="w-3 h-3 rounded-full bg-cyan-400 flex-shrink-0" />
                  <div className="text-xl w-8">{event.icon}</div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${textP}`}>{event.event}</div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${colorMap[event.color] || colorMap.cyan}`}>
                    {event.source}
                  </span>
                  <span className="text-xs font-mono text-gray-500 w-12 text-right">{event.time}</span>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'Fusion' && currentAnalysis && (
            <div className="grid grid-cols-2 gap-4">
              {/* RAG Sources */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className="text-purple-400 font-semibold mb-3">📚 RAG Clinical Sources</h3>
                <div className="space-y-2">
                  {currentAnalysis.rag_sources?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className={`text-sm ${textP}`}>{s.title}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-mono">
                        cosine: {s.cosine}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transcription */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className="text-cyan-400 font-semibold mb-3">🎙️ Transcription</h3>
                <p className={`text-sm ${textS} mb-3`}>{currentAnalysis.transcription || 'No audio transcription available'}</p>
                <div className="flex flex-wrap gap-1">
                  {currentAnalysis.keywords?.map((k: string) => (
                    <span key={k} className="text-xs px-2 py-0.5 bg-cyan-500/15 text-cyan-400 rounded-full">{k}</span>
                  ))}
                </div>
              </div>

              {/* Imaging */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className="text-purple-400 font-semibold mb-3">🔬 Imaging Report</h3>
                <p className={`text-sm ${textS}`}>{currentAnalysis.imaging_report || 'No imaging analysis available'}</p>
              </div>

              {/* Lab Values */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className="text-green-400 font-semibold mb-3">🧪 Lab Values</h3>
                <div className="space-y-2">
                  {Object.entries(currentAnalysis.lab_values || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className={`text-sm ${textS}`}>{k}</span>
                      <span className="text-sm text-green-400 font-mono">{v as string}</span>
                    </div>
                  ))}
                  {Object.keys(currentAnalysis.lab_values || {}).length === 0 && (
                    <p className={`text-sm ${textS}`}>No lab values extracted</p>
                  )}
                </div>
              </div>

              {/* AI Confidence */}
              <div className={`card p-5 ${cardBg} col-span-2`}>
                <h3 className="text-yellow-400 font-semibold mb-3">🤖 AI Analysis Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold font-mono text-cyan-400 mb-1">{currentAnalysis.confidence_score}%</div>
                    <div className={`text-sm ${textS}`}>Overall Confidence</div>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-2">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                        style={{ width: `${currentAnalysis.confidence_score}%` }} />
                    </div>
                    <div className="text-xs text-green-400 mt-2">✓ Ready for Summary Generation</div>
                  </div>
                  <div className="col-span-2">
                    <div className={`text-sm ${textS} mb-2`}>Clinical Reasoning</div>
                    <p className={`text-sm ${textP} leading-relaxed`}>{currentAnalysis.reasoning || 'Run AI analysis to see clinical reasoning'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Graph' && (
            <div className={`card p-8 ${cardBg} text-center`}>
              <div className="text-6xl mb-4">🕸️</div>
              <h3 className={`text-lg font-semibold ${textP} mb-2`}>Knowledge Graph</h3>
              <p className={`text-sm ${textS} mb-6`}>Visual representation of clinical data relationships</p>
              {currentAnalysis ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { node: 'Patient', connections: currentAnalysis.keywords?.slice(0,2) || ['—'], color: 'cyan' },
                    { node: 'Diagnosis', connections: [currentAnalysis.diagnosis || '—'], color: 'purple' },
                    { node: 'Treatment', connections: currentAnalysis.summary_sections?.medications?.split('\n').slice(0,2) || ['—'], color: 'green' },
                  ].map((g) => (
                    <div key={g.node} className={`p-4 rounded-xl border ${
                      g.color === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/5' :
                      g.color === 'purple' ? 'border-purple-500/30 bg-purple-500/5' :
                      'border-green-500/30 bg-green-500/5'
                    }`}>
                      <div className={`font-bold mb-2 ${
                        g.color === 'cyan' ? 'text-cyan-400' :
                        g.color === 'purple' ? 'text-purple-400' : 'text-green-400'
                      }`}>{g.node}</div>
                      {g.connections.map((c, i) => (
                        <div key={i} className={`text-xs ${textS} mb-1`}>→ {c}</div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={textS}>Run AI analysis first to generate knowledge graph</p>
              )}
            </div>
          )}

          {!currentAnalysis && tab === 'Fusion' && (
            <div className={`card p-8 ${cardBg} text-center`}>
              <div className="text-5xl mb-3">🔬</div>
              <h3 className={`text-lg font-semibold ${textP} mb-2`}>No Analysis Data</h3>
              <p className={`text-sm ${textS} mb-4`}>Run AI analysis first to see fusion results</p>
              <button onClick={() => router.push('/processing')} className="btn-primary">
                Go to AI Processing →
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}