import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2, MoreVertical, Calendar, Edit2, Trash2, Heart, FileText, Filter, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import cowIcon from '../assets/cow.png';

const initialMockHerd = [
  { id: 'TAG-8921', weight: 1450, status: 'overweight', lastSync: '10 mins ago', trend: 'up', age: '3 yrs', breed: 'Angus', health: 'Good', gender: 'Male' },
  { id: 'TAG-1142', weight: 1120, status: 'normal', lastSync: '45 mins ago', trend: 'stable', age: '2 yrs', breed: 'Hereford', health: 'Excellent', gender: 'Female' },
  { id: 'TAG-9932', weight: 1520, status: 'critical', lastSync: '1 hour ago', trend: 'up', age: '4 yrs', breed: 'Angus', health: 'Attention Required', gender: 'Male' },
  { id: 'TAG-0021', weight: 1180, status: 'normal', lastSync: '2 hours ago', trend: 'down', age: '2.5 yrs', breed: 'Brahman', health: 'Good', gender: 'Female' },
  { id: 'TAG-4431', weight: 1390, status: 'warning', lastSync: '3 hours ago', trend: 'up', age: '3.5 yrs', breed: 'Angus', health: 'Monitor', gender: 'Female' },
  { id: 'TAG-7721', weight: 1205, status: 'normal', lastSync: '5 hours ago', trend: 'stable', age: '2 yrs', breed: 'Hereford', health: 'Good', gender: 'Male' },
  { id: 'TAG-8812', weight: 1195, status: 'normal', lastSync: '5 hours ago', trend: 'down', age: '2 yrs', breed: 'Angus', health: 'Good', gender: 'Female' },
];

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
  const [herdData, setHerdData] = useState(initialMockHerd);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingCow, setEditingCow] = useState<any>(null);
  const [selectedCow, setSelectedCow] = useState<typeof initialMockHerd[0] | null>(null);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddCowModal, setShowAddCowModal] = useState(false);
  const [genderFilter, setGenderFilter] = useState('All');
  const [breedFilter, setBreedFilter] = useState('All');
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchCows = async () => {
    try {
      const res = await fetch('/api/cows');
      if (res.ok) {
        const data = await res.json();
        const mappedCows = data.map((cow: any) => ({
          id: cow.cowId,
          weight: cow.latestWeight || 1000, 
          status: 'normal',
          lastSync: new Date(cow.updatedAt || cow.createdAt).toLocaleDateString(),
          trend: 'stable',
          age: cow.birthDate ? Math.floor((new Date().getTime() - new Date(cow.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs' : 'N/A',
          breed: cow.breed,
          health: 'Good',
          gender: cow.gender
        }));
        if (mappedCows.length > 0) {
          setHerdData(mappedCows);
        }
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

  return (
    <div className="relative h-full flex flex-col transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('herd.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('herd.subtitle', 'Manage your livestock, view records, and track health.')}</p>
        </div>
        <button onClick={() => setShowAddCowModal(true)} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <Plus size={20} />
          <span>{t('herd.addCow', 'Add Cow')}</span>
        </button>
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
                      <option value="Angus">Angus</option>
                      <option value="Hereford">Hereford</option>
                      <option value="Brahman">Brahman</option>
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
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('herd.table.weight', 'Weight (lbs)')}</th>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cow.status === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      cow.status === 'overweight' || cow.status === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {t(`status.${cow.status}`)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{cow.lastSync}</td>
                  <td className="py-4 px-6 text-right">
                      <div className="relative inline-block text-left">
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === cow.id ? null : cow.id); }}>
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === cow.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={() => { setEditingCow(cow); setShowAddCowModal(true); setActiveDropdown(null); }}>
                              <Edit2 size={14} className="text-gray-400" /> Edit Details
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors" onClick={() => { setHerdData(herdData.filter(c => c.id !== cow.id)); setActiveDropdown(null); }}>
                              <Trash2 size={14} className="text-red-500" /> Delete Cow
                            </button>
                          </div>
                        )}
                      </div>
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
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
                    <FileText size={16} />
                    <span className="text-sm font-medium">{t('herd.detail.currentWeight', 'Current Weight')}</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{selectedCow.weight}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">lbs</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
                    <Heart size={16} />
                    <span className="text-sm font-medium">{t('herd.detail.healthStatus', 'Health Status')}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedCow.health}</div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('herd.detail.weightHistory', 'Weight History (YTD)')}</h3>
                <div className="h-64 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="opacity-50 dark:opacity-20" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-prose-body, white)', color: '#111827' }}
                        itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors shadow-sm text-center">
                  {t('herd.detail.editRecord', 'Edit Record')}
                </button>
                <button 
                  onClick={() => setShowScaleModal(true)}
                  className="px-4 py-3 bg-green-600 border border-transparent text-white hover:bg-green-700 rounded-xl font-medium transition-colors shadow-sm text-center"
                >
                  {t('herd.detail.addWeighIn', 'Add Weigh-in')}
                </button>
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
              <button onClick={() => { setShowAddCowModal(false); setEditingCow(null); }} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              
              const ageStr = formData.get('age') as string;
              let birthDate = new Date();
              const numYears = parseInt(ageStr) || 1;
              birthDate.setFullYear(birthDate.getFullYear() - numYears);

              const payload = {
                cowId: formData.get('tagId') as string,
                name: formData.get('tagId') as string,
                breed: formData.get('breed') as string,
                gender: formData.get('gender') as string,
                birthDate: birthDate.toISOString()
              };

              fetch('/api/cows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).then(() => {
                const initialWeight = formData.get('weight');
                if (initialWeight) {
                  return fetch(`/api/cows/${payload.cowId}/weights`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weight: Number(initialWeight), deviceId: 'MANUAL' })
                  });
                }
              }).then(() => {
                fetchCows();
                setShowAddCowModal(false); 
              }).catch(err => console.error('Error adding cow:', err));
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag ID</label>
                  <input name="tagId" required type="text" placeholder="e.g. TAG-1234" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Breed</label>
                  <select name="breed" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors">
                    <option value="Angus">Angus</option>
                    <option value="Hereford">Hereford</option>
                    <option value="Brahman">Brahman</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                  <input name="age" required type="text" placeholder="e.g. 2 yrs" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select name="gender" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Weight (Optional)</label>
                  <div className="relative">
                    <input name="weight" type="number" placeholder="e.g. 1000" className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">lbs</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button type="button" onClick={() => { setShowAddCowModal(false); setEditingCow(null); }} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm">
                  Add Cow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
