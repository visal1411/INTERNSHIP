const fs = require('fs');
let herd = fs.readFileSync('src/pages/Herd.tsx', 'utf8');

// Toolbar shadow syntax fix
herd = herd.replace(
  /className="bg-white p-4 rounded-lg border-none" style=\{\{ boxShadow: "0px 3px 9px 0px rgba\(162, 176, 190, 0\.15\)" \}\} mb-6 flex/g,
  'className="bg-white p-4 rounded-lg border-none mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}'
);
// wait, the exact string is:
// <div className="bg-white p-4 rounded-lg border-none" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }} mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
herd = herd.replace(
  /<div className="bg-white p-4 rounded-lg border-none" style=\{\{ boxShadow: "0px 3px 9px 0px rgba\(162, 176, 190, 0\.15\)" \}\} mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">/g,
  '<div className="bg-white p-4 rounded-lg border-none mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}>'
);

// Table container shadow fix
// <div className="bg-white rounded-lg border-none" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }} overflow-hidden flex-1 flex flex-col min-h-[400px] transition-colors">
herd = herd.replace(
  /<div className="bg-white rounded-lg border-none" style=\{\{ boxShadow: "0px 3px 9px 0px rgba\(162, 176, 190, 0\.15\)" \}\} overflow-hidden flex-1 flex flex-col min-h-\[400px\] transition-colors">/g,
  '<div className="bg-white rounded-lg border-none overflow-hidden flex-1 flex flex-col min-h-[400px] transition-colors" style={{ boxShadow: "0px 3px 9px 0px rgba(162, 176, 190, 0.15)" }}>'
);

fs.writeFileSync('src/pages/Herd.tsx', herd);
