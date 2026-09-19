const fs = require('fs');

let herd = fs.readFileSync('src/pages/Herd.tsx', 'utf8');

// 1. Imports
if (!herd.includes('STATUS_STYLES')) {
  herd = herd.replace(
    /import \{ Search, Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2, MoreVertical, Calendar, Heart, FileText, Filter, Download \} from 'lucide-react';/,
    "import { Search, Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2, MoreVertical, Calendar, Heart, FileText, Filter, Download, Activity, CircleDot, AlertTriangle } from 'lucide-react';\nimport { STATUS_STYLES } from '../config/statusConfig';"
  );
}

// 2. Remove dark mode classes globally
herd = herd.replace(/dark:[^\s"']+/g, '');

// 3. Remove excess spaces
herd = herd.replace(/ +/g, ' ');

// 4. Update Header button (Add Cow)
herd = herd.replace(/bg-green-600/g, 'bg-[#5f76e8]');
herd = herd.replace(/hover:bg-green-700/g, 'hover:bg-[#5f76e8]/90');

// 5. Update Toolbar Filter button and other green references
herd = herd.replace(/bg-green-100/g, 'bg-[#5f76e8]/10');
herd = herd.replace(/text-green-700/g, 'text-[#5f76e8]');
herd = herd.replace(/bg-green-500/g, 'bg-[#5f76e8]'); // filter dot
herd = herd.replace(/focus:ring-green-500/g, 'focus:ring-[#5f76e8]');
herd = herd.replace(/focus:border-green-500/g, 'focus:border-[#5f76e8]');
herd = herd.replace(/hover:bg-green-50/g, 'hover:bg-[#5f76e8]/5');
herd = herd.replace(/hover:border-green-100/g, 'hover:border-[#5f76e8]/20');
herd = herd.replace(/group-hover:text-green-700/g, 'group-hover:text-[#5f76e8]');
herd = herd.replace(/group-hover:text-green-600/g, 'group-hover:text-[#5f76e8]');
herd = herd.replace(/text-green-600/g, 'text-[#5f76e8]'); // some text

// 6. Update Shadows correctly this time!
// Toolbar shadow
herd = herd.replace(
  /className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors"/g, 
  'className="bg-white p-4 rounded-lg border-none mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}'
);
// Table container shadow
herd = herd.replace(
  /className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-\[400px\] transition-colors"/g, 
  'className="bg-white rounded-lg border-none overflow-hidden flex-1 flex flex-col min-h-[400px] transition-colors" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}'
);

// 7. Update Table Icons
herd = herd.replace(
  /<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 ">\s*<div className="w-4 h-4 bg-current" style={{ WebkitMaskImage: `url\(\$\{cowIcon\}\)`, maskImage: `url\(\$\{cowIcon\}\)`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} \/>\s*<\/div>/g,
  `<div className={\`w-8 h-8 rounded-full flex items-center justify-center \${STATUS_STYLES[cow.status]?.bg || 'bg-gray-100'} \${STATUS_STYLES[cow.status]?.text || 'text-gray-500'}\`}>
     {cow.status === 'normal' ? <CheckCircle2 size={16} /> :
      cow.status === 'warning' ? <AlertTriangle size={16} /> :
      cow.status === 'overweight' ? <ArrowUpRight size={16} /> :
      cow.status === 'critical' ? <CircleDot size={16} /> : <Activity size={16} />}
   </div>`
);

// 8. Update Table Badges
herd = herd.replace(
  /<span className={`inline-flex items-center px-2\.5 py-0\.5 rounded-full text-xs font-medium \$\{[\s\S]*?cow\.status === 'critical' \? 'bg-red-100 text-red-700 ' :[\s\S]*?cow\.status === 'overweight' \|\| cow\.status === 'warning' \? 'bg-orange-100 text-orange-700 ' :[\s\S]*?'bg-\[#5f76e8\]\/10 text-\[#5f76e8\] '[\s\S]*?\}`}>/g,
  `<span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${STATUS_STYLES[cow.status]?.bg || 'bg-gray-100'} \${STATUS_STYLES[cow.status]?.text || 'text-gray-700'}\`}>`
);

// Fallback for badges if the above regex fails (because of prior green replacements)
herd = herd.replace(
  /cow\.status === 'critical' \? 'bg-red-100 text-red-700 ' :[\s\S]*?'bg-\[#5f76e8\]\/10 text-\[#5f76e8\] '/g,
  "STATUS_STYLES[cow.status]?.bg + ' ' + STATUS_STYLES[cow.status]?.text"
);

// 9. Update Table Trend Arrows (Right next to weight)
herd = herd.replace(
  /\{cow\.trend === 'up' \? \(\s*<ArrowUpRight size=\{16\} className="text-red-500 " \/>\s*\) : cow\.trend === 'down' \? \(\s*<ArrowDownRight size=\{16\} className="text-\[#5f76e8\] " \/>\s*\) : \(\s*<CheckCircle2 size=\{16\} className="text-gray-400 " \/>\s*\)\}/g,
  `{cow.trend === 'up' ? (
    <ArrowUpRight size={16} className={STATUS_STYLES[cow.status]?.text} />
  ) : cow.trend === 'down' ? (
    <ArrowDownRight size={16} className={STATUS_STYLES[cow.status]?.text} />
  ) : (
    <CheckCircle2 size={16} className={STATUS_STYLES[cow.status]?.text} />
  )}`
);
herd = herd.replace(
  /\{cow\.trend === 'up' \? \(\s*<ArrowUpRight size=\{16\} className="text-red-500 " \/>\s*\) : cow\.trend === 'down' \? \(\s*<ArrowDownRight size=\{16\} className="text-green-500 " \/>\s*\) : \(\s*<CheckCircle2 size=\{16\} className="text-gray-400 " \/>\s*\)\}/g,
  `{cow.trend === 'up' ? (
    <ArrowUpRight size={16} className={STATUS_STYLES[cow.status]?.text} />
  ) : cow.trend === 'down' ? (
    <ArrowDownRight size={16} className={STATUS_STYLES[cow.status]?.text} />
  ) : (
    <CheckCircle2 size={16} className={STATUS_STYLES[cow.status]?.text} />
  )}`
);

// 10. Update Chart colors in modal
herd = herd.replace(/stroke="#22c55e"/g, 'stroke="#5f76e8"');
herd = herd.replace(/fill: '#22c55e'/g, "fill: '#5f76e8'");

fs.writeFileSync('src/pages/Herd.tsx', herd);
