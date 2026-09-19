const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// 1. Add missing imports
if (!code.includes('Eye')) {
  code = code.replace(/import \{ User, /g, "import { Eye, EyeOff, Loader2, User, ");
}

// 2. Add new states inside Settings component
if (!code.includes('isSaving')) {
  code = code.replace(
    /const \[toastMessage, setToastMessage\] = useState<string \| null>\(null\);/g,
    `const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');`
  );
}

// 3. Update handleSave
code = code.replace(
  /const handleSave = \(e: React\.FormEvent\) => \{[\s\S]*?console\.log\("Settings saved:", formData\);\s*\};/,
  `const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      console.log("Settings saved:", formData);
    }, 1000);
  };`
);

// 4. Update the activeTab === 'profile' render section completely
const profileStart = "          {activeTab === 'profile' && (";
const profileEnd = "          {activeTab === 'wifi' && (";

const startIndex = code.indexOf(profileStart);
const endIndex = code.indexOf(profileEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newProfile = `          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t('settings.profile.title', 'Profile Settings')}</h3>
              
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6 pb-6 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-full bg-[#5f76e8]/10 flex items-center justify-center text-[#5f76e8] shrink-0 border border-[#5f76e8]/20">
                    <User size={36} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium mb-1">Profile Photo</h4>
                    <p className="text-sm text-gray-500 mb-3">Upload a new photo for your profile (Max 5MB)</p>
                    <div className="flex space-x-3">
                      <button type="button" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                        Change Photo
                      </button>
                      <button type="button" className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
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
                          className={\`w-full pl-4 pr-10 py-2.5 bg-white border \${formData.profile.password && confirmPassword && formData.profile.password !== confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-[#5f76e8]'} text-gray-900 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-shadow\`}
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

`;

  code = code.substring(0, startIndex) + newProfile + code.substring(endIndex);
  fs.writeFileSync('src/pages/Settings.tsx', code);
  console.log("Settings.tsx patched successfully.");
} else {
  console.error("Could not find boundaries.");
}
