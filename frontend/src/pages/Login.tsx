import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

interface LoginProps {
  onLoginSuccess: (email: string, pass: string) => Promise<void>;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('farmer1@agroscale.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    setIsLoading(true);

    try {
      await onLoginSuccess(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials or backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Hello Again!" subtitle="Welcome Back to AgroScale">
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Demo Credentials Prefill Box */}
      <div className="mb-6 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0062ff] mb-2">
          <Sparkles size={14} />
          <span>Quick Demo Account Prefill</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('farmer1@agroscale.com')}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors border ${
              email === 'farmer1@agroscale.com'
                ? 'bg-[#0062ff] text-white border-[#0062ff]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Farmer 1 (John Doe)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('farmer2@agroscale.com')}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors border ${
              email === 'farmer2@agroscale.com'
                ? 'bg-[#0062ff] text-white border-[#0062ff]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Farmer 2 (Jane Smith)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            required
            placeholder="Email Address"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#0062ff] focus:border-[#0062ff] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 placeholder-gray-400"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Password"
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#0062ff] focus:border-[#0062ff] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#0062ff] focus:ring-[#0062ff] cursor-pointer"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-500 cursor-pointer">
              Remember me
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#0062ff] hover:bg-[#0052cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0062ff] disabled:opacity-70 disabled:cursor-not-allowed transition-colors mt-8"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              <span>Signing in...</span>
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button type="button" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          Forgot Password
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <span className="font-medium text-[#0062ff]">Contact Administrator</span>
      </p>
    </AuthLayout>
  );
}
