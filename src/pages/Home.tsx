import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/StatCard';
import cowIcon from '../assets/cow.png';

const allWeightData = {
  '7days': [
    { day: 'Mon', weight: 1120 }, { day: 'Tue', weight: 1150 }, { day: 'Wed', weight: 1140 },
    { day: 'Thu', weight: 1190 }, { day: 'Fri', weight: 1220 }, { day: 'Sat', weight: 1260 }, { day: 'Sun', weight: 1280 }
  ],
  '30days': [
    { day: 'Week 1', weight: 1100 }, { day: 'Week 2', weight: 1150 }, { day: 'Week 3', weight: 1210 }, { day: 'Week 4', weight: 1280 }
  ],
  'year': [
    { day: 'Jan', weight: 900 }, { day: 'Feb', weight: 950 }, { day: 'Mar', weight: 1000 }, { day: 'Apr', weight: 1050 },
    { day: 'May', weight: 1100 }, { day: 'Jun', weight: 1150 }, { day: 'Jul', weight: 1200 }, { day: 'Aug', weight: 1280 }
  ]
};
interface HomeProps {
  onNavigate?: (tab: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'year'>('7days');
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [isWeighInModalOpen, setIsWeighInModalOpen] = useState(false);
  const timeFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeFilterRef.current && !timeFilterRef.current.contains(event.target as Node)) {
        setIsTimeFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeFilterOptions = [
    { value: '7days', label: t('timeFilter.last7Days') },
    { value: '30days', label: t('timeFilter.last30Days') },
    { value: 'year', label: t('timeFilter.thisYear') },
  ];

  const recentWeighIns = [
    { id: 'TAG-8921', weight: 1450, status: t('status.overweight'), time: `10 mins ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'up' },
    { id: 'TAG-1142', weight: 1120, status: t('status.normal'), time: `45 mins ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'stable' },
    { id: 'TAG-9932', weight: 1520, status: t('status.critical'), time: `1 hour ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'up' },
    { id: 'TAG-0021', weight: 1180, status: t('status.normal'), time: `2 hours ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'down' },
    { id: 'TAG-4431', weight: 1390, status: t('status.warning'), time: `3 hours ${t('time.ago', { defaultValue: 'ago' })}`, trend: 'down' },
  ];

  const handleExport = (title: string) => {
    const data = title.includes('Weight') ? allWeightData[timeFilter] : recentWeighIns;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={t('dashboard.totalCows')}
          value="1,248"
          trend="+12 this week"
          trendUp={true}
          icon={<div className="w-6 h-6 bg-current text-gray-600 dark:text-gray-300" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />}
          color="bg-gray-100 dark:bg-gray-700"
          onExport={() => handleExport(t('dashboard.totalCows'))}
          onViewDetails={() => onNavigate?.('herd')}
        />
        <StatCard
          title={t('dashboard.avgWeight')}
          value="1,180 lbs"
          trend="-5 lbs from last month"
          trendUp={false}
          icon={<Scale className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
          color="bg-gray-100 dark:bg-gray-700"
          onExport={() => handleExport(t('dashboard.avgWeight'))}
          onViewDetails={() => onNavigate?.('herd')}
        />
        <StatCard
          title={t('dashboard.overweightAlerts')}
          value="24"
          trend="+3 since yesterday"
          trendUp={true}
          isAlert={true}
          icon={<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          color="bg-red-100 dark:bg-red-900/30"
          onExport={() => handleExport(t('dashboard.overweightAlerts'))}
          onViewDetails={() => onNavigate?.('herd')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 transition-colors">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Average Weight Trend</h3>
        <p className="text-sm text-gray-500">Trailing {timeFilter === '7days' ? '7 days' : timeFilter === '30days' ? '30 days' : 'year'} across all active scales</p>
      </div>
      
      <div className="relative" ref={timeFilterRef}>
        <button
          onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
          className="flex items-center justify-between w-full min-w-[160px] bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#008ffb] font-sans cursor-pointer transition-colors hover:border-gray-300"
        >
          <span>{timeFilterOptions.find(opt => opt.value === timeFilter)?.label}</span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTimeFilterOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isTimeFilterOpen && (
          <div className="absolute top-full right-0 mt-2 w-full min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
            {timeFilterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setTimeFilter(option.value);
                  setIsTimeFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  timeFilter === option.value ? 'bg-blue-50 text-[#008ffb] font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={allWeightData[timeFilter]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer={false} style={{ outline: 'none' }}>
          <defs>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#008ffb" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#008ffb" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            animationDuration={300}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Area 
            type="monotone" 
            dataKey="weight" 
            stroke="#008ffb" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorWeight)"
            isAnimationActive={true}
            activeDot={{ r: 6, fill: '#008ffb', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    
    {/* Quick Actions Panel */}
    <div className="mt-6 pt-6 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
      <div className="flex gap-3">
        <button 
          onClick={() => setIsWeighInModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#008ffb]/10 text-[#007cdb] rounded-lg hover:bg-[#008ffb]/20 transition-colors font-medium text-sm border border-[#008ffb]/20"
        >
          <Plus size={16} /> New Weigh-in
        </button>
        <button 
          onClick={() => handleExport('report')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm"
        >
          Generate Report
        </button>
      </div>
    </div>
  </div>

  {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-[520px] transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.recentWeighIns')}</h3>
            <button className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1 hover:text-green-700 dark:hover:text-green-300 transition-colors">
              {t('dashboard.viewAll')} <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {recentWeighIns.map((cow, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${cow.status === t('status.critical') ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50' :
                    cow.status === t('status.overweight') || cow.status === t('status.warning') ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50' :
                      'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
                    }`}>
                    <div className="w-6 h-6 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{cow.id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{cow.time}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{cow.weight} <span className="text-xs font-medium text-gray-500 dark:text-gray-400">lbs</span></p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    {cow.trend === 'up' ? (
                      <ArrowUpRight size={14} className="text-green-500" />
                    ) : cow.trend === 'down' ? (
                      <ArrowDownRight size={14} className="text-red-500" />
                    ) : (
                      <CheckCircle2 size={14} className="text-gray-400 dark:text-gray-500" />
                    )}
                    <span className={`text-xs font-semibold ${cow.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                      cow.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                      {cow.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Weigh-in Modal */}
      {isWeighInModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Manual Weigh-in</h3>
              <button 
                onClick={() => setIsWeighInModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                setIsWeighInModalOpen(false);
                alert("Weigh-in recorded successfully!");
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cow ID (Tag)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. TAG-8921"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (lbs)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 1250"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsWeighInModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
