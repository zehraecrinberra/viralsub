import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Video, Crown, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Welcome, <span className="gradient-text">{user?.name}</span></h1>
            <p className="text-gray-400 mt-1">
              Plan: <span className={user?.plan === 'premium' ? 'text-yellow-400 font-semibold' : 'text-brand-400 font-semibold'}>
                {user?.plan === 'premium' ? '👑 Premium' : '⚡ Free'}
              </span>
            </p>
          </div>
          <Link to="/studio" className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus size={20} /> New Video
          </Link>
        </div>

        {user?.plan !== 'premium' && (
          <div className="glass border-yellow-500/30 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Crown size={32} className="text-yellow-400" />
              <div>
                <div className="font-bold text-lg">Upgrade to Premium</div>
                <div className="text-gray-400 text-sm">Remove watermarks, get HD exports, and more</div>
              </div>
            </div>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-xl font-bold hover:opacity-90">
              Upgrade $19/mo
            </button>
          </div>
        )}

        <div className="glass rounded-2xl p-12 text-center">
          <Video size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-gray-400">No videos yet</h3>
          <p className="text-gray-500 mb-6">Create your first viral video to see it here</p>
          <Link to="/studio" className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Zap size={18} /> Create Your First Video
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
