import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, ArrowLeft, Activity, RefreshCw, CheckCircle2, Trash2, Plus, X } from 'lucide-react';

export interface Scale {
  id: string;
  name: string;
  status: string;
  battery: number;
  lastSync: string;
  currentReading: string;
}

const mockLogs = [
  { id: 1, time: '10:42 AM', type: 'Weight Recorded', details: 'Tag #8492 - 560 kg', status: 'success' },
  { id: 2, time: '10:15 AM', type: 'Zero Calibrated', details: 'Manual reset to 0 kg', status: 'info' },
  { id: 3, time: '09:30 AM', type: 'Weight Recorded', details: 'Tag #7731 - 440 kg', status: 'success' },
  { id: 4, time: '08:05 AM', type: 'Error', details: 'Unstable reading timeout', status: 'error' },
];

interface DevicesProps {
  scalesData: Scale[];
  activeScaleId?: string | null;
  setActiveScaleId?: (id: string | null) => void;
  weighingCowId?: string | null;
  setWeighingCowId?: (id: string | null) => void;
  onRemoveDevice?: (id: string) => void;
  onAddDevice?: (deviceId: string, name?: string) => Promise<void> | void;
}

export function Devices({ scalesData, activeScaleId = null, setActiveScaleId = () => {}, weighingCowId = null, setWeighingCowId = () => {}, onRemoveDevice, onAddDevice }: DevicesProps) {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceIdInput, setDeviceIdInput] = useState('esp32-gateway-01');
  const [deviceNameInput, setDeviceNameInput] = useState('Main Barn Scale');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const selectedScale = activeScaleId ? scalesData.find(s => s.id === activeScaleId) || null : null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceIdInput.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddDevice?.(deviceIdInput.trim(), deviceNameInput.trim());
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedScale) {
    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                setActiveScaleId(null);
                setWeighingCowId?.(null);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedScale.name}</h2>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${selectedScale.status === 'online' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {selectedScale.status === 'online' ? t('devices.statusOnline') : t('devices.statusOffline')}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-mono text-sm mt-1">{selectedScale.id}</p>
            </div>
          </div>
          
          {onRemoveDevice && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to remove ${selectedScale.name}?`)) {
                  onRemoveDevice(selectedScale.id);
                  setActiveScaleId(null);
                }
              }}
              className="p-2 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
              <span className="font-medium hidden sm:inline">Remove Device</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Live Reading Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
              <div className="absolute top-4 right-4">
                 {selectedScale.status === 'online' ? (
                   <span className="flex h-3 w-3 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                   </span>
                 ) : (
                   <span className="flex h-3 w-3 relative">
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400 dark:bg-gray-600"></span>
                   </span>
                 )}
              </div>
              <Activity size={32} className="text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('devices.liveReading', 'Live Reading')}</p>
              <div className="text-6xl font-bold text-gray-900 dark:text-white font-mono tracking-tight mb-2">
                {String(selectedScale.currentReading || '0 kg').split(' ')[0]}
              </div>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium mb-8">
                {String(selectedScale.currentReading || '0 kg').split(' ')[1] || 'kg'}
              </p>
              
              <div className="w-full flex space-x-3">
                <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors">
                  <RefreshCw size={18} />
                  <span>{t('devices.zeroScale', 'Zero Scale')}</span>
                </button>
                {weighingCowId && (
                  <div className="flex-1 flex items-center justify-center space-x-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-3 px-4 rounded-xl font-medium border border-green-200 dark:border-green-800 shadow-sm cursor-default">
                    <CheckCircle2 size={18} />
                    <span>Bound to: {weighingCowId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4 transition-colors">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={`font-medium ${selectedScale.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {selectedScale.status === 'online' ? t('devices.statusOnline') : t('devices.statusOffline')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('devices.lastSync')}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{selectedScale.lastSync}</span>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('devices.logsTitle', 'Recent Activity')}</h3>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t('devices.logTime', 'Time')}</th>
                    <th className="px-6 py-4 font-medium">{t('devices.logType', 'Event')}</th>
                    <th className="px-6 py-4 font-medium">{t('devices.logDetails', 'Details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.time}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          log.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transition-colors">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('devices.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your connected weighing hardware across all pastures.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Scale Device</span>
        </button>
      </div>

      {scalesData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scalesData.map((scale) => (
            <div 
              key={scale.id} 
              onClick={() => setActiveScaleId(scale.id)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{scale.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{scale.id}</p>
                </div>
                <div className="flex gap-2">
                  <div className={`p-2 rounded-lg ${scale.status === 'online' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                    {scale.status === 'online' ? <Wifi size={20} /> : <WifiOff size={20} />}
                  </div>
                  {onRemoveDevice && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to remove ${scale.name}?`)) {
                          onRemoveDevice(scale.id);
                        }
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`font-medium ${scale.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {scale.status === 'online' ? t('devices.statusOnline') : t('devices.statusOffline')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('devices.lastSync')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{scale.lastSync}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('devices.currentReading')}</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{String(scale.currentReading || '0 kg').split(' ')[0]}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{String(scale.currentReading || '0 kg').split(' ')[1] || 'kg'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Devices Connected</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            You don't have any smart scales registered to your farm yet. Devices will appear here automatically once configured on the network.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Scale Device</span>
          </button>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Scale Device</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Register hardware scale to your farm account</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device ID / Hardware Serial</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. esp32-gateway-01"
                  value={deviceIdInput}
                  onChange={(e) => setDeviceIdInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => setDeviceIdInput('esp32-gateway-01')}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline font-mono"
                  >
                    esp32-gateway-01
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceIdInput('esp32-gateway-02')}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline font-mono"
                  >
                    esp32-gateway-02
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scale Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Main Pasture Gate Scale"
                  value={deviceNameInput}
                  onChange={(e) => setDeviceNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
