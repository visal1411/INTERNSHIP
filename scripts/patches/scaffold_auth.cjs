const fs = require('fs');
const path = require('path');

// 1. Create AuthLayout.tsx
const authLayoutCode = `import React from 'react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          CowFit Pro
        </h2>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 rounded-xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}`;
fs.mkdirSync('src/components', { recursive: true });
fs.writeFileSync('src/components/AuthLayout.tsx', authLayoutCode);

// 2. Create Login.tsx
const loginCode = `import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export function Login({ onLogin, onNavigateRegister }: { onLogin: () => void, onNavigateRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    
    setIsSubmitting(true);
    // TODO: Actual API Call
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin();
    }, 1000);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your CowFit account">
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            id="email" 
            type="email" 
            required
            disabled={isSubmitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500" 
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <button type="button" className="text-sm text-[#5f76e8] hover:text-[#5f76e8]/80 font-medium">Forgot password?</button>
          </div>
          <div className="relative">
            <input 
              id="password" 
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <input id="remember" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#5f76e8] focus:ring-[#5f76e8] cursor-pointer" />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">Remember me</label>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !email || !password}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#5f76e8] hover:bg-[#5f76e8]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5f76e8] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Signing in...</> : "Sign In"}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button type="button" onClick={onNavigateRegister} className="font-medium text-[#5f76e8] hover:text-[#5f76e8]/80 transition-colors">
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}`;
fs.writeFileSync('src/pages/Login.tsx', loginCode);

// 3. Create Register.tsx
const registerCode = `import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export function Register({ onRegister, onNavigateLogin }: { onRegister: () => void, onNavigateLogin: () => void }) {
  const [formData, setFormData] = useState({ fullName: '', farmName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 0) score += 1;
    if (pass.length >= 8) score += 1;
    if (/\d/.test(pass)) score += 1;
    return score; // 0, 1 (weak), 2 (medium), 3 (strong)
  };
  
  const strength = calculatePasswordStrength(formData.password);
  
  const isFormValid = formData.fullName && formData.farmName && formData.email && formData.password.length >= 8 && /\d/.test(formData.password) && formData.password === formData.confirmPassword && acceptedTerms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsSubmitting(true);
    // TODO: Actual API Call
    setTimeout(() => {
      setIsSubmitting(false);
      onRegister();
    }, 1000);
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start managing your herd with CowFit">
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            id="fullName" 
            type="text" 
            required
            disabled={isSubmitting}
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500" 
          />
        </div>

        <div>
          <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
          <input 
            id="farmName" 
            type="text" 
            required
            disabled={isSubmitting}
            value={formData.farmName}
            onChange={(e) => setFormData({...formData, farmName: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500" 
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            id="email" 
            type="email" 
            required
            disabled={isSubmitting}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500" 
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input 
              id="password" 
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500" 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength Indicator */}
          <div className="mt-2 flex gap-1 h-1.5">
            <div className={\`flex-1 rounded-full transition-colors \${strength >= 1 ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-200'}\`}></div>
            <div className={\`flex-1 rounded-full transition-colors \${strength >= 2 ? (strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-200'}\`}></div>
            <div className={\`flex-1 rounded-full transition-colors \${strength >= 3 ? 'bg-green-500' : 'bg-gray-200'}\`}></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">Min. 8 characters and 1 number.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className={\`w-full px-4 py-2.5 border \${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-[#5f76e8]'} rounded-lg focus:ring-2 text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500\`} 
            />
          </div>
          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
          )}
        </div>
        
        <div className="flex items-start mt-2">
          <input id="terms" type="checkbox" required checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#5f76e8] focus:ring-[#5f76e8] cursor-pointer" />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 cursor-pointer">
            I agree to the <a href="#" className="text-[#5f76e8] hover:underline">Terms of Service</a> and <a href="#" className="text-[#5f76e8] hover:underline">Privacy Policy</a>
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !isFormValid}
          className="w-full flex justify-center items-center py-2.5 px-4 mt-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#5f76e8] hover:bg-[#5f76e8]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5f76e8] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Creating Account...</> : "Create Account"}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button type="button" onClick={onNavigateLogin} className="font-medium text-[#5f76e8] hover:text-[#5f76e8]/80 transition-colors">
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}`;
fs.writeFileSync('src/pages/Register.tsx', registerCode);

// 4. Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes('import { Login }')) {
  appCode = appCode.replace(
    /import \{ Settings \} from '\.\/pages\/Settings';/,
    "import { Settings } from './pages/Settings';\nimport { Login } from './pages/Login';\nimport { Register } from './pages/Register';"
  );
}

if (!appCode.includes('const [isAuthenticated')) {
  appCode = appCode.replace(
    /export default function App\(\) \{/,
    `export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');`
  );
}

const mainReturnRegex = /return \(\s*<div className=\{`min-h-screen/;

if (mainReturnRegex.test(appCode) && !appCode.includes('if (!isAuthenticated)')) {
  appCode = appCode.replace(
    /return \(\s*<div className=\{`min-h-screen/,
    `if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onRegister={() => setIsAuthenticated(true)} onNavigateLogin={() => setAuthView('login')} />;
    }
    return <Login onLogin={() => setIsAuthenticated(true)} onNavigateRegister={() => setAuthView('register')} />;
  }

  return (
    <div className={\`min-h-screen`
  );
}

// Add sign out button to App.tsx header for easy testing
if (!appCode.includes('Sign Out')) {
  appCode = appCode.replace(
    /<\/header>/,
    `  <button onClick={() => setIsAuthenticated(false)} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Sign Out</button>
        </header>`
  );
}

fs.writeFileSync('src/App.tsx', appCode);

console.log("Auth setup complete!");
