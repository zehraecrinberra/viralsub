import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Upload, Mic, Languages, Wand2, Download, Check,
  Play, RotateCcw, ChevronRight, Loader2, Zap, Globe
} from 'lucide-react';

const SUBTITLE_STYLES = [
  { id: 'tiktok', name: 'TikTok', desc: 'Bold white with black outline', preview: 'subtitle-tiktok' },
  { id: 'minimal', name: 'Minimal', desc: 'Clean and readable', preview: 'subtitle-minimal' },
  { id: 'bold', name: 'Bold Yellow', desc: 'High visibility yellow', preview: 'subtitle-bold' }
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
];

const STEPS = ['Upload', 'Customize', 'Export'];

export default function Studio() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Step 1: upload
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState(null);

  // Processing progress
  const [processingStep, setProcessingStep] = useState(-1);
  const PROCESSING_STEPS = ['Uploading...', 'Transcribing with Whisper AI...', 'Translating to multiple languages...', 'Generating viral hooks...'];

  // Step 2: customize
  const [transcription, setTranscription] = useState('');
  const [transcriptionSegments, setTranscriptionSegments] = useState([]);
  const [translations, setTranslations] = useState({});
  const [hooks, setHooks] = useState([]);
  const [selectedHook, setSelectedHook] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [subtitleStyle, setSubtitleStyle] = useState('tiktok');

  // Step 3: export
  const [exportResult, setExportResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024
  });

  const handleUpload = async () => {
    if (!videoFile) return toast.error('Please select a video first');
    setLoading(true);
    setProcessingStep(0);
    setLoadingMsg('Uploading video...');
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      const res = await api.post('/video/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedVideo(res.data);
      
      // Transcribe
      setProcessingStep(1);
      setLoadingMsg('Transcribing audio with Whisper AI...');
      const transcribeRes = await api.post('/process/transcribe', { filename: res.data.filename });
      setTranscription(transcribeRes.data.transcription.text);
      setTranscriptionSegments(transcribeRes.data.transcription.segments || []);
      
      // Translate
      setProcessingStep(2);
      setLoadingMsg('Translating to multiple languages...');
      const translateRes = await api.post('/process/translate', {
        text: transcribeRes.data.transcription.text,
        languages: ['en', 'es', 'ar']
      });
      setTranslations(translateRes.data.translations);
      
      // Generate hooks
      setProcessingStep(3);
      setLoadingMsg('Generating viral hooks...');
      const hooksRes = await api.post('/process/hooks', {
        text: transcribeRes.data.transcription.text,
        language: 'en'
      });
      setHooks(hooksRes.data.hooks);
      setSelectedHook(hooksRes.data.hooks[0]);
      
      setStep(1);
      toast.success('Video processed successfully!');
    } catch (err) {
      toast.error(err.error || 'Processing failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      setProcessingStep(-1);
    }
  };

  const handleExport = async () => {
    if (!uploadedVideo) return;
    setLoading(true);
    setLoadingMsg('Rendering your viral video...');
    try {
      // Use real Whisper segment timestamps instead of fake 3-second intervals
      let subtitles;
      if (transcriptionSegments.length > 0) {
        const translatedText = translations[selectedLang] || transcription;
        const originalText = transcription;
        subtitles = transcriptionSegments.map((seg) => {
          // Proportional character splitting for translated text
          const segRatio = seg.text.length / (originalText.length || 1);
          const startIdx = Math.round((seg.text.length > 0 ? originalText.indexOf(seg.text) : 0) / (originalText.length || 1) * translatedText.length);
          const len = Math.max(1, Math.round(segRatio * translatedText.length));
          const text = translatedText.slice(startIdx, startIdx + len).trim() || seg.text;
          return { start: seg.start, end: seg.end, text };
        });
      } else {
        // Fallback if no segments available
        subtitles = [{ start: 0, end: 60, text: translations[selectedLang] || transcription }];
      }

      const res = await api.post('/export/render', {
        filename: uploadedVideo.filename,
        subtitles,
        hook: selectedHook,
        style: subtitleStyle,
        plan: user?.plan
      });
      setExportResult(res.data);
      setStep(2);
      toast.success('Video exported successfully!');
    } catch (err) {
      toast.error(err.error || 'Export failed');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const reset = () => {
    setStep(0);
    setVideoFile(null);
    setVideoPreview('');
    setUploadedVideo(null);
    setTranscription('');
    setTranscriptionSegments([]);
    setTranslations({});
    setHooks([]);
    setSelectedHook('');
    setExportResult(null);
  };

  return (
    <div className="min-h-screen pt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? 'text-white' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-green-500' : i === step ? 'bg-gradient-to-r from-brand-600 to-pink-600' : 'bg-white/10'
              }`}>
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className="text-sm font-semibold hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-12 sm:w-24 mx-2 transition-all ${i < step ? 'bg-green-500' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 0: Upload */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2">Upload Your <span className="gradient-text">Video</span></h2>
              <p className="text-gray-400">Short videos up to 60 seconds · MP4, MOV, WebM supported</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div
                {...getRootProps()}
                className={`glass rounded-2xl p-10 text-center cursor-pointer transition-all border-2 border-dashed ${
                  isDragActive ? 'border-brand-500 bg-brand-500/10' : 'border-white/20 hover:border-brand-500/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={48} className={`mx-auto mb-4 ${isDragActive ? 'text-brand-400' : 'text-gray-500'}`} />
                <p className="text-lg font-semibold mb-2">{isDragActive ? 'Drop it here!' : 'Drag & drop your video'}</p>
                <p className="text-sm text-gray-500">or click to browse files</p>
                <p className="text-xs text-gray-600 mt-3">Max 60 seconds · Max 100MB</p>
              </div>

              <div>
                {videoPreview ? (
                  <div className="glass rounded-2xl overflow-hidden aspect-video">
                    <video src={videoPreview} controls className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="glass rounded-2xl aspect-video flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <Play size={48} className="mx-auto mb-2" />
                      <p className="text-sm">Video preview</p>
                    </div>
                  </div>
                )}
                
                {videoFile && (
                  <div className="mt-4 p-3 glass rounded-xl text-sm">
                    <p className="font-semibold truncate">{videoFile.name}</p>
                    <p className="text-gray-500">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                )}
              </div>
            </div>

            {loading && processingStep >= 0 && (
              <div className="mt-6 glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 size={18} className="text-brand-400 animate-spin" />
                  <span className="text-sm font-semibold text-gray-200">{loadingMsg}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {PROCESSING_STEPS.map((s, i) => (
                    <div key={i} className={`text-xs text-center ${i <= processingStep ? 'text-brand-400' : 'text-gray-600'}`}>
                      {i < processingStep ? <Check size={12} className="inline" /> : null} {s.replace('...', '')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={!videoFile || loading}
                className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                {loading ? loadingMsg : 'Process Video with AI'}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 1: Customize */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2"><span className="gradient-text">Customize</span> Your Video</h2>
              <p className="text-gray-400">Choose your language, hook, and subtitle style</p>
            </div>

            <div className="space-y-8">
              {/* Transcription */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Mic size={18} className="text-brand-400" />
                  <h3 className="font-bold">Transcription</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed bg-white/5 rounded-xl p-4">{transcription || 'Transcription will appear here...'}</p>
              </div>

              {/* Language */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={18} className="text-brand-400" />
                  <h3 className="font-bold">Subtitle Language</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedLang === lang.code
                          ? 'bg-brand-600/40 border border-brand-500'
                          : 'bg-white/5 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-2xl mb-1">{lang.flag}</div>
                      <div className="text-sm font-semibold">{lang.name}</div>
                      {translations[lang.code] && (
                        <div className="text-xs text-gray-500 mt-1 truncate">{translations[lang.code].slice(0, 30)}...</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hooks */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 size={18} className="text-brand-400" />
                  <h3 className="font-bold">Viral Hook</h3>
                </div>
                <div className="space-y-3">
                  {hooks.map((hook, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedHook(hook)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        selectedHook === hook
                          ? 'bg-brand-600/30 border border-brand-500'
                          : 'bg-white/5 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedHook === hook ? 'border-brand-500 bg-brand-500' : 'border-gray-500'}`}>
                          {selectedHook === hook && <Check size={12} />}
                        </div>
                        <span className="font-semibold">{hook}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle style */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-4">Subtitle Style</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {SUBTITLE_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSubtitleStyle(style.id)}
                      className={`p-4 rounded-xl transition-all ${
                        subtitleStyle === style.id
                          ? 'bg-brand-600/30 border border-brand-500'
                          : 'bg-white/5 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className={`${style.preview} text-base mb-2`}>Hello World</div>
                      <div className="text-sm font-bold mt-2">{style.name}</div>
                      <div className="text-xs text-gray-500">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading && (
              <div className="mt-6 glass rounded-xl p-4 flex items-center gap-3">
                <Loader2 size={20} className="text-brand-400 animate-spin" />
                <span className="text-sm text-gray-300">{loadingMsg}</span>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <RotateCcw size={16} /> Back
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-3"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
                {loading ? loadingMsg : 'Export Video'}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Export */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-green-400" />
              </div>
              <h2 className="text-3xl font-black mb-2">Your Video is <span className="gradient-text">Ready!</span></h2>
              <p className="text-gray-400">Download and share your viral content</p>
            </div>

            {exportResult && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="glass rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Quality</span>
                    <span className="font-semibold">{exportResult.quality === 'hd' ? '1080p HD' : '720p'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Watermark</span>
                    <span className={`font-semibold ${exportResult.watermark ? 'text-yellow-400' : 'text-green-400'}`}>
                      {exportResult.watermark ? 'Yes (Free Plan)' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Format</span>
                    <span className="font-semibold">MP4 · 9:16</span>
                  </div>
                </div>

                <a
                  href={`${import.meta.env.VITE_API_URL || ''}${exportResult.downloadUrl}`}
                  download
                  className="w-full bg-gradient-to-r from-brand-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 glow"
                >
                  <Download size={22} /> Download Video
                </a>

                {exportResult.watermark && (
                  <div className="glass border-yellow-500/30 rounded-xl p-4 text-center">
                    <p className="text-sm text-yellow-400 font-semibold">Remove watermark with Premium →</p>
                  </div>
                )}

                <button
                  onClick={reset}
                  className="w-full glass text-white py-3 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Create Another Video
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
