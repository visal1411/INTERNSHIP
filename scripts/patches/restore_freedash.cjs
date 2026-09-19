const fs = require('fs');

// RESTYLE HOME.TSX
let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Remove dark classes
home = home.replace(/dark:[^\s"']+/g, '');

// Replace specific Tailwind green classes
home = home.replace(/bg-green-50/g, 'bg-[#5f76e8]/10');
home = home.replace(/bg-green-100/g, 'bg-[#5f76e8]/20');
home = home.replace(/bg-green-600/g, 'bg-[#5f76e8]');
home = home.replace(/hover:bg-green-700/g, 'hover:bg-[#5f76e8]/90');
home = home.replace(/hover:bg-green-100/g, 'hover:bg-[#5f76e8]/20');
home = home.replace(/text-green-[4567]00/g, 'text-[#5f76e8]');
home = home.replace(/border-green-200/g, 'border-[#5f76e8]/20');
home = home.replace(/focus:ring-green-500/g, 'focus:ring-[#5f76e8]');

// Fix chart colors
home = home.replace(/#22c55e/g, '#5f76e8');
home = home.replace(/#16a34a/g, '#5f76e8');

// Fix box shadows
home = home.replace(/shadow-sm/g, ''); // we will add inline styles
// It might be easier to just let standard shadow-sm go and only add inline styles to main cards.
// But wait, FreeDash uses a specific drop shadow. I'll just leave `shadow-sm` removed where I can, and add it.
home = home.replace(/className="lg:col-span-2 bg-white  p-6 rounded-2xl border border-gray-200   transition-colors"/g, 'className="lg:col-span-2 bg-white p-6 rounded-lg transition-colors" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}');
home = home.replace(/className="bg-white  p-6 rounded-2xl border border-gray-200   flex flex-col h-\[520px\] transition-colors"/g, 'className="bg-white p-6 rounded-lg transition-colors flex flex-col h-[520px]" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}');

home = home.replace(/ +/g, ' ');

fs.writeFileSync('src/pages/Home.tsx', home);

// RESTYLE STATCARD.TSX
let statCard = fs.readFileSync('src/components/StatCard.tsx', 'utf8');

// Remove dark classes
statCard = statCard.replace(/dark:[^\s"']+/g, '');
statCard = statCard.replace(/bg-green-50/g, 'bg-[#5f76e8]/10');
statCard = statCard.replace(/bg-green-100/g, 'bg-[#5f76e8]/20');
statCard = statCard.replace(/bg-green-600/g, 'bg-[#5f76e8]');
statCard = statCard.replace(/text-green-[4567]00/g, 'text-[#5f76e8]');

statCard = statCard.replace(/className={`bg-white rounded-lg p-6 flex flex-col relative transition-colors \${isAlert \? 'border border-red-300' : ''}`}/g, 'className={`bg-white rounded-lg p-6 flex flex-col relative transition-colors ${isAlert ? \'border border-red-300\' : \'\'}`} style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}');

statCard = statCard.replace(/ +/g, ' ');
fs.writeFileSync('src/components/StatCard.tsx', statCard);
