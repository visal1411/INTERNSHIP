const fs = require('fs');
let code = fs.readFileSync('src/pages/Herd.tsx', 'utf8');

// 1. Add Loader2 to imports
if (!code.includes('Loader2')) {
  code = code.replace(/import \{ Search, Plus, X, ArrowUpDown, Minus/, "import { Search, Plus, X, ArrowUpDown, Minus, Loader2");
}

// 2. Add isSubmitting state
if (!code.includes('isSubmitting')) {
  code = code.replace(
    /const \[showAddCowModal, setShowAddCowModal\] = useState\(false\);/,
    "const [showAddCowModal, setShowAddCowModal] = useState(false);\n  const [isSubmitting, setIsSubmitting] = useState(false);"
  );
}

// 3. Extract the Add Cow Modal part and rewrite it
const startMarker = "{/* Add Cow Modal */}";
const startIndex = code.indexOf(startMarker);

if (startIndex !== -1) {
  const newModal = `{/* Add Cow Modal */}
  {showAddCowModal && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Cow</h3>
            <p className="text-sm text-gray-500 mt-1">Enter the details for the new livestock</p>
          </div>
          <button onClick={() => setShowAddCowModal(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>
        
        <form className="p-6 space-y-4 overflow-y-auto custom-scrollbar" onSubmit={async (e) => { 
          e.preventDefault(); 
          if (isSubmitting) return;
          setIsSubmitting(true);
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

          try {
            await fetch('/api/cows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const initialWeight = formData.get('weight');
            if (initialWeight) {
              await fetch(\`/api/cows/\${payload.cowId}/weights\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weight: Number(initialWeight), deviceId: 'MANUAL' })
              });
            }
            await fetchCows();
            setShowAddCowModal(false); 
          } catch (err) {
            console.error('Error adding cow:', err);
          } finally {
            setIsSubmitting(false);
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag ID <span className="text-red-500">*</span>
              </label>
              <input name="tagId" required type="text" placeholder="e.g. TAG-1234" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] bg-white text-gray-900 text-sm outline-none transition-colors" disabled={isSubmitting} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breed <span className="text-red-500">*</span>
              </label>
              <select name="breed" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] bg-white text-gray-900 text-sm outline-none transition-colors" disabled={isSubmitting}>
                <option value="Angus">Angus</option>
                <option value="Hereford">Hereford</option>
                <option value="Brahman">Brahman</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input name="age" required type="number" min="1" placeholder="e.g. 2" className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] bg-white text-gray-900 text-sm outline-none transition-colors" disabled={isSubmitting} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">yrs</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select name="gender" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] bg-white text-gray-900 text-sm outline-none transition-colors" disabled={isSubmitting}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Weight (Optional)</label>
              <div className="relative">
                <input name="weight" type="number" min="1" placeholder="e.g. 1000" className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f76e8] focus:border-[#5f76e8] bg-white text-gray-900 text-sm outline-none transition-colors" disabled={isSubmitting} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">lbs</span>
              </div>
            </div>
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-8 shrink-0">
            <button type="button" onClick={() => setShowAddCowModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-[#5f76e8] text-white rounded-lg hover:bg-[#5f76e8]/90 font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Add Cow'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>
  );
}
`;
  
  code = code.substring(0, startIndex) + newModal;
  fs.writeFileSync('src/pages/Herd.tsx', code);
  console.log("Modal updated successfully.");
} else {
  console.error("Could not find start marker for the modal.");
}
