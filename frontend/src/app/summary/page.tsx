'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import { summaryAPI } from '@/lib/api';
import { Sparkles, Download, Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const SECTIONS = [
  { key: 'diagnosis', label: 'Diagnosis', icon: '🔬' },
  { key: 'hospital_course', label: 'Hospital Course', icon: '🏥' },
  { key: 'investigations', label: 'Investigations', icon: '🧪' },
  { key: 'treatment', label: 'Treatment', icon: '💊' },
  { key: 'medications', label: 'Medications', icon: '💊' },
  { key: 'followup', label: 'Follow-Up', icon: '📅' },
];

export default function SummaryPage() {
  const { user, darkMode, currentAnalysis, currentCase } = useAppStore();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('diagnosis');
  const [sections, setSections] = useState<Record<string, string>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [clinicianNotes, setClinicianNotes] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (currentAnalysis?.summary_sections) {
      setSections(currentAnalysis.summary_sections as any);
      setGenerated(true);
    }
  }, [user, currentAnalysis]);

  const generateSummary = async () => {
    if (!currentAnalysis && !currentCase) {
      toast.error('No analysis data. Run AI Processing first.');
      return;
    }
    setGenerating(true);
    try {
      const caseId = currentCase?.case_id || 'current';
      const res = await summaryAPI.generate(caseId);
      setSections(res.data.sections);
      setGenerated(true);
      toast.success('Discharge summary generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = (key: string) => {
    setApproved(prev => ({ ...prev, [key]: true }));
    setFlagged(prev => ({ ...prev, [key]: false }));
    toast.success(`Section "${key}" approved`);
  };

  const handleFlag = (key: string) => {
    setFlagged(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const approvedCount = Object.values(approved).filter(Boolean).length;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('MediFusion - Discharge Summary', 20, 20);
    doc.setFontSize(12);
    doc.text(`Patient: ${currentCase?.name || 'Unknown'}`, 20, 35);
    doc.text(`Case ID: ${currentCase?.case_id || 'N/A'}`, 20, 45);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
    
    let y = 70;
    SECTIONS.forEach(s => {
      if (sections[s.key]) {
        doc.setFontSize(13);
        doc.text(s.label, 20, y);
        y += 8;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(sections[s.key], 170);
        doc.text(lines, 20, y);
        y += lines.length * 6 + 8;
        if (y > 270) { doc.addPage(); y = 20; }
      }
    });
    doc.save(`discharge_summary_${currentCase?.case_id || 'draft'}.pdf`);
    toast.success('PDF exported!');
  };

  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textP = darkMode ? 'text-white' : 'text-gray-900';
  const textS = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-gray-50'} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-bold ${textP}`}>Discharge Summary</h1>
              <p className={`text-sm ${textS}`}>AI-generated clinical discharge summary with clinician review</p>
            </div>
            <div className="flex gap-3">
              <button onClick={generateSummary} disabled={generating} className="btn-primary">
                {generating ? (
                  <div className="w-4 h-4 border-2 border-dark-50 border-t-transparent rounded-full animate-spin" />
                ) : <Sparkles size={16} />}
                {generating ? 'Generating...' : '✦ AI Generate'}
              </button>
              <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/40 rounded-xl hover:bg-green-500/30 transition-all text-sm">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Section Navigator */}
            <div className={`card p-4 ${cardBg} h-fit`}>
              <div className="space-y-1">
                {SECTIONS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                      activeSection === s.key
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : `${textS} hover:bg-gray-800/50`
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                    <div className="ml-auto flex gap-1">
                      {approved[s.key] && <CheckCircle size={12} className="text-green-400" />}
                      {flagged[s.key] && <AlertTriangle size={12} className="text-yellow-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section Editor */}
            <div className={`col-span-2 card p-5 ${cardBg}`}>
              {SECTIONS.filter(s => s.key === activeSection).map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold ${textP} flex items-center gap-2`}>
                      <span>{s.icon}</span> {s.label}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFlag(s.key)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                          flagged[s.key]
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                            : `${textS} border-gray-700 hover:border-yellow-500/40`
                        }`}
                      >
                        <Flag size={12} />
                        {flagged[s.key] ? 'Flagged' : 'Flag'}
                      </button>
                      <button
                        onClick={() => handleApprove(s.key)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                          approved[s.key]
                            ? 'bg-green-500/20 text-green-400 border-green-500/40'
                            : `${textS} border-gray-700 hover:border-green-500/40`
                        }`}
                      >
                        <CheckCircle size={12} />
                        {approved[s.key] ? 'Approved ✓' : 'Approve'}
                      </button>
                    </div>
                  </div>

                  {!generated ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">📋</div>
                      <p className={`${textS} text-sm mb-4`}>Click "AI Generate" to create discharge summary</p>
                      <button onClick={generateSummary} className="btn-primary">
                        <Sparkles size={16} /> Generate Now
                      </button>
                    </div>
                  ) : (
                    <textarea
                      className="input-field min-h-48 font-mono text-sm resize-y"
                      value={sections[s.key] || ''}
                      onChange={(e) => setSections(prev => ({ ...prev, [s.key]: e.target.value }))}
                      placeholder={`${s.label} section will appear here after generation...`}
                    />
                  )}

                  <div className="mt-3">
                    <label className={`text-xs ${textS} mb-1 block`}>Clinician Notes (Optional)</label>
                    <input
                      className="input-field text-sm"
                      placeholder="Add note for this section..."
                      value={clinicianNotes[s.key] || ''}
                      onChange={(e) => setClinicianNotes(prev => ({ ...prev, [s.key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Progress */}
          <div className={`card p-4 ${cardBg} mt-4 flex items-center justify-between`}>
            <div>
              <div className={`text-sm font-semibold ${textP}`}>Summary Review Progress</div>
              <div className={`text-xs ${textS}`}>{approvedCount} / {SECTIONS.length} sections approved</div>
            </div>
            <div className="flex-1 mx-6">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(approvedCount / SECTIONS.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                />
              </div>
            </div>
            <button
              onClick={() => {
                SECTIONS.forEach(s => setApproved(prev => ({ ...prev, [s.key]: true })));
                toast.success('All sections approved! Ready for patient discharge.');
              }}
              className="btn-primary py-2 text-sm"
            >
              Finalize & Approve All
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}