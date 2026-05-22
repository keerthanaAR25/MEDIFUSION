'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, darkMode, toggleDarkMode } = useAppStore();
  const router = useRouter();
  const [settings, setSettings] = useState({
    whisper_model: 'base.en (74M)',
    llm_engine: 'Ollama Llama3',
    ocr_engine: 'Tesseract 5',
    confidence_threshold: 85,
    api_key: '',
    auto_translate: true,
    tts_enabled: true,
    notifications: true,
    auto_save: true,
    default_language: 'English',
    hipaa_mode: true,
    audit_logging: true,
    encryption: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const stored = localStorage.getItem('mf_settings');
    if (stored) setSettings({ ...settings, ...JSON.parse(stored) });
  }, [user]);

  const save = () => {
    localStorage.setItem('mf_settings', JSON.stringify(settings));
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textP = darkMode ? 'text-white' : 'text-gray-900';
  const textS = darkMode ? 'text-gray-400' : 'text-gray-500';

  const Toggle = ({ val, onChange }: { val: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all ${val ? 'bg-cyan-500' : 'bg-gray-700'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? 'left-7' : 'left-1'}`} />
    </button>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-gray-50'} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={`text-2xl font-bold ${textP} mb-6`}>Settings & Configuration</h1>

          <div className="grid grid-cols-2 gap-4">
            {/* AI Models */}
            <div className={`card p-5 ${cardBg}`}>
              <h3 className="text-cyan-400 font-semibold mb-1">AI Models</h3>
              <p className={`text-xs ${textS} mb-4`}>Configure AI processing pipeline</p>
              <div className="space-y-4">
                {[
                  { label: 'Whisper ASR Model', sub: 'Speech recognition model size', key: 'whisper_model',
                    opts: ['tiny.en (39M)', 'base.en (74M)', 'small.en (244M)', 'medium.en (769M)'] },
                  { label: 'LLM Reasoning Engine', sub: 'Language model for summary generation', key: 'llm_engine',
                    opts: ['Ollama Llama3', 'Ollama Mistral', 'Ollama Phi3', 'Ollama Gemma2', 'Claude API', 'OpenAI GPT-4'] },
                  { label: 'OCR Engine', sub: 'Document text extraction', key: 'ocr_engine',
                    opts: ['Tesseract 5', 'EasyOCR', 'PaddleOCR'] },
                ].map((f) => (
                  <div key={f.key}>
                    <div className={`text-sm font-medium ${textP}`}>{f.label}</div>
                    <div className={`text-xs ${textS} mb-1`}>{f.sub}</div>
                    <select className="input-field text-sm"
                      value={(settings as any)[f.key]}
                      onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}>
                      {f.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <div className="flex justify-between mb-1">
                    <div>
                      <div className={`text-sm font-medium ${textP}`}>Confidence Threshold</div>
                      <div className={`text-xs ${textS}`}>Minimum confidence to auto-approve</div>
                    </div>
                    <span className="text-cyan-400 font-bold">{settings.confidence_threshold}%</span>
                  </div>
                  <input type="range" min="50" max="99" value={settings.confidence_threshold}
                    onChange={(e) => setSettings({ ...settings, confidence_threshold: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400" />
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className={`card p-5 ${cardBg}`}>
              <h3 className="text-green-400 font-semibold mb-1">Application Settings</h3>
              <p className={`text-xs ${textS} mb-4`}>General application preferences</p>
              <div className="space-y-4">
                {[
                  { label: 'Auto-Translate', sub: 'Automatically translate to all languages', key: 'auto_translate' },
                  { label: 'Text-to-Speech', sub: 'Enable TTS for patient instructions', key: 'tts_enabled' },
                  { label: 'Dark Mode', sub: 'Dark interface theme', key: 'dark_mode_setting' },
                  { label: 'Notifications', sub: 'In-app alerts and updates', key: 'notifications' },
                  { label: 'Auto-Save', sub: 'Save drafts automatically every 30s', key: 'auto_save' },
                ].map((f) => (
                  <div key={f.key} className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-medium ${textP}`}>{f.label}</div>
                      <div className={`text-xs ${textS}`}>{f.sub}</div>
                    </div>
                    <Toggle
                      val={f.key === 'dark_mode_setting' ? darkMode : (settings as any)[f.key]}
                      onChange={() => {
                        if (f.key === 'dark_mode_setting') toggleDarkMode();
                        else setSettings({ ...settings, [f.key]: !(settings as any)[f.key] });
                      }}
                    />
                  </div>
                ))}
                <div>
                  <div className={`text-sm font-medium ${textP} mb-1`}>Default Language</div>
                  <select className="input-field text-sm" value={settings.default_language}
                    onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}>
                    {['English','Spanish','French','Hindi','Tamil','Arabic','Chinese','German'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className={`card p-5 ${cardBg}`}>
              <h3 className="text-purple-400 font-semibold mb-1">API Configuration</h3>
              <p className={`text-xs ${textS} mb-4`}>External API keys and endpoints</p>
              <div className="space-y-3">
                <div>
                  <div className={`text-sm font-medium ${textP} mb-1`}>API Key</div>
                  <div className={`text-xs ${textS} mb-1`}>Used for LLM API calls (if using Claude/GPT-4)</div>
                  <input type="password" className="input-field" placeholder="sk-..." value={settings.api_key}
                    onChange={(e) => setSettings({ ...settings, api_key: e.target.value })} />
                </div>
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-xs text-green-400">
                  ✅ System configured for local Ollama LLM (no API key required).<br/>
                  Ollama must be running: <code className="bg-gray-800 px-1 rounded">ollama serve</code>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className={`card p-5 ${cardBg}`}>
              <h3 className="text-red-400 font-semibold mb-1">Compliance & Security</h3>
              <p className={`text-xs ${textS} mb-4`}>HIPAA compliance and data security</p>
              <div className="space-y-4">
                {[
                  { label: 'HIPAA Mode', sub: 'Enable HIPAA compliance features', key: 'hipaa_mode' },
                  { label: 'Audit Logging', sub: 'Log all clinical actions', key: 'audit_logging' },
                  { label: 'Data Encryption', sub: 'Encrypt all stored patient data', key: 'encryption' },
                ].map((f) => (
                  <div key={f.key} className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-medium ${textP}`}>{f.label}</div>
                      <div className={`text-xs ${textS}`}>{f.sub}</div>
                    </div>
                    <Toggle val={(settings as any)[f.key]} onChange={() => setSettings({ ...settings, [f.key]: !(settings as any)[f.key] })} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={save} className="btn-primary px-8">
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
            <button
              onClick={() => { localStorage.removeItem('mf_settings'); toast.success('Settings reset'); }}
              className="px-6 py-2 border border-gray-700 text-gray-400 rounded-xl hover:bg-gray-800/50 transition-all text-sm"
            >
              Reset to Defaults
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}