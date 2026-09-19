import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, User, UserCircle, Wifi, Signal, Save, CheckCircle2, Bell, BellRing, ChevronDown, HelpCircle, LifeBuoy, Phone, Mail, Lock, Check, AlertTriangle } from 'lucide-react';

export function Settings() {
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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
      fullName: 'Sal The Butcher',
      email: 'sal@camtech.edu',
      farmName: 'Camtech experimental Farm',
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      console.log("Settings saved:", formData);
    }, 1000);
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
        <h2 className="text-2xl font-bold text-gray-900 ">{t('settings.title', 'Settings')}</h2>
        <p className="text-gray-500  mt-1">{t('settings.subtitle', 'Manage your account and configure your devices.')}</p>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900  text-white  px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 size={18} className="text-[#5f76e8] " />
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
                  ? 'bg-[#5f76e8]/10  text-[#5f76e8] '
                  : 'text-gray-600  hover:bg-gray-50  hover:text-gray-900 '
              }`}
            >
              <UserCircle size={20} className={activeTab === 'profile' ? 'text-[#5f76e8]' : 'text-gray-400'} />
              <span>{t('settings.profile.tab', 'Profile Information')}</span>
            </button>
            <button
              onClick={() => setActiveTab('wifi')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'wifi'
                  ? 'bg-[#5f76e8]/10 text-[#5f76e8]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Signal size={20} className={activeTab === 'wifi' ? 'text-[#5f76e8]' : 'text-gray-400'} />
              <span>{t('settings.wifi.tab', 'WiFi Configuration')}</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-[#5f76e8]/10 text-[#5f76e8]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BellRing size={20} className={activeTab === 'notifications' ? 'text-[#5f76e8]' : 'text-gray-400'} />
              <span>{t('settings.notifications.tab', 'Notifications')}</span>
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'help'
                  ? 'bg-[#5f76e8]/10 text-[#5f76e8]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LifeBuoy size={20} className={activeTab === 'help' ? 'text-[#5f76e8]' : 'text-gray-400'} />
              <span>{t('settings.help.tab', 'Help & Support')}</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-4xl h-fit bg-white rounded-xl border-0 p-6 md:p-8 transition-colors" style={{ boxShadow: "0 3px 9px 0 rgba(169, 184, 200, .15)" }}>
          {showSuccess && (
            <div className="mb-6 bg-[#5f76e8]/10  text-[#5f76e8]  p-4 rounded-xl flex items-center space-x-2 border border-[#5f76e8]/20 ">
              <CheckCircle2 size={20} className="text-[#5f76e8] " />
              <span className="font-medium">{t('settings.successMsg', 'Settings saved successfully.')}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t('settings.profile.title', 'Profile Settings')}</h3>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6 pb-6 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-[#5f76e8]/10 text-[#5f76e8] shrink-0 border border-gray-100 shadow-sm relative group">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <span className="text-white text-xs font-medium">Edit</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium mb-1">Profile Photo</h4>
                    <p className="text-sm text-gray-500 mb-3">Upload a new photo for your profile (Max 5MB)</p>
                    <div className="flex space-x-3">
                      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                        Change Photo
                      </button>
                      <button type="button" onClick={() => setProfilePhoto(null)} disabled={!profilePhoto} className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.profile.fullName', 'Full Name')}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.profile.fullName}
                      onChange={(e) => updateNestedState('profile', 'fullName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#5f76e8] focus:border-transparent outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.profile.email', 'Email Address')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="email" 
                        readOnly
                        value={formData.profile.email}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl outline-none cursor-not-allowed"
                      />
                      <button type="button" className="px-3 py-2 text-sm font-medium text-[#5f76e8] hover:text-[#5f76e8]/80 whitespace-nowrap">
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.profile.farmName', 'Farm Name')}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.profile.farmName}
                    onChange={(e) => updateNestedState('profile', 'farmName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#5f76e8] focus:border-transparent outline-none transition-shadow"
                  />
                </div>

                {/* Security Section */}
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{t('settings.profile.security', 'Security & Authentication')}</h4>
                  <p className="text-sm text-gray-500 mb-6">Manage your password and security preferences.</p>
                  
                  <div className="space-y-4 max-w-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#5f76e8] focus:border-transparent outline-none transition-shadow"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={formData.profile.password}
                          onChange={(e) => updateNestedState('profile', 'password', e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#5f76e8] focus:border-transparent outline-none transition-shadow"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-4 pr-10 py-2.5 bg-white border ${formData.profile.password && confirmPassword && formData.profile.password !== confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-[#5f76e8]'} text-gray-900 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-shadow`}
                        />
                      </div>
                      {formData.profile.password && confirmPassword && formData.profile.password !== confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">Passwords don't match</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-start items-center gap-3">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex items-center justify-center min-w-[150px] space-x-2 bg-[#5f76e8] hover:bg-[#5f76e8]/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{isSaving ? 'Saving...' : t('settings.save', 'Save Changes')}</span>
                  </button>
                  {showSuccess && (
                    <p className="text-sm text-green-600 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 size={16} /> Profile updated successfully
                    </p>
                  )}
                </div>
              </form>

              {/* Danger Zone Section */}
              <div className="mt-12 border border-red-200 bg-red-50 rounded-xl p-6 max-w-2xl">
                <h3 className="text-red-700 font-bold text-lg">Danger Zone</h3>
                <p className="text-sm text-red-600 mt-1">
                  Deleting your account is permanent and cannot be undone. All your farm data, devices, and history will be erased.
                </p>
                <div className="mt-4 flex gap-3">
                  <button className="border border-red-300 text-red-700 bg-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-50 transition-colors shadow-sm">
                    Export My Data
                  </button>
                  <button className="border border-red-600 text-white bg-red-600 px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900  mb-2">{t('settings.wifi.title', 'Network Settings')}</h3>
                  <p className="text-gray-500 ">{t('settings.wifi.description', 'Manage your active WiFi connection and available networks.')}</p>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-[#5f76e8]/20  items-center justify-center text-[#5f76e8]  shrink-0">
                  <Wifi size={24} />
                </div>
              </div>
              
              <div className="space-y-6 max-w-lg mt-6">
                <div className="bg-gray-50  rounded-2xl border border-gray-100  overflow-hidden transition-colors">
                  
                  {isScanningWifi ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-500 ">
                      <div className="animate-pulse mb-4">
                        <Wifi size={32} className="text-[#5f76e8] opacity-50" />
                      </div>
                      <p>Scanning for nearby networks...</p>
                    </div>
                  ) : wifiError ? (
                    <div className="p-6 bg-red-50  border-b border-red-100  text-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                      <h4 className="text-red-800  font-bold mb-1">Hardware Connection Error</h4>
                      <p className="text-sm text-red-600 ">{wifiError}</p>
                      <button onClick={fetchWifiNetworks} className="mt-4 px-4 py-2 bg-red-100  text-red-700  rounded-lg text-sm font-medium hover:bg-red-200  transition-colors">
                        Retry Scan
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Current Connection */}
                      <div className="p-4 border-b border-gray-200  bg-[#5f76e8]/10/50 ">
                        <p className="text-xs font-semibold text-gray-500  uppercase tracking-wider mb-3">Current Connection</p>
                        {currentWifi ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-[#5f76e8]/20  rounded-full text-[#5f76e8] ">
                                <Wifi size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 ">{currentWifi.ssid || 'Connected Network'}</h4>
                                <p className="text-sm text-[#5f76e8]  flex items-center mt-0.5">
                                  <Check size={14} className="mr-1" />
                                  Connected{currentWifi.secured ? ', secured' : ''}
                                </p>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-white  border border-gray-300  text-gray-700  rounded-lg text-sm font-medium hover:bg-gray-50  transition-colors shadow-sm">
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-500  text-sm py-2">
                            No active connection.
                          </div>
                        )}
                      </div>

                      {/* Available Networks */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-500  uppercase tracking-wider">Available Networks</p>
                          <button onClick={fetchWifiNetworks} className="text-xs font-medium text-[#5f76e8]  hover:underline">Refresh</button>
                        </div>
                        <div className="space-y-1">
                          {availableNetworks.length > 0 ? (
                            availableNetworks.map((net, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 hover:bg-white  rounded-xl cursor-pointer transition-colors group">
                                <div className="flex items-center space-x-3">
                                  <div className="text-gray-400  group-hover:text-gray-600  transition-colors">
                                    <Wifi size={20} className={net.signalStrength < -70 ? 'opacity-50' : net.signalStrength < -50 ? 'opacity-80' : ''} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-800 ">{net.ssid}</h4>
                                    <p className="text-xs text-gray-500  mt-0.5">{net.secured ? 'Secured' : 'Open'}</p>
                                  </div>
                                </div>
                                {net.secured && <Lock size={14} className="text-gray-400" />}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-sm text-gray-500 ">
                              No networks found.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500  px-2">
                  <p>Auto-connect is enabled for known networks.</p>
                  <button className="text-[#5f76e8]  font-medium hover:underline">Network Settings</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900  mb-2">{t('settings.notifications.title', 'Notification Preferences')}</h3>
              <p className="text-gray-500  mb-6">{t('settings.notifications.description', 'Choose how you want to be notified about your herd.')}</p>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50  rounded-xl border border-gray-100  transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 ">{t('settings.notifications.email', 'Email Alerts')}</h4>
                      <p className="text-sm text-gray-500 ">{t('settings.notifications.emailDesc', 'Receive daily summaries and critical alerts via email.')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.notifications.emailAlerts} onChange={(e) => handleToggle('emailAlerts', e.target.checked, 'Email Alerts')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200  peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5f76e8]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50  rounded-xl border border-gray-100  transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 ">{t('settings.notifications.sms', 'SMS Alerts')}</h4>
                      <p className="text-sm text-gray-500 ">{t('settings.notifications.smsDesc', 'Get text messages for critical herd health warnings.')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.notifications.smsAlerts} onChange={(e) => handleToggle('smsAlerts', e.target.checked, 'SMS Alerts')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200  peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5f76e8]"></div>
                    </label>
                  </div>

                  <div className="pt-6 border-t border-gray-100 ">
                    <h4 className="text-lg font-semibold text-gray-900  mb-4">{t('settings.notifications.rulesTitle', 'Rules & Sound')}</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50  rounded-xl border border-gray-100  transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900 ">{t('settings.notifications.beep', 'Capture beep feedback sound')}</h4>
                          <p className="text-sm text-gray-500 ">{t('settings.notifications.beepDesc', 'Plays confirmation chime on client browser as soon as stable loads are locked.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.notifications.beepSound} onChange={(e) => handleToggle('beepSound', e.target.checked, 'Beep feedback sound')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200  peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5f76e8]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50  rounded-xl border border-gray-100  transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900 ">{t('settings.notifications.warning', 'Warning notifications trigger')}</h4>
                          <p className="text-sm text-gray-500 ">{t('settings.notifications.warningDesc', 'Push notification banner visual indicators immediately on drastic weight drops.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.notifications.warningTrigger} onChange={(e) => handleToggle('warningTrigger', e.target.checked, 'Warning notifications')} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200  peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5f76e8]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <button type="submit" className="flex items-center space-x-2 bg-[#5f76e8] hover:bg-[#5f76e8]/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    <Save size={18} />
                    <span>{t('settings.save', 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
          {activeTab === 'help' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900  mb-2">{t('settings.help.title', 'Help & Support')}</h3>
              <p className="text-gray-500  mb-8">{t('settings.help.subtitle', 'Get help with your hardware or software.')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#5f76e8]/10  p-6 rounded-2xl border border-[#5f76e8]/20  flex flex-col items-center text-center transition-colors">
                  <div className="w-12 h-12 bg-[#5f76e8]/20  rounded-full flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-[#5f76e8] " />
                  </div>
                  <h4 className="font-bold text-gray-900  mb-2">Call Support</h4>
                  <p className="text-sm text-gray-600  mb-4">Available Mon-Fri, 9am - 5pm EST</p>
                  <a href="tel:+1-800-COW-FIT1" className="text-[#5f76e8]  font-bold hover:underline">1-800-COW-FIT1</a>
                </div>
                
                <div className="bg-gray-50  p-6 rounded-2xl border border-gray-100  flex flex-col items-center text-center transition-colors">
                  <div className="w-12 h-12 bg-gray-200  rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-gray-600 " />
                  </div>
                  <h4 className="font-bold text-gray-900  mb-2">Email Us</h4>
                  <p className="text-sm text-gray-600  mb-4">We usually respond within 24 hours.</p>
                  <a href="mailto:support@cowfit.io" className="text-[#5f76e8]  font-bold hover:underline">support@cowfit.io</a>
                </div>
              </div>
              
              <div className="border-t border-gray-100  pt-8">
                <h4 className="text-lg font-bold text-gray-900  mb-4">Frequently Asked Questions</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50  p-4 rounded-xl border border-gray-100  transition-colors">
                    <h5 className="font-medium text-gray-900  mb-1">How do I reconnect a scale?</h5>
                    <p className="text-sm text-gray-500 ">Go to the WiFi Configuration tab, generate a new config file, and place it on a USB drive plugged into your scale.</p>
                  </div>
                  <div className="bg-gray-50  p-4 rounded-xl border border-gray-100  transition-colors">
                    <h5 className="font-medium text-gray-900  mb-1">Why is my cow marked as critical?</h5>
                    <p className="text-sm text-gray-500 ">A cow is marked critical if its weight drops more than 5% in a single week. Check the Herd tab for historical data.</p>
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
