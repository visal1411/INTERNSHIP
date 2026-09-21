import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 transition-colors mr-4 ${active
        ? 'text-white font-medium'
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white opacity-80 hover:opacity-100'
        }`}
      style={active ? { 
        background: 'linear-gradient(to right, #8971ea, #7f72ea, #7574ea, #6a75e9, #5f76e8)', 
        borderRadius: '0px 60px 60px 0px',
        boxShadow: '0px 7px 12px 0px rgba(95, 118, 232, 0.21)'
      } : {}}
    >
      <span className={`mr-3 ${active ? 'text-white' : 'text-gray-500'}`}>{icon}</span>
      {label}
    </button>
  );
}
