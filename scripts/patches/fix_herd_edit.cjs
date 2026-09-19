const fs = require('fs');

let herdCode = fs.readFileSync('src/pages/Herd.tsx', 'utf8');

// 1. Add activeDropdown and editingCow state
const stateMarker = "const [searchQuery, setSearchQuery] = useState('');";
if (herdCode.includes(stateMarker) && !herdCode.includes("editingCow")) {
  herdCode = herdCode.replace(stateMarker, `const [searchQuery, setSearchQuery] = useState('');\n  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);\n  const [editingCow, setEditingCow] = useState<any>(null);`);
}

// 2. Update MoreVertical button and dropdown
const moreVerticalRegex = /<button className="p-1\.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*\}\}>\s*<MoreVertical size=\{18\}\s*\/>\s*<\/button>/;

const newMoreVertical = `<div className="relative">
         <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" 
onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === cow.id ? null : cow.id); }}>
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
       </div>`;

if (herdCode.includes("MoreVertical size={18}")) {
  herdCode = herdCode.replace(moreVerticalRegex, newMoreVertical);
}

// 3. Fix imports
if (!herdCode.includes("Edit2")) {
  herdCode = herdCode.replace(/MoreVertical,\s*Calendar/, "MoreVertical, Calendar, Edit2, Trash2");
}

// 4. Update the Add Cow Modal to handle Edit
const modalTitleRegex = /<h3 className="text-xl font-bold text-gray-900">Add New Cow<\/h3>/;
if (herdCode.includes("Add New Cow")) {
  herdCode = herdCode.replace(modalTitleRegex, `<h3 className="text-xl font-bold text-gray-900">{editingCow ? 'Edit Cow Details' : 'Add New Cow'}</h3>`);
}

const modalSubtitleRegex = /<p className="text-sm text-gray-500 mt-1">Enter the details for the new livestock<\/p>/;
if (herdCode.includes("Enter the details for the new livestock")) {
  herdCode = herdCode.replace(modalSubtitleRegex, `<p className="text-sm text-gray-500 mt-1">{editingCow ? 'Update the details for this livestock' : 'Enter the details for the new livestock'}</p>`);
}

// Update the onSubmit logic to handle editing
const submitLogicRegex = /const payload = \{\s*cowId: formData\.get\('tagId'\) as string,[\s\S]*?body: JSON\.stringify\(payload\)\s*\n\s*\}\);\s*const initialWeight = formData\.get\('weight'\);/;
const submitReplacement = `const payload = {
              cowId: formData.get('tagId') as string,
              name: formData.get('tagId') as string,
              breed: formData.get('breed') as string,
              gender: formData.get('gender') as string,
              birthDate: birthDate.toISOString()
            };
            
            if (editingCow) {
              setHerdData(herdData.map(c => 
                c.id === editingCow.id 
                  ? { ...c, weight: Number(formData.get('weight')), breed: payload.breed, gender: payload.gender } 
                  : c
              ));
              setShowAddCowModal(false);
              setEditingCow(null);
              setIsSubmitting(false);
              return;
            }

            try {
              await fetch('/api/cows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const initialWeight = formData.get('weight');`;
if (herdCode.includes("const payload = {")) {
  herdCode = herdCode.replace(submitLogicRegex, submitReplacement);
}

// Add defaultValue to inputs
herdCode = herdCode.replace(/<input\s*type="text"\s*name="tagId"\s*required/g, `<input type="text" name="tagId" required defaultValue={editingCow?.id} readOnly={!!editingCow}`);
herdCode = herdCode.replace(/<input\s*type="number"\s*name="weight"\s*required/g, `<input type="number" name="weight" required defaultValue={editingCow?.weight}`);
herdCode = herdCode.replace(/<input\s*type="number"\s*name="age"\s*required/g, `<input type="number" name="age" required defaultValue={editingCow ? parseInt(editingCow.age) : undefined}`);
herdCode = herdCode.replace(/<select\s*name="gender"\s*required/g, `<select name="gender" required defaultValue={editingCow?.gender}`);
herdCode = herdCode.replace(/<select\s*name="breed"\s*required/g, `<select name="breed" required defaultValue={editingCow?.breed}`);

// Hook close modal to clear editingCow
herdCode = herdCode.replace(/onClick=\{\(\) => setShowAddCowModal\(false\)\}/g, `onClick={() => { setShowAddCowModal(false); setEditingCow(null); }}`);

fs.writeFileSync('src/pages/Herd.tsx', herdCode);
console.log("Herd.tsx editing completely implemented.");
