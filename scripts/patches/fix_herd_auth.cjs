const fs = require('fs');

// 1. Fix Herd.tsx
let herdCode = fs.readFileSync('src/pages/Herd.tsx', 'utf8');

// Add activeDropdown state
const herdStateMarker = "const [searchQuery, setSearchQuery] = useState('');";
if (herdCode.includes(herdStateMarker) && !herdCode.includes("activeDropdown")) {
  herdCode = herdCode.replace(herdStateMarker, `const [searchQuery, setSearchQuery] = useState('');\n  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);`);
}

// Close dropdown on click outside (optional, but good UX)
// We'll just rely on the button toggle for now since it's simple.

// Update the MoreVertical button to be wrapped in relative div and include the dropdown
const moreVerticalRegex = /<button className="p-1\.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*\}\}>\s*<MoreVertical size=\{18\}\s*\/>\s*<\/button>/;

const newMoreVertical = `<div className="relative">
         <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" 
onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === cow.id ? null : cow.id); }}>
           <MoreVertical size={18} />
         </button>
         {activeDropdown === cow.id && (
           <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
             <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={() => { setActiveDropdown(null); }}>
               <Edit2 size={14} className="text-gray-400" /> Edit Details
             </button>
             <div className="h-px bg-gray-100 my-1"></div>
             <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors" onClick={() => { setHerd(herd.filter(c => c.id !== cow.id)); setActiveDropdown(null); }}>
               <Trash2 size={14} className="text-red-500" /> Delete Cow
             </button>
           </div>
         )}
       </div>`;

if (herdCode.includes("MoreVertical size={18}")) {
  herdCode = herdCode.replace(moreVerticalRegex, newMoreVertical);
}

// Add Edit2 and Trash2 imports if needed
if (!herdCode.includes("Edit2")) {
  herdCode = herdCode.replace(/MoreVertical,\s*Calendar/, "MoreVertical, Calendar, Edit2, Trash2");
}

fs.writeFileSync('src/pages/Herd.tsx', herdCode);
console.log("Herd.tsx patched.");


// 2. Fix Login.tsx
let loginCode = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Update interface
loginCode = loginCode.replace(/onLogin:\s*\(\)\s*=>\s*void;/, "onLogin: (remember: boolean) => void;");

// Add rememberMe state
const loginStateMarker = "const [error, setError] = useState('');";
if (loginCode.includes(loginStateMarker) && !loginCode.includes("rememberMe")) {
  loginCode = loginCode.replace(loginStateMarker, `const [error, setError] = useState('');\n  const [rememberMe, setRememberMe] = useState(false);`);
}

// Update checkbox
loginCode = loginCode.replace(
  /<input id="remember" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-\[#5f76e8\] focus:ring-\[#5f76e8\] cursor-pointer" \/>/g,
  `<input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#5f76e8] focus:ring-[#5f76e8] cursor-pointer" />`
);

// Update onLogin call
loginCode = loginCode.replace(/onLogin\(\);/g, "onLogin(rememberMe);");

fs.writeFileSync('src/pages/Login.tsx', loginCode);
console.log("Login.tsx patched.");


// 3. Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Update isAuthenticated initial state
appCode = appCode.replace(/const \[isAuthenticated, setIsAuthenticated\] = useState\(false\);/, `const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true' || sessionStorage.getItem('isAuthenticated') === 'true';
  });`);

// We need a wrapper for handleLogin and handleLogout
// Replace `setIsAuthenticated(true)` with `handleLogin(true)` where appropriate, but wait, Register doesn't have rememberMe yet. Let's just make it a function in App.tsx.
const appFuncMarker = "const [isAuthenticated, setIsAuthenticated]";
if (appCode.includes("useState(() =>")) {
  const loginLogoutCode = `
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
`;
  appCode = appCode.replace(/const \[authView, setAuthView\]/, loginLogoutCode + "\n    const [authView, setAuthView]");
}

// Replace login usages
appCode = appCode.replace(/onLogin=\{.*?setIsAuthenticated\(true\).*?\}/, `onLogin={(remember) => handleLogin(remember)}`);
appCode = appCode.replace(/onRegister=\{.*?setIsAuthenticated\(true\).*?\}/, `onRegister={() => handleLogin(false)}`);

// Replace sign out button
appCode = appCode.replace(/onClick=\{.*?setIsAuthenticated\(false\).*?\} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Sign Out/, `onClick={handleLogout} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Sign Out`);

fs.writeFileSync('src/App.tsx', appCode);
console.log("App.tsx patched.");
