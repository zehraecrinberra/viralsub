import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Globe, TrendingUp, Shield, Play, ArrowRight, Check } from 'lucide-react';

const features = [
  { icon: Globe, title: 'Multi-Language Translation', desc: 'Auto-translate to English, Spanish, and Arabic instantly' },
  { icon: Zap, title: 'Viral Hook Generator', desc: 'AI generates 3 proven viral hook phrases for your content' },
  { icon: TrendingUp, title: 'TikTok-Style Subtitles', desc: 'Word-by-word animations with high-contrast styles' },
  { icon: Shield, title: '9:16 Export Ready', desc: 'Perfect format for TikTok, Reels & YouTube Shorts' },
];

const plans = [
  {
    name: 'Free', price: '$0', period: '/month',
    features: ['60-second video limit', 'Basic subtitle styles', '720p export', 'ViralSub watermark', '3 languages'],
    cta: 'Start Free', href: '/studio', highlight: false
  },
  {
    name: 'Premium', price: '$19', period: '/month',
    features: ['60-second video limit', 'All subtitle styles', 'HD export (1080p)', 'No watermark', '3+ languages', 'Priority processing'],
    cta: 'Go Premium', href: '/auth', highlight: true
  }
];

export default function Landing() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-pink-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-brand-300 mb-8">
              <Zap size={14} className="text-brand-400" />
              AI-Powered Viral Subtitle Generator
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
              Make Your Videos<br />
              <span className="gradient-text">Go Viral Globally</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Upload your short video. Get instant transcription, multi-language subtitles, viral hooks, and TikTok-ready exports in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/studio" className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-all glow flex items-center gap-2 justify-center">
                <Play size={20} /> Try For Free
              </Link>
              <Link to="/auth" className="glass border-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
                Sign Up Free <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>

          {/* Demo preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-sm mx-auto"
          >
            <div className="glass rounded-3xl p-4 glow">
              <div className="bg-black rounded-2xl aspect-[9/16] flex items-end justify-center pb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black/80" />
                <div className="relative text-center px-4">
                  <div className="text-xs text-brand-300 mb-2 font-semibold">VIRAL HOOK</div>
                  <div className="subtitle-tiktok text-xl mb-4">"Nobody will tell you this..."</div>
                  <div className="subtitle-tiktok text-base">This is how you go global 🌍</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Everything You Need to <span className="gradient-text">Go Viral</span></h2>
          <p className="text-gray-400 text-lg">Built for content creators who want to reach the world</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:border-brand-500/50 transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-brand-600/20 to-pink-600/20 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={24} className="text-brand-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">How It <span className="gradient-text">Works</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload', desc: 'Drop your video (up to 60 seconds). We support MP4, MOV, and more.' },
              { step: '02', title: 'Customize', desc: 'Pick your language, choose a viral hook, and select subtitle style.' },
              { step: '03', title: 'Export', desc: 'Download your 9:16 optimized video ready for TikTok, Reels & Shorts.' }
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-6xl font-black gradient-text mb-4">{s.step}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Simple <span className="gradient-text">Pricing</span></h2>
          <p className="text-gray-400 text-lg">Start free, upgrade when you're ready</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map(plan => (
            <div key={plan.name} className={`glass rounded-2xl p-8 ${plan.highlight ? 'border-brand-500/50 glow' : ''}`}>
              {plan.highlight && (
                <div className="text-xs font-bold text-brand-400 mb-2">MOST POPULAR</div>
              )}
              <div className="text-2xl font-black mb-1">{plan.name}</div>
              <div className="text-4xl font-black mb-1">{plan.price}<span className="text-lg text-gray-400">{plan.period}</span></div>
              <ul className="space-y-3 my-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={16} className="text-brand-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.href}
                className={`block text-center py-3 rounded-xl font-bold transition-all ${plan.highlight ? 'bg-gradient-to-r from-brand-600 to-pink-600 hover:opacity-90 text-white' : 'glass hover:bg-white/10 text-white'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap size={16} className="text-brand-500" />
          <span className="font-black text-white">ViralSub</span>
        </div>
        <p>© 2026 ViralSub. Go viral, globally.</p>
      </footer>
    </div>
  );
}
