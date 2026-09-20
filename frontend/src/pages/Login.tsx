import React, { useState } from 'react';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import logoImg from '../assets/custom-logo.jpg';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

interface LoginProps {
  onLoginSuccess: (email: string, pass: string) => Promise<void>;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate inputs using Zod
      loginSchema.parse({ email: email.trim(), password });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
        return;
      }
    }

    setError(null);
    setIsLoading(true);

    try {
      await onLoginSuccess(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-emerald-500/5 mb-4">
            <img 
              src={logoImg} 
              alt="AgroScale Logo" 
              className="w-12 h-12 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Agro<span className="text-emerald-400">Scale</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Smart Livestock Weight Monitoring & Herd Analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Farmer Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered email address and password to access your herd dashboard.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. farmer1@agroscale.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fillers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo Farmer Accounts
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">One-click Fill</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer1@agroscale.com', 'password123')}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Farmer 1 (John)</span>
                  <UserCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">✉️ farmer1@agroscale.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('farmer2@agroscale.com', 'password123')}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Farmer 2 (Jane)</span>
                  <UserCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">✉️ farmer2@agroscale.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Provisioning Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Accounts are provisioned by your Farm Administrator.</span>
        </div>
      </div>
    </div>
  );
}
