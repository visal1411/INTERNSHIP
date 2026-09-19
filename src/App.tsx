import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './hooks/useLanguage';
import {
  Home as HomeIcon,
  Users,
  Cpu,
  Settings as SettingsIcon,
  Search,
  Bell,
  Globe,
  AlertTriangle,
  Info,
  Moon,
  Sun,
  Wifi,
  Scale,
  LayoutDashboard
} from 'lucide-react';
import logoImg from './assets/cowfit_pro_logo.jpg';
import cowIcon from './assets/cow.png';
import { Home } from './pages/Home';
import { Devices, Scale as ScaleInterface } from './pages/Devices';
import { Herd } from './pages/Herd';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NavItem } from './components/NavItem';

// --- Main App Component ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true' || sessionStorage.getItem('isAuthenticated') === 'true';
  });
  
  const handleLogin = (remember = false) => {
    if (remember) {
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      sessionStorage.setItem('isAuthenticated', 'true');
    }
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

    const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('home');
  const [activeScaleId, setActiveScaleId] = useState<string | null>(null);
  const [weighingCowId, setWeighingCowId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Default to dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const navigateToScale = (scaleId: string, cowId?: string) => {
    setActiveScaleId(scaleId);
    setWeighingCowId(cowId || null);
    setActiveTab('devices');
  };
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();
  
  const [scalesData, setScalesData] = useState<ScaleInterface[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', text: 'TAG-8921 is overweight (1450 lbs)', time: '10 mins ago' },
    { id: 2, type: 'error', text: 'Scale SCALE-02 is offline', time: '1 hour ago' },
    { id: 3, type: 'info', text: 'Weekly report generated successfully', time: '2 hours ago' },
  ]);

  // Polling logic for when ESP32 or hardware connects
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/devices');
        if (!res.ok) return;
        const rawDevices = await res.json();
        const newScales: ScaleInterface[] = rawDevices.map((d: any) => ({
          id: d.deviceId || d.id,
          name: d.name || 'Unknown Device',
          status: d.status || 'offline',
          battery: d.battery || 100,
          lastSync: d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString() : 'Unknown',
          currentReading: d.currentReading || '0 lbs'
        }));
        
        setScalesData(prevScales => {
          // Check for newly added devices
          newScales.forEach(newScale => {
            const exists = prevScales.find(s => s.id === newScale.id);
            if (!exists) {
              // Trigger Toast Notification
              setToastMessage(`New device connected: ${newScale.name}`);
              setTimeout(() => setToastMessage(null), 5000);
              
              // Add to notification center
              setNotifications(prev => [
                {
                  id: Date.now(),
                  type: 'info',
                  text: `New device connected: ${newScale.name} (${newScale.id})`,
                  time: 'Just now'
                },
                ...prev
              ]);
            }
          });
          return newScales;
        });
      } catch (err) {
        // Silent fail on polling if backend isn't up
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleAddDevice = (name: string) => {
    const newDevice = {
      id: 'SCALE-' + Math.floor(1000 + Math.random() * 9000),
      name: name,
      status: 'online',
      battery: '100%',
      lastSync: 'Just now',
      currentReading: '0 lbs'
    };
    setScalesData(prev => [...prev, newDevice as any]);
    setToastMessage("Device added successfully");
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const handleRemoveDevice = async (id: string) => {
    // Optimistic update
    setScalesData(prev => prev.filter(scale => scale.id !== id));
    setToastMessage("Device removed successfully");
    setTimeout(() => setToastMessage(null), 3000);
    
    try {
      await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete device', err);
    }
  };

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onRegister={() => handleLogin(false)} onNavigateLogin={() => setAuthView('login')} />;
    }
    return <Login onLogin={(remember) => handleLogin(remember)} onNavigateRegister={() => setAuthView('register')} />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-800 flex font-sans transition-colors duration-200`}>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col flex-shrink-0
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'}`}
        style={{ boxShadow: '0 3px 9px 0 rgba(169, 184, 200, .15)' }}
      >
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="CowFit Logo" className="w-10 h-10 object-contain rounded-lg" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">CowFit</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 pl-4 pr-0 custom-scrollbar">
          <div className="space-y-1">
            <h5 className="pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Dashboard</h5>
            <NavItem icon={<HomeIcon size={20} />} label={t('nav.home')} active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }} />
            
            <div className="my-4 border-t border-gray-100 pr-4"></div>
            <h5 className="pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Applications</h5>
            
            <NavItem icon={<Users size={20} />} label={t('nav.herd')} active={activeTab === 'herd'} onClick={() => { setActiveTab('herd'); setIsSidebarOpen(false); }} />
            <NavItem icon={<Cpu size={20} />} label={t('nav.devices')} active={activeTab === 'devices'} onClick={() => { setActiveTab('devices'); setIsSidebarOpen(false); }} />
            
            <div className="my-4 border-t border-gray-100 pr-4"></div>
            
            <NavItem icon={<SettingsIcon size={20} />} label={t('nav.settings')} active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="h-20 bg-white flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-30 transition-colors" style={{ boxShadow: '0 3px 9px 0 rgba(169, 184, 200, .15)' }}>
          <div className="flex items-center text-xl font-medium text-gray-900 gap-4">
            <button 
              className="lg:hidden text-gray-500 hover:text-[#5f76e8]"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            {activeTab === 'home' && t('dashboard.overview')}
            {activeTab === 'devices' && t('nav.devices')}
            {activeTab === 'herd' && t('nav.herd')}
            {activeTab === 'settings' && t('nav.settings')}
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-colors text-gray-500 hover:text-gray-700"
            >
              <span>{currentLanguage === 'en' ? 'EN' : 'ខ្មែរ'}</span>
            </button>

            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="pl-9 pr-4 py-2 bg-white border-0 rounded-full text-sm focus:outline-none w-64 text-gray-900 placeholder-gray-400"
                style={{ boxShadow: '0 2px 9px 0 rgba(169, 184, 200, .2)' }}
              />
            </div>
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                className="relative p-2 text-gray-400 hover:text-[#5f76e8] transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50 bg-white">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    <span className="text-xs bg-[#5f76e8] text-white px-2 py-0.5 rounded-full font-medium">{notifications.length} new</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-4 transition-colors cursor-pointer flex gap-3 hover:bg-gray-50">
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                              notif.type === 'error' ? 'bg-red-500' : 
                              notif.type === 'warning' ? 'bg-orange-400' : 
                              'bg-blue-500'
                            }`}>
                              {notif.type === 'error' || notif.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">{notif.text}</p>
                              <p className="text-xs mt-1 text-gray-400">{notif.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm text-gray-500">
                        No new notifications
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t text-center border-gray-100">
                      <button className="text-sm text-[#5f76e8] font-medium hover:text-[#4b5ece]">Mark all as read</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Sign Out</button>
        </header>

        {/* Dynamic View Rendering */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-10 mb-16 md:mb-0">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
            {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
            {activeTab === 'devices' && <Devices scalesData={scalesData} onRemoveDevice={handleRemoveDevice} onAddDevice={handleAddDevice} activeScaleId={activeScaleId} setActiveScaleId={setActiveScaleId} weighingCowId={weighingCowId} setWeighingCowId={setWeighingCowId} />}
            {activeTab === 'herd' && <Herd onNavigateToScale={navigateToScale} />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t flex items-center justify-around z-50 transition-colors duration-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'home' ? 'text-[#5f76e8]' : 'text-gray-500'}`}
        >
          <HomeIcon size={20} className={activeTab === 'home' ? 'fill-current opacity-20 stroke-2' : ''} />
          <span className="text-[10px] font-medium">{t('nav.home')}</span>
        </button>
        <button
          onClick={() => setActiveTab('herd')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'herd' ? 'text-[#5f76e8]' : 'text-gray-500'}`}
        >
          <Users size={20} className={activeTab === 'herd' ? 'fill-current opacity-20 stroke-2' : ''} />
          <span className="text-[10px] font-medium">{t('nav.herd')}</span>
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'devices' ? 'text-[#5f76e8]' : 'text-gray-500'}`}
        >
          <Cpu size={20} className={activeTab === 'devices' ? 'fill-current opacity-20 stroke-2' : ''} />
          <span className="text-[10px] font-medium">{t('nav.devices')}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'settings' ? 'text-[#5f76e8]' : 'text-gray-500'}`}
        >
          <SettingsIcon size={20} className={activeTab === 'settings' ? 'fill-current opacity-20 stroke-2' : ''} />
          <span className="text-[10px] font-medium">{t('nav.settings')}</span>
        </button>
      </div>
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl shadow-lg font-medium flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}


