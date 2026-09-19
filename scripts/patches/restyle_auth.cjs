const fs = require('fs');

// 1. Rewrite AuthLayout.tsx
const authLayoutCode = `import React from 'react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen w-full flex font-sans bg-white">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0062ff] relative overflow-hidden flex-col justify-center items-start px-20">
        <div className="z-10 relative">
          <h1 className="text-white text-5xl font-bold mb-4 tracking-tight">CowFit Pro</h1>
          <p className="text-blue-100 text-lg mb-8">The most popular livestock management platform at SEA</p>
          <button className="bg-[#0084ff] text-white px-8 py-2.5 rounded-full font-medium hover:bg-blue-500 transition-colors shadow-sm">
            Read More
          </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 border border-white/20 rounded-full opacity-60"></div>
        <div className="absolute -bottom-48 -left-20 w-96 h-96 border border-white/20 rounded-full opacity-60"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 mb-10">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/AuthLayout.tsx', authLayoutCode);
console.log('AuthLayout.tsx rewritten.');


// 2. Rewrite Login.tsx
const loginCode = `import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export function Login({ onLogin, onNavigateRegister }: { onLogin: (remember: boolean) => void, onNavigateRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    
    setIsSubmitting(true);
    // Mock API Call
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(rememberMe);
    }, 1000);
  };

  return (
    <AuthLayout title="Hello Again!" subtitle="Welcome Back">
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
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
            disabled={isSubmitting}
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
            type="password"
            required
            placeholder="Password"
            disabled={isSubmitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#0062ff] focus:border-[#0062ff] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 placeholder-gray-400" 
          />
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#0062ff] focus:ring-[#0062ff] cursor-pointer" />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-500 cursor-pointer">Remember me</label>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !email || !password}
          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#0062ff] hover:bg-[#0052cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0062ff] disabled:opacity-70 disabled:cursor-not-allowed transition-colors mt-8"
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Signing in...</> : "Login"}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button type="button" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          Forgot Password
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <button type="button" onClick={onNavigateRegister} className="font-medium text-[#0062ff] hover:text-[#0052cc] transition-colors">
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}
`;
fs.writeFileSync('src/pages/Login.tsx', loginCode);
console.log('Login.tsx rewritten.');

// 3. Rewrite Register.tsx to match style
const registerCode = `import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export function Register({ onRegister, onNavigateLogin }: { onRegister: () => void, onNavigateLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    
    setIsSubmitting(true);
    // Mock API Call
    setTimeout(() => {
      setIsSubmitting(false);
      onRegister();
    }, 1000);
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join CowFit Pro today">
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            id="name" 
            type="text" 
            required
            placeholder="Full Name"
            disabled={isSubmitting}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#0062ff] focus:border-[#0062ff] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 placeholder-gray-400" 
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            id="email" 
            type="email" 
            required
            placeholder="Email Address"
            disabled={isSubmitting}
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
            type="password"
            required
            placeholder="Password"
            disabled={isSubmitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#0062ff] focus:border-[#0062ff] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 placeholder-gray-400" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !name || !email || !password}
          className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#0062ff] hover:bg-[#0052cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0062ff] disabled:opacity-70 disabled:cursor-not-allowed transition-colors mt-8"
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Creating account...</> : "Create Account"}
        </button>
      </form>
      
      <p className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button type="button" onClick={onNavigateLogin} className="font-medium text-[#0062ff] hover:text-[#0052cc] transition-colors">
          Log in
        </button>
      </p>
    </AuthLayout>
  );
}
`;
fs.writeFileSync('src/pages/Register.tsx', registerCode);
console.log('Register.tsx rewritten.');
