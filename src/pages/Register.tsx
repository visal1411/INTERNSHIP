import React, { useState } from 'react';
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
