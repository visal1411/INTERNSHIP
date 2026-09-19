const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(/dark:[^\s"']+/g, '');
code = code.replace(/bg-green-50/g, 'bg-[#5f76e8]/10');
code = code.replace(/bg-green-100/g, 'bg-[#5f76e8]/20');
code = code.replace(/bg-green-500/g, 'bg-[#5f76e8]');
code = code.replace(/bg-green-600/g, 'bg-[#5f76e8]');
code = code.replace(/hover:bg-green-700/g, 'hover:bg-[#5f76e8]/90');
code = code.replace(/text-green-[4567]00/g, 'text-[#5f76e8]');
code = code.replace(/border-green-100/g, 'border-[#5f76e8]/20');
code = code.replace(/focus:ring-green-500/g, 'focus:ring-[#5f76e8]');
code = code.replace(/peer-checked:bg-green-600/g, 'peer-checked:bg-[#5f76e8]');

// Remove double spaces introduced by dark: removal, but careful with string literals
// A simple way is to just let the Tailwind classes have double spaces, it doesn't break HTML.
// Let's replace the main content area div to add the FreeDash shadow
code = code.replace(
  'className="w-full max-w-4xl h-fit bg-white  rounded-2xl border border-gray-200  shadow-sm p-6 md:p-8 transition-colors"',
  'className="w-full max-w-4xl h-fit bg-white rounded-xl border-0 p-6 md:p-8 transition-colors" style={{ boxShadow: "0 3px 9px 0 rgba(169, 184, 200, .15)" }}'
);
// Also just in case the double spaces didn't match:
code = code.replace(
  /className="w-full max-w-4xl h-fit bg-white\s+rounded-2xl border border-gray-200\s+shadow-sm p-6 md:p-8 transition-colors"/,
  'className="w-full max-w-4xl h-fit bg-white rounded-xl border-0 p-6 md:p-8 transition-colors" style={{ boxShadow: "0 3px 9px 0 rgba(169, 184, 200, .15)" }}'
);

fs.writeFileSync('src/pages/Settings.tsx', code);
