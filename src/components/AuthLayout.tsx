import React from 'react';
import authBg from '../assets/auth-bg.avif';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen w-full flex font-sans bg-white">
      {/* Left Panel - Branding */}
      <div 
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-center items-start px-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="absolute inset-0 bg-[#0062ff]/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 mb-10">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
