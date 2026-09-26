import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2, MoreVertical, Calendar, Heart, FileText, Filter, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import cowIcon from '../assets/cow.png';
import { authService } from '../services/authService';

const initialMockHerd: any[] = [];

const mockHistoryData = [
  { month: 'Jan', weight: 1100 },
  { month: 'Feb', weight: 1150 },
  { month: 'Mar', weight: 1200 },
  { month: 'Apr', weight: 1250 },
  { month: 'May', weight: 1350 },
  { month: 'Jun', weight: 1400 },
  { month: 'Jul', weight: 1450 },
];

const mockScales = [
  { id: 'SCALE-01', name: 'North Pasture Gate' },
  { id: 'SCALE-02', name: 'Barn A Entrance' },
  { id: 'SCALE-03', name: 'South Water Trough' },
];

interface HerdProps {
  onNavigateToScale?: (scaleId: string, cowId?: string) => void;
}

export function Herd({ onNavigateToScale }: HerdProps) {
  const { t } = useTranslation();
  const [herdData, setHerdData] = useState<any[]>(initialMockHerd);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCow, setSelectedCow] = useState<any | null>(null);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddCowModal, setShowAddCowModal] = useState(false);
  const [genderFilter, setGenderFilter] = useState('All');
  const [breedFilter, setBreedFilter] = useState('All');
  const [cowHistory, setCowHistory] = useState<any[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchCows = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch('/api/v1/cows', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mappedCows = data.map((cow: any) => {
          const rawStatus = (cow.latestStatus || '').toLowerCase();
          let computedStatus = !cow.breed ? 'incomplete' : (cow.latestStatus || 'normal');
          if (cow.breed && cow.latestStatus) {
            if (rawStatus.includes('sickness') || rawStatus.includes('critical')) computedStatus = 'critical';
            else if (rawStatus.includes('overweight')) computedStatus = 'overweight';
            else if (rawStatus.includes('underweight')) computedStatus = 'warning';
          }

          return {
            internalId: cow.id,
            id: cow.cowId,
            weight: cow.latestWeight || 0, 
            status: computedStatus,
            lastSync: new Date(cow.createdAt).toLocaleDateString(),
            trend: 'stable',
            age: cow.dateOfBirth ? Math.floor((new Date().getTime() - new Date(cow.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs' : 'Unknown',
            breed: cow.breed || 'Unknown',
            health: cow.latestStatus || (cow.breed ? 'Pending Weigh-in' : 'Needs Registration'),
            gender: cow.sex || 'Unknown'
          };
        });
        setHerdData(mappedCows);
      }
    } catch (e) {
      console.error('Error fetching cows:', e);
    }
  };

  useEffect(() => {
    fetchCows();
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedCow && selectedCow.status !== 'incomplete') {
      fetch(`/api/v1/cows/${(selectedCow as any).internalId}/measurements`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const sorted = data.sort((a: any, b: any) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
        const mapped = sorted.map((m: any) => ({
          date: new Date(m.measuredAt).toLocaleDateString(),
          time: new Date(m.measuredAt).toLocaleTimeString(),
          weight: m.weightKg,
          device: m.deviceId,
          status: m.status
        }));
        setCowHistory(mapped);
      })
      .catch(console.error);
    } else {
      setCowHistory([]);
    }
  }, [selectedCow]);

  const filteredHerd = herdData.filter(cow => {
    const matchesSearch = cow.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t(`status.${cow.status}`).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || cow.gender === genderFilter;
    const matchesBreed = breedFilter === 'All' || cow.breed === breedFilter;
    return matchesSearch && matchesGender && matchesBreed;
  });

  const handleExport = () => {
    if (filteredHerd.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(filteredHerd[0]).join(",") + "\n"
      + filteredHerd.map(row => Object.values(row).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `herd_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCowHistory = () => {
    if (cowHistory.length === 0 || !selectedCow) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Tag ID,Breed,Gender,Age,Date,Time,Weight (KG),Scale ID,Status\n"
      + cowHistory.map(row => `${selectedCow.id},${selectedCow.breed},${selectedCow.gender},${selectedCow.age},${row.date},${row.time},${row.weight},${row.device},${row.status || 'Unknown'}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `history_${selectedCow?.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative h-full flex flex-col transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('herd.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('herd.subtitle', 'Manage your livestock, view records, and track health.')}</p>
        </div>
        <div className="flex items-center text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="font-medium">💡 New tags are automatically added when scanned by the scale.</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center flex-1">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder={t('herd.searchPlaceholder', 'Search by Tag ID or Status...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-0 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-sans transition-colors"
            />
          </div>
          
          <div className="relative w-full sm:w-auto" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex w-full sm:w-auto items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
            >
              <Filter size={16} />
              <span>{t('herd.filter', 'Filter')}</span>
              {(genderFilter !== 'All' || breedFilter !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
              )}
            </button>
            
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-[26rem] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-10 animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Gender</label>
                    <select 
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-0 text-gray-900 dark:text-white transition-colors"
                    >
                      <option value="All">{t('herd.filterAllGenders', 'All Genders')}</option>
                      <option value="Male">{t('herd.filterMale', 'Male')}</option>
                      <option value="Female">{t('herd.filterFemale', 'Female')}</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Breed</label>
                    <select 
                      value={breedFilter}
                      onChange={(e) => setBreedFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-0 text-gray-900 dark:text-white transition-colors"
                    >
                      <option value="All">{t('herd.filterAllBreeds', 'All Breeds')}</option>
                      <option value="Brahman Cross">Brahman Cross</option>
                      <option value="Local Zebu">Local Zebu</option>
                      <option value="Sahiwal">Sahiwal</option>
                      <option value="Holstein Cross">Holstein Cross</option>
                      <option value="Red Chittagong">Red Chittagong</option>
                      <option value="Pabna">Pabna</option>
                      <option value="Sindhi Cross">Sindhi Cross</option>
                    </select>

                  </div>
                </div>
                {(genderFilter !== 'All' || breedFilter !== 'All') && (
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                    <button 
                        onClick={() => {
                          setGenderFilter('All');
                          setBreedFilter('All');
                          setShowFilters(false);
                        }}
                        className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Download size={16} />
          <span>{t('herd.export', 'Export')}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px] transition-colors">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('herd.table.tagId', 'Tag ID')}</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('herd.table.weight', 'Weight (KG)')}</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('herd.table.status', 'Status')}</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('herd.table.lastSync', 'Last Sync')}</th>
                <th className="py-4 px-6 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('herd.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredHerd.length > 0 ? filteredHerd.map((cow) => (
                <tr key={cow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer" onClick={() => setSelectedCow(cow)}>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                         <div className="w-4 h-4 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{cow.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 dark:text-white">{cow.weight}</span>
                      {cow.trend === 'up' ? (
                        <ArrowUpRight size={16} className="text-red-500 dark:text-red-400" />
                      ) : cow.trend === 'down' ? (
                        <ArrowDownRight size={16} className="text-green-500 dark:text-green-400" />
                      ) : (
                        <CheckCircle2 size={16} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col space-y-1.5 items-start">
                      {/* Model 1: Weight Classification */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cow.status === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        cow.status === 'incomplete' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        cow.status === 'overweight' || cow.status === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {cow.status === 'incomplete' ? 'Incomplete' : t(`status.${cow.status}`, cow.health)}
                        {cow.confidence && <span className="ml-1 opacity-75 font-mono text-[10px]">({cow.confidence})</span>}
                      </span>
                      {/* Model 2: Isolation Forest Anomaly Detection */}
                      {cow.breed && cow.anomalyFlag && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          cow.isAnomaly ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {cow.isAnomaly ? '⚠️' : '🛡️'} {cow.anomalyFlag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{cow.lastSync}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    {t('herd.noResults', 'No cows found matching your search.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail View */}
      {selectedCow && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedCow(null)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-800">
                   <div className="w-6 h-6 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCow.id}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCow.breed} • {selectedCow.age}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCow(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Stats - Dual Model Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
                    <FileText size={16} />
                    <span className="text-sm font-medium">{t('herd.detail.currentWeight', 'Current Weight')}</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{selectedCow.weight}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">kg</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                    <Heart size={14} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Model 1: Classification</span>
                  </div>
                  <div className="text-base font-bold text-gray-900 dark:text-white capitalize">
                    {selectedCow.health}
                    {selectedCow.confidence && <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-mono">({selectedCow.confidence})</span>}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model 2: Anomaly Detection</div>
                    <div className={`text-xs font-bold mt-0.5 ${selectedCow.isAnomaly ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {selectedCow.anomalyFlag || 'Normal'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('herd.detail.weightHistory', 'Weight History (YTD)')}</h3>
                <div className="h-64 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                  {cowHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cowHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="opacity-50 dark:opacity-20" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-prose-body, white)', color: '#111827' }}
                        itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No measurement history yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed History Table */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('herd.detail.recentWeighIns', 'Recent Weigh-ins')}</h3>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {cowHistory.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date/Time</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scale</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {cowHistory.slice().reverse().map((record, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">
                                <div>{record.date}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{record.time}</div>
                              </td>
                              <td className="py-3 px-4 text-sm font-mono text-gray-500 dark:text-gray-400">{record.device}</td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{record.weight} kg</td>
                              <td className="py-3 px-4">
                                {record.status ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                                    record.status === 'underweight' || record.status === 'overweight' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {record.status}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No recent weigh-ins found.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                {selectedCow.status === 'incomplete' ? (
                  <button 
                    onClick={() => { setShowAddCowModal(true); /* Reuse modal for updating */ }}
                    className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors shadow-sm text-center col-span-2"
                  >
                    Complete Registration
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleExportCowHistory}
                      className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Export CSV
                    </button>
                    <button 
                      onClick={() => { setShowAddCowModal(true); /* Edit Record */ }}
                      className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors shadow-sm text-center">
                      {t('herd.detail.editRecord', 'Edit Record')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Scale Selection Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Scale</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a scale for weigh-in</p>
              </div>
              <button onClick={() => setShowScaleModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {mockScales.map(scale => (
                <button
                  key={scale.id}
                  onClick={() => {
                    const cowId = selectedCow?.id;
                    setShowScaleModal(false);
                    setSelectedCow(null);
                    onNavigateToScale?.(scale.id, cowId);
                  }}
                  className="w-full flex justify-between items-center p-4 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl border border-transparent hover:border-green-100 dark:hover:border-green-900/50 transition-colors group text-left"
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400">{scale.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5">{scale.id}</div>
                  </div>
                  <ArrowUpRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Cow Modal */}
      {showAddCowModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Cow</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter the details for the new livestock</p>
              </div>
              <button onClick={() => setShowAddCowModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);

              const payload = {
                cowId: formData.get('tagId') as string,
                breed: formData.get('breed') as string,
                gender: formData.get('gender') as string,
                birthDate: formData.get('birthDate') ? new Date(formData.get('birthDate') as string).toISOString() : undefined
              };

              const url = selectedCow 
                ? `/api/v1/cows/${(selectedCow as any).internalId}` 
                : '/api/v1/cows';
              const method = selectedCow ? 'PUT' : 'POST';

              fetch(url, {
                method,
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify(payload)
              }).then(res => {
                if (!res.ok) throw new Error('Failed to save cow');
                return res.json();
              }).then(() => {
                fetchCows();
                setShowAddCowModal(false); 
                setSelectedCow(null);
              }).catch(err => console.error('Error saving cow:', err));
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag ID</label>
                  <input name="tagId" required type="text" defaultValue={selectedCow?.id || ''} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition-colors opacity-75 cursor-not-allowed" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Breed</label>
                  <select name="breed" defaultValue={selectedCow?.breed || 'Brahman Cross'} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors">
                    <option value="Brahman Cross">Brahman / Brahman Cross</option>
                    <option value="Local Zebu">Local Zebu</option>
                    <option value="Sahiwal">Sahiwal</option>
                    <option value="Holstein Cross">Holstein / Holstein Cross</option>
                    <option value="Red Chittagong">Red Chittagong</option>
                    <option value="Pabna">Pabna</option>
                    <option value="Sindhi Cross">Sindhi / Sindhi Cross</option>
                    <option value="Other">Other</option>
                  </select>

                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                  <input name="birthDate" required type="date" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select name="gender" defaultValue={selectedCow?.gender || 'Female'} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button type="button" onClick={() => setShowAddCowModal(false)} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm">
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
