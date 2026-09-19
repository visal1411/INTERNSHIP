const fs = require('fs');

let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add Activity and Hash to imports
if (!home.includes('Activity')) {
  home = home.replace(
    /import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, ArrowRight, ChevronDown, Clock } from 'lucide-react';/,
    "import { Scale, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, ArrowRight, ChevronDown, Clock, Activity, Hash, CircleDot } from 'lucide-react';"
  );
}

// Total Cows icon in StatCard
home = home.replace(
  /<div className="w-6 h-6 bg-current text-gray-600" style={{ WebkitMaskImage: `url\(\$\{cowIcon\}\)`, maskImage: `url\(\$\{cowIcon\}\)`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} \/>/g,
  '<Hash className="w-6 h-6 text-gray-600" />'
);

// Recent activity icons
home = home.replace(
  /<div className="w-6 h-6 bg-current" style={{ WebkitMaskImage: `url\(\$\{cowIcon\}\)`, maskImage: `url\(\$\{cowIcon\}\)`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} \/>/g,
  `{cow.status === 'normal' ? <CheckCircle2 size={24} /> :
     cow.status === 'warning' ? <AlertTriangle size={24} /> :
     cow.status === 'overweight' ? <ArrowUpRight size={24} /> :
     cow.status === 'critical' ? <CircleDot size={24} /> : <Activity size={24} />}`
);

fs.writeFileSync('src/pages/Home.tsx', home);
