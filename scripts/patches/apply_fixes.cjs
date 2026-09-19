const fs = require('fs');

// --- 1. Fix StatCard.tsx (Delta badge alignment) ---
let statCard = fs.readFileSync('src/components/StatCard.tsx', 'utf8');
statCard = statCard.replace(
  /<div className="flex items-center mt-4">([\s\S]*?)<span className={`text-sm font-medium ml-3 ([^`]+)`}>/m,
  (match, p1, p2) => {
    return `<div className="flex items-baseline gap-2 mt-4">\n${p1}<span className={\`text-xs font-medium px-2 py-0.5 rounded-full self-center \${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>`;
  }
);
// Also I should ensure the badge itself is styled correctly. In my current StatCard.tsx, the badge might be different.
fs.writeFileSync('src/components/StatCard.tsx', statCard);

// --- 2. Fix Home.tsx (Recharts + Clock + Status) ---
let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Imports
home = home.replace(
  /import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, ArrowRight, ChevronDown } from 'lucide-react';/,
  `import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { STATUS_STYLES } from '../config/statusConfig';`
);

// State for last updated
home = home.replace(
  /const { t } = useTranslation\(\);/,
  `const { t } = useTranslation();\n  const [lastUpdated] = useState(new Date(Date.now() - 5 * 60000));` // 5 mins ago
);

// YAxis
home = home.replace(
  /<YAxis axisLine={false} tickLine={false} tick={{ fill: '#8392a5', fontSize: 12 }} \/>/,
  `<YAxis domain={[900, 'dataMax + 50']} ticks={[900, 1050, 1200, 1350, 1500]} axisLine={false} tickLine={false} tick={{ fill: '#8392a5', fontSize: 12 }} />`
);

// Area dot
home = home.replace(
  /fill="url\(#colorWeight\)"(\s+)isAnimationActive={true}/,
  `fill="url(#colorWeight)" dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}$1isAnimationActive={true}`
);

// Tooltip
home = home.replace(
  /contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 3px 9px 0px rgba\(162, 176, 190, 0.15\)', backgroundColor: 'white', color: '#111827' }}/,
  `contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 3px 9px 0px rgba(162, 176, 190, 0.15)', backgroundColor: 'white', color: '#111827' }}`
);

// Header Last updated
home = home.replace(
  /<ul className="flex items-center gap-4 text-sm mb-0">/,
  `<div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Clock size={14} />
                  Updated {formatDistanceToNow(lastUpdated)} ago
                </div>
                <ul className="flex items-center gap-4 text-sm mb-0">`
);

// recentWeighIns status changes
home = home.replace(
  /status: t\('status.(normal|warning|overweight|critical)'\)/g,
  (match, p1) => `status: '${p1}'`
);

// render recentWeighIns styles
// For the icon background:
home = home.replace(
  /className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white \${[\s\S]*?}`}/,
  "className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white ${STATUS_STYLES[cow.status]?.bg || 'bg-gray-100'} ${STATUS_STYLES[cow.status]?.text || 'text-gray-500'}`}"
);

// For the label background:
home = home.replace(
  /className={`text-xs font-medium px-2 py-0.5 mt-1 rounded-full text-white inline-block \${[\s\S]*?}`}>[\s\S]*?{cow.status}[\s\S]*?<\/span>/,
  "className={`text-xs font-medium px-2 py-0.5 mt-1 rounded-full inline-block ${STATUS_STYLES[cow.status]?.bg} ${STATUS_STYLES[cow.status]?.text}`}>\n                    {t(`status.${cow.status}`)}\n                  </span>"
);

fs.writeFileSync('src/pages/Home.tsx', home);
