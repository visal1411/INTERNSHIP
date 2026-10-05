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
      className={`w-full flex items-center px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60'
      }`}
    >
      <span className={`mr-3 shrink-0 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
