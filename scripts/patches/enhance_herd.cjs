const fs = require('fs');
let herd = fs.readFileSync('src/pages/Herd.tsx', 'utf8');

// 1. Add ArrowUpDown and Minus to imports
herd = herd.replace(/import \{ Search, Plus, X/g, "import { Search, Plus, X, ArrowUpDown, Minus");

// 2. Add state for sorting, selection, and pagination
herd = herd.replace(
  /const \[breedFilter, setBreedFilter\] = useState\('All'\);\r?\n\s*const filterRef = useRef<HTMLDivElement>\(null\);/g,
  `const [breedFilter, setBreedFilter] = useState('All');
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [selectedCows, setSelectedCows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction: direction as 'asc' | 'desc' });
  };
  
  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCows.includes(id)) {
      setSelectedCows(selectedCows.filter(cId => cId !== id));
    } else {
      setSelectedCows([...selectedCows, id]);
    }
  };`
);

// We need to inject toggleSelectAll inside the component (maybe after handleSort)
herd = herd.replace(
  /const toggleRow = /g,
  `const toggleSelectAll = () => {
    if (selectedCows.length === paginatedHerd.length && paginatedHerd.length > 0) {
      setSelectedCows([]);
    } else {
      setSelectedCows(paginatedHerd.map(c => c.id));
    }
  };
  
  const toggleRow = `
);

// 3. Sorting logic and Pagination
herd = herd.replace(
  /const filteredHerd = herdData\.filter\(cow => \{[\s\S]*?\}\);/g,
  `let filteredHerd = herdData.filter(cow => {
    const matchesSearch = cow.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t(\`status.\${cow.status}\`).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || cow.gender === genderFilter;
    const matchesBreed = breedFilter === 'All' || cow.breed === breedFilter;
    return matchesSearch && matchesGender && matchesBreed;
  });
  
  if (sortConfig !== null) {
    filteredHerd.sort((a, b) => {
      let aVal = a[sortConfig.key as keyof typeof a];
      let bVal = b[sortConfig.key as keyof typeof b];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  const totalPages = Math.ceil(filteredHerd.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHerd = filteredHerd.slice(startIndex, startIndex + itemsPerPage);`
);

// Update all `filteredHerd.map` to `paginatedHerd.map`
herd = herd.replace(/filteredHerd\.map\(/g, 'paginatedHerd.map(');
herd = herd.replace(/filteredHerd\.length > 0/g, 'paginatedHerd.length > 0');

// 4. Update the Table Headers
herd = herd.replace(
  /<th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">\{t\('herd\.table\.tagId', 'Tag ID'\)\}<\/th>/g,
  `<th className="w-12 py-4 pl-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    <input type="checkbox" onChange={toggleSelectAll} checked={selectedCows.length > 0 && selectedCows.length === paginatedHerd.length} className="rounded border-gray-300 text-[#5f76e8] focus:ring-[#5f76e8] cursor-pointer" />
  </th>
  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none group" onClick={() => handleSort('id')}>
    <div className="flex items-center gap-1">
      {t('herd.table.tagId', 'Tag ID')}
      <ArrowUpDown size={12} className={\`\${sortConfig?.key === 'id' ? 'text-[#5f76e8]' : 'text-gray-300 group-hover:text-gray-400'} transition-colors\`} />
    </div>
  </th>`
);
herd = herd.replace(
  /<th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">\{t\('herd\.table\.weight', 'Weight \(lbs\)'\)\}<\/th>/g,
  `<th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none group" onClick={() => handleSort('weight')}>
    <div className="flex items-center gap-1">
      {t('herd.table.weight', 'Weight (lbs)')}
      <ArrowUpDown size={12} className={\`\${sortConfig?.key === 'weight' ? 'text-[#5f76e8]' : 'text-gray-300 group-hover:text-gray-400'} transition-colors\`} />
    </div>
  </th>`
);
herd = herd.replace(
  /<th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">\{t\('herd\.table\.lastSync', 'Last Sync'\)\}<\/th>/g,
  `<th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none group" onClick={() => handleSort('lastSync')}>
    <div className="flex items-center gap-1">
      {t('herd.table.lastSync', 'Last Sync')}
      <ArrowUpDown size={12} className={\`\${sortConfig?.key === 'lastSync' ? 'text-[#5f76e8]' : 'text-gray-300 group-hover:text-gray-400'} transition-colors\`} />
    </div>
  </th>`
);

// 5. Update Table Row and Checkbox
herd = herd.replace(
  /<tr key=\{cow\.id\} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick=\{\(\) => setSelectedCow\(cow\)\}>/g,
  `<tr key={cow.id} className="even:bg-gray-50/50 hover:bg-[#5f76e8]/5 transition-colors group cursor-pointer" onClick={() => setSelectedCow(cow)}>
     <td className="py-4 pl-6" onClick={(e) => e.stopPropagation()}>
       <input type="checkbox" checked={selectedCows.includes(cow.id)} onChange={(e) => toggleRow(cow.id, e as any)} className="rounded border-gray-300 text-[#5f76e8] focus:ring-[#5f76e8] cursor-pointer" />
     </td>`
);

// 6. Update Trend Arrows to Neutral
herd = herd.replace(
  /\{cow\.trend === 'up' \? \([\s\S]*?<ArrowUpRight size=\{16\} className=\{STATUS_STYLES\[cow\.status\]\?\.text\} \/>[\s\S]*?\) : cow\.trend === 'down' \? \([\s\S]*?<ArrowDownRight size=\{16\} className=\{STATUS_STYLES\[cow\.status\]\?\.text\} \/>[\s\S]*?\) : \([\s\S]*?<CheckCircle2 size=\{16\} className=\{STATUS_STYLES\[cow\.status\]\?\.text\} \/>[\s\S]*?\)\}/g,
  `{cow.trend === 'stable' ? <Minus size={16} className="text-gray-400" /> : cow.trend === 'up' ? <ArrowUpRight size={16} className="text-gray-500" /> : <ArrowDownRight size={16} className="text-gray-500" />}`
);

// 7. Update Actions Column
herd = herd.replace(
  /<td className="py-4 px-6 text-right">[\s\S]*?<button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick=\{\(e\) => \{ e\.stopPropagation\(\); \/\* Menu logic \*\/ \}\}>[\s\S]*?<MoreVertical size=\{18\} \/>[\s\S]*?<\/button>[\s\S]*?<\/td>/g,
  `<td className="py-4 px-6 text-right w-[140px]">
     <div className="flex justify-end items-center gap-2">
       <button className="text-sm font-medium text-[#5f76e8] hover:text-[#5f76e8]/80 bg-[#5f76e8]/10 hover:bg-[#5f76e8]/20 px-3 py-1.5 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedCow(cow); }}>
         View
       </button>
       <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
         <MoreVertical size={18} />
       </button>
     </div>
   </td>`
);
herd = herd.replace(/colSpan=\{5\}/g, "colSpan={6}");

// 8. Add Pagination Footer and Bulk Actions Bar
herd = herd.replace(
  /<\/table>\s*<\/div>\s*<\/div>/g,
  `</table>
   </div>
   <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
     <span className="text-sm text-gray-500">
       Showing {paginatedHerd.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredHerd.length)} of {filteredHerd.length} cows
     </span>
     <div className="flex gap-1">
       <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Prev</button>
       <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
     </div>
   </div>
 </div>

 {/* Bulk Actions */}
 {selectedCows.length > 0 && (
   <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-10">
     <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{selectedCows.length} selected</span>
     <div className="w-px h-6 bg-gray-200"></div>
     <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
       <Download size={16} /> Export
     </button>
     <button className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-2">
       <X size={16} /> Delete
     </button>
   </div>
 )}`
);

fs.writeFileSync('src/pages/Herd.tsx', herd);
