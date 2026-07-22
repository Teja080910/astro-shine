'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Sun, Moon, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') as 'dark' | 'light';
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('admin-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background px-4 overflow-hidden transition-colors duration-200">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-gold/10 blur-[120px] pointer-events-none" />

      {/* Floating Theme Switcher */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-xl border border-card-border bg-card-bg backdrop-blur-md text-text-secondary hover:text-text-primary transition-all duration-200 hover:scale-105 shadow-sm"
      >
        {theme === 'dark' ? <Sun size={20} className="text-accent-gold" /> : <Moon size={20} className="text-primary" />}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-card-bg border border-card-border backdrop-blur-xl rounded-[28px] p-10 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header Logo & Subtitle */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-primary/10 to-accent-gold/10 flex items-center justify-center border border-card-border shadow-lg mb-4">
            <img 
              src="/logo_transparent.png" 
              alt="Astro Shine Logo" 
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.src = '/logo.png';
              }}
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            ASTRO <span className="text-accent-gold">SHINE</span>
          </h1>
          <p className="text-text-secondary text-sm font-semibold tracking-wider uppercase mt-1.5 opacity-80">
            Admin Portal
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-2xl px-4 py-3 mb-6 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full pl-12 pr-4 py-3.5 focus:border-primary transition-colors duration-200"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pl-12 pr-12 py-3.5 focus:border-primary transition-colors duration-200"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors duration-150"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn w-full py-4 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transform active:scale-[0.98] transition-all duration-150"
            style={{ borderRadius: '18px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
