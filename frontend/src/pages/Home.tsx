import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/StatCard';
import cowIcon from '../assets/cow.png';
import { authService } from '../services/authService';

interface HomeProps {
  onNavigate?: (tab: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'year'>('7days');
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [isWeighInModalOpen, setIsWeighInModalOpen] = useState(false);
  const timeFilterRef = useRef<HTMLDivElement>(null);

  const [summaryData, setSummaryData] = useState<{
    totalCows: number;
    avgWeightKg: number;
    alertCount: number;
    recentActivity: any[];
  }>({
    totalCows: 0,
    avgWeightKg: 0,
    alertCount: 0,
    recentActivity: []
  });

  const [trendPoints, setTrendPoints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeFilterRef.current && !timeFilterRef.current.contains(event.target as Node)) {
        setIsTimeFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real summary and trend data from backend
  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    setIsLoading(true);

    Promise.all([
      fetch('/api/v1/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : null),
      fetch('/api/v1/dashboard/trends', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : null)
    ])
    .then(([summary, trends]) => {
      if (summary) {
        const recent = (summary.recentActivity || []).map((m: any) => ({
          id: m.cow?.cowId || m.cowId || `TAG-${m.id}`,
          weight: Math.round(m.weightKg),
          status: m.healthStatus === 'OVERWEIGHT' ? t('status.overweight') :
                  m.healthStatus === 'CRITICAL' ? t('status.critical') :
                  m.healthStatus === 'UNDERWEIGHT' ? t('status.warning') : t('status.normal'),
          time: new Date(m.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          trend: 'stable'
        }));

        const totalCowsCount = summary.totalCows || 0;
        const totalWeight = recent.reduce((sum: number, item: any) => sum + item.weight, 0);
        const avgKg = recent.length > 0 ? Math.round(totalWeight / recent.length) : 0;
        const alerts = recent.filter((r: any) => r.status !== t('status.normal')).length;

        setSummaryData({
          totalCows: totalCowsCount,
          avgWeightKg: avgKg,
          alertCount: alerts,
          recentActivity: recent
        });
      }

      if (trends && trends.points) {
        const points = trends.points.map((pt: any) => ({
          day: pt.date ? pt.date.slice(5) : 'Day',
          weight: Math.round(pt.average_weight_kg || 0)
        }));
        setTrendPoints(points);
      }
    })
    .catch(err => console.error('Dashboard fetch error:', err))
    .finally(() => setIsLoading(false));
  }, [t]);

  const timeFilterOptions = [
    { value: '7days', label: t('timeFilter.last7Days') },
    { value: '30days', label: t('timeFilter.last30Days') },
    { value: 'year', label: t('timeFilter.thisYear') },
  ];

  const handleExport = (title: string) => {
    const data = summaryData.recentActivity;
    if (data.length === 0) return;
    
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
          value={summaryData.totalCows.toLocaleString()}
          trend="Registered cows"
          trendUp={true}
          icon={<div className="w-6 h-6 bg-current text-gray-600 dark:text-gray-300" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />}
          color="bg-gray-100 dark:bg-gray-700"
          onExport={() => handleExport(t('dashboard.totalCows'))}
          onViewDetails={() => onNavigate?.('herd')}
        />
        <StatCard
          title={t('dashboard.avgWeight')}
          value={summaryData.avgWeightKg > 0 ? `${summaryData.avgWeightKg.toLocaleString()} kg` : '0 kg'}
          trend="Latest average"
          trendUp={true}
          icon={<Scale className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
          color="bg-gray-100 dark:bg-gray-700"
          onExport={() => handleExport(t('dashboard.avgWeight'))}
          onViewDetails={() => onNavigate?.('herd')}
        />
        <StatCard
          title={t('dashboard.overweightAlerts')}
          value={summaryData.alertCount.toString()}
          trend="Active alerts"
          trendUp={summaryData.alertCount === 0}
          isAlert={summaryData.alertCount > 0}
          icon={<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          color="bg-red-100 dark:bg-red-900/30"
          onExport={() => handleExport(t('dashboard.overweightAlerts'))}
          onViewDetails={() => onNavigate?.('herd')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Average Weight Trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Live backend measurements across your herd</p>
            </div>
            
            <div className="relative" ref={timeFilterRef}>
              <button
                onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                className="flex items-center justify-between w-full min-w-[160px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 font-sans cursor-pointer transition-colors hover:border-green-300 dark:hover:border-green-500"
              >
                <span>{timeFilterOptions.find(opt => opt.value === timeFilter)?.label}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTimeFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isTimeFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-full min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                  {timeFilterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTimeFilter(option.value as '7days' | '30days' | 'year');
                        setIsTimeFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${timeFilter === option.value ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {trendPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
                    animationDuration={300}
                    animationEasing="ease-out"
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'white', color: '#111827' }}
                    itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No weight measurements recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Connect an IoT scale or add cows in the Herd tab</p>
              </div>
            )}
          </div>
          
          {/* Quick Actions Panel */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
            <div className="flex gap-3">
              <button 
                onClick={() => onNavigate?.('herd')}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors font-medium text-sm border border-green-200 dark:border-green-800 cursor-pointer"
              >
                <Plus size={16} /> Manage Herd
              </button>
              <button 
                onClick={() => handleExport('report')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm border border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer"
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
            <button 
              onClick={() => onNavigate?.('herd')}
              className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1 hover:text-green-700 dark:hover:text-green-300 transition-colors cursor-pointer"
            >
              {t('dashboard.viewAll')} <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {summaryData.recentActivity.length > 0 ? (
              summaryData.recentActivity.map((cow, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onNavigate?.('herd')}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${cow.status === t('status.critical') ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      cow.status === t('status.overweight') || cow.status === t('status.warning') ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      }`}>
                      <div className="w-6 h-6 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{cow.id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{cow.time}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{cow.weight} <span className="text-xs font-medium text-gray-500 dark:text-gray-400">kg</span></p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <CheckCircle2 size={14} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {cow.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <Scale className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">No recent weigh-ins</p>
                <button
                  onClick={() => onNavigate?.('herd')}
                  className="mt-3 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors"
                >
                  View Herd
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
