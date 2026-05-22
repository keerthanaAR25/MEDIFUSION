'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import { Volume2, StopCircle, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English',  flag: 'GB', tts: 'en-US' },
  { code: 'es', label: 'Spanish',  native: 'Español',  flag: 'ES', tts: 'es-ES' },
  { code: 'fr', label: 'French',   native: 'Français', flag: 'FR', tts: 'fr-FR' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी',    flag: 'IN', tts: 'hi-IN' },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்',    flag: 'IN', tts: 'ta-IN' },
  { code: 'ar', label: 'Arabic',   native: 'العربية',  flag: 'SA', tts: 'ar-SA' },
  { code: 'zh', label: 'Chinese',  native: '中文',      flag: 'CN', tts: 'zh-CN' },
  { code: 'de', label: 'German',   native: 'Deutsch',  flag: 'DE', tts: 'de-DE' },
];

export default function MultilingualPage() {
  const { user, darkMode, currentAnalysis, currentCase } = useAppStore();
  const router = useRouter();

  const [selectedLang, setSelectedLang]         = useState('en');
  const [cache, setCache]                        = useState<Record<string, any>>({});
  const [loading, setLoading]                    = useState(false);
  const [speaking, setSpeaking]                  = useState(false);
  const [fontSize, setFontSize]                  = useState(14);
  const [availableVoices, setAvailableVoices]    = useState<SpeechSynthesisVoice[]>([]);

  // ── Load voices on mount ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        console.log('[TTS] Available voices:', voices.map(v => `${v.lang}:${v.name}`).join(', '));
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ── Seed English content on mount ────────────────────────────
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (currentAnalysis?.patient_instructions) {
      setCache(prev => ({ ...prev, en: currentAnalysis.patient_instructions }));
    }
  }, [user, currentAnalysis]);

  // ── When language changes — translate ────────────────────────
  useEffect(() => {
    if (!currentAnalysis) return;
    if (selectedLang === 'en') return;
    if (cache[selectedLang]) return; // already cached
    doTranslate(selectedLang);
  }, [selectedLang, currentAnalysis]);

  // ── Translate via backend LLM ─────────────────────────────────
  const doTranslate = async (langCode: string) => {
    if (!currentAnalysis?.patient_instructions) return;
    setLoading(true);

    const instructions = currentAnalysis.patient_instructions;
    const textPayload  = JSON.stringify({
      diagnosis:   instructions.diagnosis   || currentAnalysis.diagnosis || '',
      medications: instructions.medications || [],
      followup:    instructions.followup    || '',
      warnings:    instructions.warnings    || [],
      diet:        instructions.diet        || '',
      activity:    instructions.activity    || '',
    });

    try {
      const token = localStorage.getItem('token') || '';
      const res   = await fetch('http://localhost:8000/summary/translate', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text:            textPayload,
          target_language: langCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && (data.diagnosis || data.medications)) {
          setCache(prev => ({ ...prev, [langCode]: data }));
          toast.success(`Translated to ${LANGUAGES.find(l => l.code === langCode)?.label}`);
          return;
        }
      }
      throw new Error('Bad response from server');
    } catch (err) {
      console.error('[TRANSLATE]', err);
      // Fallback: show English with note
      setCache(prev => ({
        ...prev,
        [langCode]: {
          ...(currentAnalysis.patient_instructions || {}),
          _translationFailed: true,
        },
      }));
      toast.error('Translation failed — showing English. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Get content for current language ─────────────────────────
  const getContent = () => {
    if (selectedLang === 'en') return currentAnalysis?.patient_instructions || null;
    return cache[selectedLang] || null;
  };

  // ── TEXT TO SPEECH — works for all languages ──────────────────
  const speakText = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const content = getContent();
    if (!content) {
      toast.error('No content to speak. Run AI Analysis first.');
      return;
    }

    window.speechSynthesis.cancel();

    const langConfig = LANGUAGES.find(l => l.code === selectedLang)!;

    // Build full text
    const parts: string[] = [];
    parts.push('Patient discharge instructions.');

    const diag = content.diagnosis || currentAnalysis?.diagnosis || '';
    if (diag) parts.push(`Your diagnosis is: ${diag}.`);

    const meds = Array.isArray(content.medications) ? content.medications : [];
    if (meds.length > 0) parts.push(`Medications: ${meds.join('. ')}.`);

    if (content.followup) parts.push(`Follow up plan: ${content.followup}.`);

    const warns = Array.isArray(content.warnings) ? content.warnings : [];
    if (warns.length > 0) parts.push(`Warning signs: ${warns.join('. ')}.`);

    if (content.diet)     parts.push(`Diet: ${content.diet}.`);
    if (content.activity) parts.push(`Activity: ${content.activity}.`);

    const fullText = parts.join(' ');

    // Find best matching voice
    const ttsLang  = langConfig.tts;
    const langBase = ttsLang.split('-')[0]; // e.g. 'hi' from 'hi-IN'

    let chosenVoice: SpeechSynthesisVoice | null = null;

    // 1. Exact match (e.g. hi-IN)
    chosenVoice = availableVoices.find(v => v.lang === ttsLang) || null;
    // 2. Language match (e.g. hi)
    if (!chosenVoice)
      chosenVoice = availableVoices.find(v => v.lang.startsWith(langBase)) || null;
    // 3. Any available voice for that region
    if (!chosenVoice && availableVoices.length > 0)
      chosenVoice = availableVoices.find(v => v.lang.startsWith('en')) || null;

    console.log(`[TTS] Language: ${ttsLang}, Voice: ${chosenVoice?.name || 'default'}`);

    const utterance  = new SpeechSynthesisUtterance(fullText);
    utterance.lang   = ttsLang;
    utterance.rate   = 0.85;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;
    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.onstart = () => {
      setSpeaking(true);
      toast.success(`Speaking in ${langConfig.label}...`);
    };
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = (e) => {
      setSpeaking(false);
      console.error('[TTS] Error:', e);
      // If language voice not found — speak in English
      if (e.error === 'language-unavailable' || e.error === 'voice-unavailable') {
        toast('Voice unavailable for this language — speaking in English');
        const fallback    = new SpeechSynthesisUtterance(fullText);
        fallback.lang     = 'en-US';
        fallback.rate     = 0.85;
        fallback.onstart  = () => setSpeaking(true);
        fallback.onend    = () => setSpeaking(false);
        window.speechSynthesis.speak(fallback);
      } else {
        toast.error(`Speech error: ${e.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // ── Copy text ─────────────────────────────────────────────────
  const copyText = () => {
    const content = getContent();
    if (!content) { toast.error('No content to copy'); return; }
    const lines = [
      `PATIENT DISCHARGE INSTRUCTIONS`,
      `Language: ${LANGUAGES.find(l => l.code === selectedLang)?.label}`,
      ``,
      `Diagnosis: ${content.diagnosis || currentAnalysis?.diagnosis || ''}`,
      ``,
      `Medications:`,
      ...(Array.isArray(content.medications) ? content.medications.map((m: string) => `  • ${m}`) : []),
      ``,
      `Follow-Up: ${content.followup || ''}`,
      ``,
      `Warning Signs:`,
      ...(Array.isArray(content.warnings) ? content.warnings.map((w: string) => `  • ${w}`) : []),
      ``,
      `Diet: ${content.diet || ''}`,
      `Activity: ${content.activity || ''}`,
    ].join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('Copied to clipboard!');
  };

  // ── Retry translation ─────────────────────────────────────────
  const retryTranslation = () => {
    if (selectedLang === 'en') return;
    setCache(prev => { const n = { ...prev }; delete n[selectedLang]; return n; });
    doTranslate(selectedLang);
  };

  // ── Styles ────────────────────────────────────────────────────
  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textP  = darkMode ? 'text-white'    : 'text-gray-900';
  const textS  = darkMode ? 'text-gray-400' : 'text-gray-500';
  const content     = getContent();
  const currentLang = LANGUAGES.find(l => l.code === selectedLang)!;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-gray-50'} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <h1 className={`text-2xl font-bold ${textP} mb-1`}>Multilingual Patient Instructions</h1>
          <p className={`text-sm ${textS} mb-6`}>AI-powered translation into 8 languages with text-to-speech</p>

          {/* Language Selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {LANGUAGES.map(lang => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-4 py-2.5 rounded-xl border transition-all text-center min-w-[80px] ${
                  selectedLang === lang.code
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : darkMode
                    ? 'bg-[#161b22] border-gray-700 text-gray-400 hover:border-gray-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="font-bold text-sm">{lang.flag}</div>
                <div className="font-semibold text-xs mt-0.5">{lang.native}</div>
                <div className={`text-xs ${textS}`}>{lang.label}</div>
                {/* Cached indicator */}
                {cache[lang.code] && lang.code !== 'en' && (
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mx-auto mt-1" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">

            {/* TTS button */}
            <button
              onClick={speakText}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                speaking
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30'
              }`}
            >
              {speaking
                ? <><StopCircle size={16} /> Stop</>
                : <><Volume2 size={16} /> Speak in {currentLang.label}</>
              }
            </button>

            {/* Copy */}
            <button
              onClick={copyText}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                darkMode
                  ? 'border-gray-700 text-gray-400 hover:bg-gray-800/50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Copy size={15} /> Copy
            </button>

            {/* Retry translation */}
            {selectedLang !== 'en' && (
              <button
                onClick={retryTranslation}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                  darkMode
                    ? 'border-gray-700 text-gray-400 hover:bg-gray-800/50'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RefreshCw size={15} /> Re-translate
              </button>
            )}

            {/* Font size */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`text-xs ${textS}`}>Size:</span>
              {[12, 14, 16, 18, 20].map(s => (
                <button key={s} onClick={() => setFontSize(s)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                    fontSize === s
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : `${textS} hover:bg-gray-800/40`
                  }`}
                >{s}</button>
              ))}
            </div>

            {/* Speaking indicator */}
            {speaking && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 items-end">
                  {[12, 16, 10, 18, 12].map((h, i) => (
                    <div key={i} className="w-1 bg-cyan-400 rounded-full animate-bounce"
                      style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <span className="text-cyan-400 text-xs">Speaking in {currentLang.label}...</span>
              </div>
            )}
          </div>

          {/* ── Content Area ──────────────────────────────────────── */}
          {!currentAnalysis ? (
            <div className={`border rounded-xl p-12 ${cardBg} text-center`}>
              <div className="text-5xl mb-3">🌍</div>
              <h3 className={`text-lg font-semibold ${textP} mb-2`}>No Patient Data</h3>
              <p className={`text-sm ${textS} mb-4`}>
                Complete AI Analysis first to generate multilingual instructions
              </p>
              <button onClick={() => router.push('/processing')}
                className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl text-sm hover:bg-cyan-500/30 transition-all">
                Go to AI Processing →
              </button>
            </div>

          ) : loading ? (
            <div className={`border rounded-xl p-8 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-cyan-400 text-sm">
                  Translating to {currentLang.label} using AI...
                </span>
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                    style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            </div>

          ) : content ? (
            <motion.div
              key={selectedLang}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`border rounded-xl p-6 ${cardBg}`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className={`text-xl font-bold ${textP}`}>Patient Discharge Instructions</h2>
                  <p className={`text-xs ${textS} mt-1`}>
                    MediFusion · {currentLang.label} · Verified by {currentCase?.attending || 'Attending Physician'}
                  </p>
                  {content._translationFailed && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Translation unavailable — showing English. Backend must be running.
                    </p>
                  )}
                </div>
                <span className={`font-bold px-3 py-1 rounded-lg text-sm ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>{currentLang.flag}</span>
              </div>

              {/* Diagnosis */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-5">
                <span className={`font-semibold ${textP}`}>
                  Your Diagnosis: {content.diagnosis || currentAnalysis?.diagnosis || 'See attending physician'}
                </span>
              </div>

              {/* Medications */}
              {Array.isArray(content.medications) && content.medications.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-red-400 font-semibold mb-2">💊 Medications</h3>
                  <ul className="space-y-1">
                    {content.medications.map((m: string, i: number) => (
                      <li key={i} className={textS}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up */}
              {content.followup && (
                <div className="mb-5">
                  <h3 className="text-cyan-400 font-semibold mb-2">📅 Follow-Up Plan</h3>
                  <p className={textS}>{content.followup}</p>
                </div>
              )}

              {/* Warnings */}
              {Array.isArray(content.warnings) && content.warnings.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Warning Signs</h3>
                  <ul className="space-y-1">
                    {content.warnings.map((w: string, i: number) => (
                      <li key={i} className={textS}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Diet & Activity */}
              {(content.diet || content.activity) && (
                <div className="mb-2">
                  <h3 className="text-green-400 font-semibold mb-2">🥗 Diet & Activity</h3>
                  {content.diet     && <p className={textS}>{content.diet}</p>}
                  {content.activity && <p className={`${textS} mt-1`}>{content.activity}</p>}
                </div>
              )}
            </motion.div>

          ) : (
            <div className={`border rounded-xl p-8 ${cardBg} text-center`}>
              <p className={textS}>No content yet. Run AI Analysis first.</p>
              <button onClick={() => router.push('/processing')}
                className="mt-4 px-6 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl text-sm">
                Go to AI Processing →
              </button>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}