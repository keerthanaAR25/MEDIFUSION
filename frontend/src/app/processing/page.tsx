'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import { processingAPI } from '@/lib/api';
import { Mic, Eye, FileText, NotepadText, Play, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProcessingPage() {
  const { user, darkMode, currentCase, setCurrentAnalysis, addNotification } = useAppStore();
  const router = useRouter();
  const [files, setFiles] = useState<{ audio?: File; image?: File; lab?: File }>({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState({
    name: currentCase?.name || '',
    age: currentCase?.age?.toString() || '',
    gender: currentCase?.gender || 'Male',
    chief_complaint: ''
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (currentCase) {
      setPatientInfo({
        name: currentCase.name,
        age: currentCase.age?.toString(),
        gender: currentCase.gender,
        chief_complaint: ''
      });
    }
  }, [user, currentCase]);

  const makeDropzone = (key: 'audio' | 'image' | 'lab', accept: any) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept,
      maxFiles: 1,
      onDrop: (accepted) => {
        if (accepted[0]) setFiles(prev => ({ ...prev, [key]: accepted[0] }));
      }
    });
    return { getRootProps, getInputProps, isDragActive };
  };

  const audio = makeDropzone('audio', { 'audio/*': ['.wav', '.mp3', '.m4a', '.ogg'] });
  const image = makeDropzone('image', { 'image/*': ['.jpg', '.jpeg', '.png', '.dicom'] });
  const lab = makeDropzone('lab', { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg'] });

  const stages = [
    'Uploading multimodal data...',
    'Transcribing audio with Whisper ASR...',
    'Analyzing medical images with Vision AI...',
    'Extracting lab values via OCR...',
    'Fusing multimodal data...',
    'Running LLM clinical reasoning...',
    'Retrieving clinical guidelines (RAG)...',
    'Generating discharge summary...',
    'Applying safety verification...',
    'Finalizing analysis...',
  ];

  const handleAnalyze = async () => {
    if (!patientInfo.name || !patientInfo.chief_complaint) {
      toast.error('Patient name and chief complaint are required');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResult(null);

    // Simulate progress stages
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        const stageIdx = Math.floor((next / 100) * stages.length);
        setProgressStage(stages[Math.min(stageIdx, stages.length - 1)]);
        return Math.min(next, 95);
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('patient_name', patientInfo.name);
      formData.append('patient_age', patientInfo.age || '0');
      formData.append('patient_gender', patientInfo.gender);
      formData.append('chief_complaint', patientInfo.chief_complaint);
      formData.append('clinical_notes', clinicalNotes);
      if (files.audio) formData.append('audio', files.audio);
      if (files.image) formData.append('image', files.image);
      if (files.lab) formData.append('lab', files.lab);
      if (currentCase?.case_id) formData.append('case_id', currentCase.case_id);

      const res = await processingAPI.analyze(formData);
      clearInterval(progressInterval);
      setProgress(100);
      setProgressStage('Analysis complete!');
      setResult(res.data);
      setCurrentAnalysis(res.data);
      addNotification({ message: `AI analysis complete for ${patientInfo.name}`, type: 'success' });
      toast.success('AI Analysis complete! 🎉');
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setProgressStage('');
      toast.error(err.response?.data?.detail || 'Analysis failed. Check your API connection.');
      addNotification({ message: 'Analysis failed - check AI connection', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFiles({});
    setClinicalNotes('');
    setResult(null);
    setProgress(0);
    setProgressStage('');
    setPatientInfo({ name: '', age: '', gender: 'Male', chief_complaint: '' });
  };

  const cardBg = darkMode ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200';
  const textP = darkMode ? 'text-white' : 'text-gray-900';
  const textS = darkMode ? 'text-gray-400' : 'text-gray-500';

  const completeness = [
    { label: 'Patient Info', ready: !!(patientInfo.name && patientInfo.age) },
    { label: 'Chief Complaint', ready: !!patientInfo.chief_complaint },
    { label: 'Clinical Notes', ready: !!clinicalNotes },
    { label: 'Medical Image', ready: !!files.image },
    { label: 'Lab Document', ready: !!files.lab },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0d1117]' : 'bg-gray-50'} relative`}>
      <AnimatedBackground />
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14 p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={`text-2xl font-bold ${textP} mb-1`}>AI Processing Pipeline</h1>
          <p className={`text-sm ${textS} mb-6`}>Upload multimodal clinical data for AI analysis</p>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Patient Info */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className="text-cyan-400 text-sm font-semibold mb-3">📋 Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Patient Name *</label>
                    <input className="input-field" placeholder="John Doe"
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Age</label>
                    <input className="input-field" type="number" placeholder="45"
                      value={patientInfo.age}
                      onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">Chief Complaint *</label>
                  <input className="input-field"
                    placeholder="e.g. Chest pain radiating to left arm for 2 hours..."
                    value={patientInfo.chief_complaint}
                    onChange={(e) => setPatientInfo({...patientInfo, chief_complaint: e.target.value})} />
                </div>
                <div className="text-xs text-gray-500 text-cyan-400/70 bg-cyan-500/5 rounded-lg p-2 border border-cyan-500/10">
                  ℹ️ Can also include: ECG findings, surgical notes, nursing observations, medication charts, anything clinical
                </div>
              </div>

              {/* Speech Recording */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className={`${textS} text-xs font-semibold mb-3 flex items-center gap-2`}>
                  <Mic size={14} /> Speech Recording
                </h3>
                <div {...audio.getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  audio.isDragActive ? 'border-cyan-400 bg-cyan-500/10' :
                  files.audio ? 'border-green-500/50 bg-green-500/5' :
                  'border-gray-700 hover:border-gray-600'
                }`}>
                  <input {...audio.getInputProps()} />
                  <Mic size={28} className={`mx-auto mb-2 ${files.audio ? 'text-green-400' : 'text-gray-600'}`} />
                  {files.audio ? (
                    <div>
                      <div className="text-green-400 text-sm font-medium">✓ {files.audio.name}</div>
                      <div className="text-gray-500 text-xs">{(files.audio.size/1024).toFixed(0)} KB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-sm ${textP}`}>Doctor-Patient Audio</div>
                      <div className="text-gray-500 text-xs mt-1">Drop or click to upload · audio/*</div>
                    </div>
                  )}
                </div>
                {!files.audio && (
                  <p className="text-xs text-gray-500 mt-2">
                    Note: AI will transcribe audio. You can also write consultation summary in Clinical Notes.
                  </p>
                )}
              </div>

              {/* Medical Imaging */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className={`${textS} text-xs font-semibold mb-3 flex items-center gap-2`}>
                  <Eye size={14} /> Medical Imaging
                </h3>
                <div {...image.getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  image.isDragActive ? 'border-purple-400 bg-purple-500/10' :
                  files.image ? 'border-green-500/50 bg-green-500/5' :
                  'border-gray-700 hover:border-gray-600'
                }`}>
                  <input {...image.getInputProps()} />
                  <Eye size={28} className={`mx-auto mb-2 ${files.image ? 'text-green-400' : 'text-gray-600'}`} />
                  {files.image ? (
                    <div>
                      <div className="text-green-400 text-sm font-medium">✓ {files.image.name}</div>
                      <div className="text-gray-500 text-xs">{(files.image.size/1024).toFixed(0)} KB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-sm ${textP}`}>X-Ray / CT Scan</div>
                      <div className="text-gray-500 text-xs mt-1">Drop or click to upload · image/*</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Lab Document */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className={`${textS} text-xs font-semibold mb-3 flex items-center gap-2`}>
                  <FileText size={14} /> Document Scan
                </h3>
                <div {...lab.getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  lab.isDragActive ? 'border-green-400 bg-green-500/10' :
                  files.lab ? 'border-green-500/50 bg-green-500/5' :
                  'border-gray-700 hover:border-gray-600'
                }`}>
                  <input {...lab.getInputProps()} />
                  <NotepadText size={28} className={`mx-auto mb-2 ${files.lab ? 'text-green-400' : 'text-gray-600'}`} />
                  {files.lab ? (
                    <div>
                      <div className="text-green-400 text-sm font-medium">✓ {files.lab.name}</div>
                      <div className="text-gray-500 text-xs">{(files.lab.size/1024).toFixed(0)} KB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div className={`text-sm ${textP}`}>Lab Report / Medical Doc</div>
                      <div className="text-gray-500 text-xs mt-1">Drop or click to upload · .pdf,.png,.jpg</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Notes */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className={`${textS} text-xs font-semibold mb-3 flex items-center gap-2`}>
                  <NotepadText size={14} /> Clinical Notes
                </h3>
                <textarea
                  className="input-field min-h-32 resize-y"
                  placeholder="Enter clinical notes, medication list, examination findings, vital signs, or additional observations..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>

              {/* Input Completeness */}
              <div className={`card p-5 ${cardBg}`}>
                <h3 className="text-cyan-400 text-sm font-semibold mb-3">Input Completeness</h3>
                <div className="space-y-2">
                  {completeness.map((c) => (
                    <div key={c.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.ready ? (
                          <CheckCircle2 size={16} className="text-green-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                        )}
                        <span className={`text-sm ${textS}`}>{c.label}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.ready ? 'status-completed' : 'text-gray-600 bg-gray-800'}`}>
                        {c.ready ? 'Ready' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">More complete inputs → more accurate, specific AI diagnosis</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {processing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 card p-5 ${cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400 text-sm font-semibold">AI Pipeline Running...</span>
                <span className="text-cyan-400 font-mono text-sm">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                />
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {progressStage}
              </div>
            </motion.div>
          )}

          {/* Error display */}
          {result?.error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {result.error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAnalyze}
              disabled={processing || !patientInfo.name}
              className="btn-primary px-8 py-3 text-base"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-dark-50 border-t-transparent rounded-full animate-spin" />
              ) : <Play size={18} />}
              {processing ? 'Analyzing...' : '⬥ Run Full AI Analysis'}
            </button>
            <button
              onClick={reset}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3 border border-gray-700 text-gray-400 rounded-xl hover:bg-gray-800/50 transition-all"
            >
              <RotateCcw size={16} /> Reset
            </button>
            {result && !result.error && (
              <button
                onClick={() => router.push('/fusion')}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-xl hover:bg-purple-500/30 transition-all"
              >
                View Fusion Timeline →
              </button>
            )}
          </div>

          {/* Quick Result Preview */}
          {result && !result.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 card p-5 ${cardBg} border-green-500/30`}
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-green-400" />
                <h3 className="text-green-400 font-semibold">Analysis Complete</h3>
                <span className="ml-auto text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
                  Confidence: {result.confidence_score}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Primary Diagnosis</div>
                  <div className="text-cyan-400 font-semibold">{result.diagnosis || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Key Findings</div>
                  <div className="flex flex-wrap gap-1">
                    {result.keywords?.slice(0, 4).map((k: string) => (
                      <span key={k} className="text-xs px-2 py-0.5 bg-cyan-500/15 text-cyan-400 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => router.push('/fusion')} className="btn-primary text-sm py-2 px-4">
                  View Full Analysis →
                </button>
                <button onClick={() => router.push('/summary')} className="text-sm py-2 px-4 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800/50 transition-all">
                  Generate Summary →
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}