import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { User, Wifi, Save, CheckCircle2, Bell, ChevronDown, HelpCircle, Phone, Mail, Lock, Check, AlertTriangle, LogOut, Eye, EyeOff } from 'lucide-react';
import { FarmerUser, authService } from '../services/authService';

const settingsSchema = z.object({
  profile: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(6, 'Phone number must be at least 6 digits'),
    farmName: z.string().min(2, 'Farm name must be at least 2 characters'),
    password: z.string().optional()
  }),
  wifi: z.object({
    ssid: z.string(),
    password: z.string(),
    securityType: z.string(),
    showPassword: z.boolean()
  }),
  notifications: z.object({
    emailAlerts: z.boolean(),
    smsAlerts: z.boolean(),
    beepSound: z.boolean(),
    warningTrigger: z.boolean()
  })
});

interface SettingsProps {
  user?: FarmerUser | null;
  onLogout?: () => void;
}

export function Settings({ user, onLogout }: SettingsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Real WiFi State
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [wifiError, setWifiError] = useState<string | null>(null);
  const [currentWifi, setCurrentWifi] = useState<any>(null);
  const [availableNetworks, setAvailableNetworks] = useState<any[]>([]);

  const fetchWifiNetworks = async () => {
    setIsScanningWifi(true);
    setWifiError(null);
    try {
      // Hardware endpoints for ESP32/Raspberry Pi
      const res = await fetch('/api/wifi/scan');
      if (!res.ok) throw new Error('Failed to fetch networks');
      const data = await res.json();
      
      setCurrentWifi(data.currentConnection || null);
      setAvailableNetworks(data.networks || []);
    } catch (err) {
      console.error("WiFi scan failed:", err);
      setWifiError("Could not detect hardware networks. Ensure you are connected to the device.");
    } finally {
      setIsScanningWifi(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wifi') {
      fetchWifiNetworks();
    }
  }, [activeTab]);
  
  const [isSecurityDropdownOpen, setIsSecurityDropdownOpen] = useState(false);
  const securityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (securityDropdownRef.current && !securityDropdownRef.current.contains(event.target as Node)) {
        setIsSecurityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    profile: {
      fullName: user?.name || 'Sal The Butcher',
      phone: user?.phone || '012345678',
      farmName: 'AgroScale Dairy Pasture',
      password: ''
    },
    wifi: {
      ssid: '',
      password: '',
      securityType: 'WPA2',
      showPassword: false
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      beepSound: true,
      warningTrigger: true
    }
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          fullName: user.name,
          phone: user.phone
        }
      }));
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password updated successfully in database!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      settingsSchema.parse(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      console.log("Settings saved:", formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setToastMessage(err.errors[0].message);
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = (field: keyof typeof formData.notifications, value: boolean, label: string) => {
    updateNestedState('notifications', field, value);
    showToast(`${label} turned ${value ? 'on' : 'off'}`);
  };

  const updateNestedState = (section: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="h-full flex flex-col relative transition-colors">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title', 'Settings')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings.subtitle', 'Manage your account and configure your devices.')}</p>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 size={18} className="text-green-400 dark:text-green-600" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User size={20} className={activeTab === 'profile' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
              <span>{t('settings.profile.tab', 'Profile Information')}</span>
            </button>
            <button
              onClick={() => setActiveTab('wifi')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'wifi'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Wifi size={20} className={activeTab === 'wifi' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
              <span>{t('settings.wifi.tab', 'WiFi Configuration')}</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bell size={20} className={activeTab === 'notifications' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
              <span>{t('settings.notifications.tab', 'Notifications')}</span>
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'help'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle size={20} className={activeTab === 'help' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
              <span>{t('settings.help.tab', 'Help & Support')}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer mt-4"
              >
                <LogOut size={20} className="text-rose-500" />
                <span>Log Out</span>
              </button>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-4xl h-fit bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 transition-colors">
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center space-x-2 border border-green-100 dark:border-green-900/50">
              <CheckCircle2 size={20} className="text-green-500 dark:text-green-400" />
              <span className="font-medium">{t('settings.successMsg', 'Settings saved successfully.')}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('settings.profile.title', 'Profile Settings')}</h3>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.profile.fullName', 'Full Name')}</label>
                    <input 
                      type="text" 
                      value={formData.profile.fullName}
                      onChange={(e) => updateNestedState('profile', 'fullName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.profile.phone}
                      onChange={(e) => updateNestedState('profile', 'phone', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.profile.farmName', 'Farm Name')}</label>
                    <input 
                      type="text" 
                      value={formData.profile.farmName}
                      onChange={(e) => updateNestedState('profile', 'farmName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <button type="submit" className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    <Save size={18} />
                    <span>{t('settings.save', 'Save Profile')}</span>
                  </button>
                </div>
              </form>

              {/* Strict Security & Password Change Section */}
              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Security & Password</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  You must verify your current password before saving a new password to your account database.
                </p>

                {passwordError && (
                  <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm flex items-start gap-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-4 p-3.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-sm flex items-start gap-2">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      New Password (Min 6 characters) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter new password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Lock size={16} />
                    <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('settings.wifi.title', 'Network Settings')}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{t('settings.wifi.description', 'Manage your active WiFi connection and available networks.')}</p>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                  <Wifi size={24} />
                </div>
              </div>
              
              <div className="space-y-6 max-w-lg mt-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                  
                  {isScanningWifi ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="animate-pulse mb-4">
                        <Wifi size={32} className="text-green-500 opacity-50" />
                      </div>
                      <p>Scanning for nearby networks...</p>
                    </div>
                  ) : wifiError ? (
                    <div className="p-6 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/50 text-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                      <h4 className="text-red-800 dark:text-red-400 font-bold mb-1">Hardware Connection Error</h4>
                      <p className="text-sm text-red-600 dark:text-red-300">{wifiError}</p>
                      <button onClick={fetchWifiNetworks} className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                        Retry Scan
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Current Connection */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-green-50/50 dark:bg-green-900/10">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Current Connection</p>
                        {currentWifi ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                <Wifi size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{currentWifi.ssid || 'Connected Network'}</h4>
                                <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-0.5">
                                  <Check size={14} className="mr-1" />
                                  Connected{currentWifi.secured ? ', secured' : ''}
                                </p>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
                            No active connection.
                          </div>
                        )}
                      </div>

                      {/* Available Networks */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available Networks</p>
                          <button onClick={fetchWifiNetworks} className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline">Refresh</button>
                        </div>
                        <div className="space-y-1">
                          {availableNetworks.length > 0 ? (
                            availableNetworks.map((net, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors group">
                                <div className="flex items-center space-x-3">
                                  <div className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                    <Wifi size={20} className={net.signalStrength < -70 ? 'opacity-50' : net.signalStrength < -50 ? 'opacity-80' : ''} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200">{net.ssid}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{net.secured ? 'Secured' : 'Open'}</p>
                                  </div>
                                </div>
                                {net.secured && <Lock size={14} className="text-gray-400" />}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                              No networks found.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-2">
                  <p>Auto-connect is enabled for known networks.</p>
                  <button className="text-green-600 dark:text-green-400 font-medium hover:underline">Network Settings</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('settings.notifications.title', 'Notification Preferences')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('settings.notifications.description', 'Choose how you want to be notified about your herd.')}</p>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{t('settings.notifications.email', 'Email Alerts')}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.emailDesc', 'Receive daily summaries and critical alerts via email.')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.notifications.emailAlerts} onChange={(e) => handleToggle('emailAlerts', e.target.checked, 'Email Alerts')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{t('settings.notifications.sms', 'SMS Alerts')}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.smsDesc', 'Get text messages for critical herd health warnings.')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.notifications.smsAlerts} onChange={(e) => handleToggle('smsAlerts', e.target.checked, 'SMS Alerts')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.notifications.rulesTitle', 'Rules & Sound')}</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{t('settings.notifications.beep', 'Capture beep feedback sound')}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.beepDesc', 'Plays confirmation chime on client browser as soon as stable loads are locked.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.notifications.beepSound} onChange={(e) => handleToggle('beepSound', e.target.checked, 'Beep feedback sound')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{t('settings.notifications.warning', 'Warning notifications trigger')}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notifications.warningDesc', 'Push notification banner visual indicators immediately on drastic weight drops.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.notifications.warningTrigger} onChange={(e) => handleToggle('warningTrigger', e.target.checked, 'Warning notifications')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <button type="submit" className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    <Save size={18} />
                    <span>{t('settings.save', 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
          {activeTab === 'help' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('settings.help.title', 'Help & Support')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">{t('settings.help.subtitle', 'Get help with your hardware or software.')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/50 flex flex-col items-center text-center transition-colors">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Call Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Available Mon-Fri, 9am - 5pm EST</p>
                  <a href="tel:+1-800-COW-FIT1" className="text-green-600 dark:text-green-400 font-bold hover:underline">1-800-COW-FIT1</a>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Email Us</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">We usually respond within 24 hours.</p>
                  <a href="mailto:support@cowfit.io" className="text-green-600 dark:text-green-400 font-bold hover:underline">support@cowfit.io</a>
                </div>
              </div>
              
              <div className="border-t border-gray-100 dark:border-gray-700 pt-8">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">How do I reconnect a scale?</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Go to the WiFi Configuration tab, generate a new config file, and place it on a USB drive plugged into your scale.</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">Why is my cow marked as critical?</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">A cow is marked critical if its weight drops more than 5% in a single week. Check the Herd tab for historical data.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
