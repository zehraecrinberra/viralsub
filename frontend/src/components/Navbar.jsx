import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-black gradient-text">ViralSub</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-400">
                  {user.plan === 'premium' ? '👑 Premium' : '⚡ Free'} · {user.name}
                </span>
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/studio" className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  New Video
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors p-2">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm text-gray-300 hover:text-white transition-colors">Sign In</Link>
                <Link to="/studio" className="bg-gradient-to-r from-brand-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                  Try Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/10 p-4 space-y-3">
          {user ? (
            <>
              <Link to="/dashboard" className="block text-sm text-gray-300" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link to="/studio" className="block text-sm text-brand-400" onClick={() => setMobileOpen(false)}>New Video</Link>
              <button onClick={handleLogout} className="block text-sm text-red-400">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/auth" className="block text-sm text-gray-300" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/studio" className="block text-sm text-brand-400" onClick={() => setMobileOpen(false)}>Try Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
