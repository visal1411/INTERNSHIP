import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import {
  Home as HomeIcon,
  Users,
  Cpu,
  LayoutDashboard,
  Scale,
  Settings as SettingsIcon,
  Search,
  Bell,
  Globe,
  AlertTriangle,
  Info,
  Moon,
  Sun,
  Wifi,
  LogOut
} from 'lucide-react';
import logoImg from './assets/custom-logo.jpg';
import cowIcon from './assets/cow.png';
import { Home } from './pages/Home';
import { Devices, Scale as ScaleInterface } from './pages/Devices';
import { Herd } from './pages/Herd';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { NavItem } from './components/NavItem';

// --- Main App Component ---
export default function App() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeScaleId, setActiveScaleId] = useState<string | null>(null);
  const [weighingCowId, setWeighingCowId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
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

  interface NotificationItem {
    id: number | string;
    type: 'warning' | 'error' | 'info';
    text: string;
    time: string;
    tab?: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const token = authService.getToken();
        if (!token) return;
        const res = await fetch('/api/v1/cows', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const cows = await res.json();
          const newNotifs: NotificationItem[] = [];

          cows.forEach((cow: any) => {
            const status = (cow.latestStatus || '').toLowerCase();
            if (status.includes('underweight') || status.includes('critical') || status.includes('attention')) {
              newNotifs.push({
                id: `cow-warning-${cow.id}`,
                type: 'error',
                text: `Cow #${cow.cowId} status is ${cow.latestStatus || 'Critical'} (${cow.latestWeight ? cow.latestWeight + ' kg' : 'No weight'})`,
                time: 'Recent',
                tab: 'herd'
              });
            } else if (status.includes('overweight')) {
              newNotifs.push({
                id: `cow-overweight-${cow.id}`,
                type: 'warning',
                text: `Cow #${cow.cowId} is overweight (${cow.latestWeight} kg)`,
                time: 'Recent',
                tab: 'herd'
              });
            } else if (!cow.breed) {
              newNotifs.push({
                id: `cow-info-${cow.id}`,
                type: 'info',
                text: `Cow #${cow.cowId} needs complete registration info`,
                time: 'Pending',
                tab: 'herd'
              });
            }
          });

          if (newNotifs.length === 0 && cows.length > 0) {
            newNotifs.push({
              id: 'all-healthy',
              type: 'info',
              text: `All ${cows.length} cows in herd are in healthy weight range`,
              time: 'Just now',
              tab: 'herd'
            });
          }

          setNotifications(newNotifs);
          setUnreadCount(newNotifs.length);
        }
      } catch (err) {
        console.error('Failed to load notifications from backend:', err);
      }
    };
    fetchNotifications();
  }, [isAuthenticated]);

  const handleAddDevice = (name: string) => {
    const newDevice = {
      id: 'SCALE-' + Math.floor(1000 + Math.random() * 9000),
      name: name,
      status: 'online',
      battery: '100%',
      lastSync: 'Just now',
      currentReading: '0 kg'
    };
    setScalesData(prev => [...prev, newDevice as any]);
    setToastMessage("Device added successfully");
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const handleRemoveDevice = (id: string) => {
    // Local device card removal
    setScalesData(prev => prev.filter(scale => scale.id !== id));
    setToastMessage("Device removed successfully");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // If user is not authenticated, display the Login screen
  if (!isAuthenticated) {
    return <Login onLoginSuccess={login} />;
  }

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'FM';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} flex font-sans transition-colors duration-200`}>
      {/* Sidebar - Frontend v2 Style */}
      <aside className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex-shrink-0 hidden md:flex flex-col transition-colors duration-200`} style={{ boxShadow: '0 3px 9px 0 rgba(169, 184, 200, .15)' }}>
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="AgroScale Logo" className="w-10 h-10 object-cover rounded-lg" />
            <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AgroScale</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 pl-4 pr-0 custom-scrollbar">
          <div className="space-y-1">
            <h5 className="pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Dashboard</h5>
            <NavItem icon={<HomeIcon size={20} />} label={t('nav.home')} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            
            <div className="my-4 border-t border-gray-100 dark:border-gray-700 pr-4"></div>
            <h5 className="pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Applications</h5>
            
            <NavItem icon={<Users size={20} />} label={t('nav.herd')} active={activeTab === 'herd'} onClick={() => setActiveTab('herd')} />
            <NavItem icon={<Cpu size={20} />} label={t('nav.devices')} active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} />
            
            <div className="my-4 border-t border-gray-100 dark:border-gray-700 pr-4"></div>
            
            <NavItem icon={<SettingsIcon size={20} />} label={t('nav.settings')} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`flex items-center p-2 rounded-xl ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`} onClick={() => setActiveTab('settings')}>
            <div className="w-9 h-9 rounded-full bg-[#5f76e8] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {initials}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Farmer Account'}</p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>✉️ {user?.email || 'No email'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className={`h-16 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-6 lg:px-10 flex-shrink-0 transition-colors duration-200`}>
          <div className={`flex items-center text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} font-sans`}>
            {activeTab === 'home' && t('dashboard.overview')}
            {activeTab === 'devices' && t('nav.devices')}
            {activeTab === 'herd' && t('nav.herd')}
            {activeTab === 'settings' && t('nav.settings')}
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <Globe className="w-4 h-4" />
              <span>{currentLanguage === 'en' ? 'EN' : 'ខ្មែរ'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                className={`relative p-2 transition-colors rounded-full ${showNotifications ? (isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700') : (isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg border overflow-hidden z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-50'}`}>
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (notif.tab) setActiveTab(notif.tab);
                              setShowNotifications(false);
                            }}
                            className={`p-4 transition-colors cursor-pointer flex gap-3 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notif.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                              notif.type === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {notif.type === 'error' || notif.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{notif.text}</p>
                              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No new notifications
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className={`p-3 border-t text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button 
                        onClick={() => setUnreadCount(0)}
                        className="text-sm text-green-600 dark:text-green-400 font-medium hover:text-green-700 dark:hover:text-green-300"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300' : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'} cursor-pointer`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic View Rendering */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-10 mb-16 md:mb-0">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
            {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
            {activeTab === 'devices' && <Devices scalesData={scalesData} onRemoveDevice={handleRemoveDevice} activeScaleId={activeScaleId} setActiveScaleId={setActiveScaleId} weighingCowId={weighingCowId} setWeighingCowId={setWeighingCowId} />}
            {activeTab === 'herd' && <Herd onNavigateToScale={navigateToScale} />}
            {activeTab === 'settings' && <Settings user={user} onLogout={logout} />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t flex items-center justify-around z-50 transition-colors duration-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'home' ? 'text-green-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">{t('nav.dashboard', 'Home')}</span>
        </button>
        <button onClick={() => setActiveTab('herd')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'herd' ? 'text-green-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="w-5 h-5 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
          <span className="text-[10px] font-medium">{t('nav.herd', 'Herd')}</span>
        </button>
        <button onClick={() => setActiveTab('devices')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'devices' ? 'text-green-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Wifi size={20} />
          <span className="text-[10px] font-medium">{t('nav.devices', 'Devices')}</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'settings' ? 'text-green-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <SettingsIcon size={20} />
          <span className="text-[10px] font-medium">{t('nav.settings', 'Settings')}</span>
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


