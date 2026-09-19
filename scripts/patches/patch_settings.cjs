const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// 1. Add state for profilePhoto and fileInputRef near other states
const stateMarker = "const [activeTab, setActiveTab] = useState('profile');";
const stateInsertion = `
  const [activeTab, setActiveTab] = useState('profile');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
`;
code = code.replace(stateMarker, stateInsertion);

// 2. Add useRef import if not present
if (!code.includes("useRef")) {
  code = code.replace("useState", "useState, useRef");
}

// 3. Replace the Profile Photo block
const photoBlockRegex = /<div className="flex items-center space-x-6">[\s\S]*?<div className="w-24 h-24 bg-[#5f76e8]\/10 text-[#5f76e8] rounded-full flex items-center justify-center">[\s\S]*?<\/div>[\s\S]*?<div>[\s\S]*?<h4 className="text-gray-900 font-medium mb-1">Profile Photo<\/h4>[\s\S]*?<p className="text-sm text-gray-500 mb-3">Upload a new photo for your profile \(Max 5MB\)<\/p>[\s\S]*?<div className="flex space-x-3">[\s\S]*?<button type="button" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">[\s\S]*?Change Photo[\s\S]*?<\/button>[\s\S]*?<button type="button" className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">[\s\S]*?Remove[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newPhotoBlock = `<div className="flex items-center space-x-6">
  <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden bg-[#5f76e8]/10 text-[#5f76e8] shrink-0 border border-gray-100 shadow-sm relative group">
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
</div>`;

code = code.replace(photoBlockRegex, newPhotoBlock);

fs.writeFileSync('src/pages/Settings.tsx', code);
console.log("Settings.tsx profile photo logic added.");
