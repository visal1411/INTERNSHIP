import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, ArrowUpRight, ArrowDownRight, ArrowDownLeft, Eye, Download } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: string;
  isAlert?: boolean;
  onExport?: () => void;
  onViewDetails?: () => void;
}

export function StatCard({ title, value, trend, trendUp, isAlert = false, onExport, onViewDetails }: StatCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine colors based on alert/trend
  const ringColor = isAlert ? 'text-red-500' : trendUp ? 'text-[#5f76e8]' : 'text-teal-500';
  const progressPercent = isAlert ? 90 : trendUp ? 75 : 45;
  const strokeDasharray = `${progressPercent}, 100`;

  return (
    <div 
      className={`bg-white p-6 rounded-lg transition-colors flex items-center justify-between ${isAlert ? 'border border-red-300' : ''}`}
      style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}
    >
      <div className="flex items-center gap-5">
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Ring */}
            <path
              className="text-gray-100"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Progress Ring */}
            <path
              className={ringColor}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="text-gray-400">
            {trendUp ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownLeft size={20} strokeWidth={2.5} />}
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <h4 className="text-gray-500 text-sm font-medium mb-1 tracking-wide">{title}</h4>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {/* Optionally keep the trend text visible but subtle */}
            <span className="text-xs font-medium text-gray-400 ml-2 hidden sm:inline-block">({trend})</span>
          </div>
        </div>
      </div>

      <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-1.5 rounded-md transition-colors ${isMenuOpen ? 'bg-gray-100 text-gray-600' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`}
        >
          <MoreVertical size={20} />
        </button>
        
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                onViewDetails?.();
              }}
              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Eye size={16} className="mr-2 text-gray-400" />
              View Details
            </button>
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                onExport?.();
              }}
              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Download size={16} className="mr-2 text-gray-400" />
              Export Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
