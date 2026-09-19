const fs = require('fs');
let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

home = home.replace(
  /<div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white \${STATUS_STYLES\[cow\.status\]\?\.bg \|\| 'bg-gray-100'} \${STATUS_STYLES\[cow\.status\]\?\.text \|\| 'text-gray-500'}`}>[\s\S]*?<div className="w-5 h-5 bg-current"[\s\S]*?<\/div>\s*<\/div>/,
  `<div className={\`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 \${STATUS_STYLES[cow.status]?.bg || 'bg-gray-100'} \${STATUS_STYLES[cow.status]?.text || 'text-gray-500'}\`}>
                    {cow.status === 'normal' && <CheckCircle2 size={20} />}
                    {cow.status === 'warning' && <AlertTriangle size={20} />}
                    {cow.status === 'overweight' && <ArrowUpRight size={20} />}
                    {cow.status === 'critical' && <AlertTriangle size={20} />}
                  </div>`
);

fs.writeFileSync('src/pages/Home.tsx', home);
