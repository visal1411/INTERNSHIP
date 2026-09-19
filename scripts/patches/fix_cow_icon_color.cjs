const fs = require('fs');
let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Update the icon wrapper to enforce text-white
home = home.replace(
  /<div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white \${STATUS_STYLES\[cow\.status\]\?\.bg \|\| 'bg-gray-100'} \${STATUS_STYLES\[cow\.status\]\?\.text \|\| 'text-gray-500'}`}>/g,
  `<div className={\`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 \${STATUS_STYLES[cow.status]?.bg || 'bg-gray-100'}\`}>`
);

// Enforce text-white on the mask itself
home = home.replace(
  /<div className="w-5 h-5 bg-current"/g,
  `<div className="w-5 h-5 bg-white"`
);

fs.writeFileSync('src/pages/Home.tsx', home);
