const fs = require('fs');
let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Replace the icon circle logic
home = home.replace(
  /<div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors \$\{cow\.status === t\('status\.critical'\) \? 'bg-red-100 text-red-600 group-hover:bg-red-200 ' :\s*cow\.status === t\('status\.overweight'\) \|\| cow\.status === t\('status\.warning'\) \? 'bg-orange-100 text-orange-600 group-hover:bg-orange-200 ' :\s*'bg-\[#5f76e8\]\/20 text-\[#5f76e8\] group-hover:bg-green-200 '\s*\}`}>/g,
  '<div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${STATUS_STYLES[cow.status]?.bg || \'bg-gray-100\'} ${STATUS_STYLES[cow.status]?.text || \'text-gray-500\'}`}>\n'
);

// Replace the trend arrow colors
// We want trend up for overweight/critical to be the status color, but wait! The arrow itself is a trend arrow.
// The easiest is just to style the whole right side (arrow and text) using the status color.
home = home.replace(
  /{cow\.trend === 'up' \? \(\s*<ArrowUpRight size=\{14\} className="text-\[#5f76e8\]" \/>\s*\) : cow\.trend === 'down' \? \(\s*<ArrowDownRight size=\{14\} className="text-red-500" \/>\s*\) : \(\s*<CheckCircle2 size=\{14\} className="text-gray-400 " \/>\s*\)}/g,
  `{cow.trend === 'up' ? (
 <ArrowUpRight size={14} className={STATUS_STYLES[cow.status]?.text} />
) : cow.trend === 'down' ? (
 <ArrowDownRight size={14} className={STATUS_STYLES[cow.status]?.text} />
) : (
 <CheckCircle2 size={14} className={STATUS_STYLES[cow.status]?.text} />
)}`
);

// Replace the status text color
home = home.replace(
  /<span className={`text-xs font-semibold \$\{cow\.trend === 'up' \? 'text-\[#5f76e8\] ' :\s*cow\.trend === 'down' \? 'text-red-600 ' :\s*'text-gray-500 '\s*\}`}>/g,
  '<span className={`text-xs font-semibold ${STATUS_STYLES[cow.status]?.text || \'text-gray-500\'}`}>'
);

fs.writeFileSync('src/pages/Home.tsx', home);
