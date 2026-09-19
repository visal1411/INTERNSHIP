const fs = require('fs');

let devicesCode = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// 1. Add state
const stateMarker = "const { t } = useTranslation();";
if (devicesCode.includes(stateMarker) && !devicesCode.includes("showGuide")) {
  devicesCode = devicesCode.replace(stateMarker, `const { t } = useTranslation();\n  const [showGuide, setShowGuide] = useState(false);`);
}

// 2. Add useState to react imports if not there
if (devicesCode.includes("import React from 'react';")) {
  devicesCode = devicesCode.replace("import React from 'react';", "import React, { useState } from 'react';");
} else if (devicesCode.includes("import { useTranslation }") && !devicesCode.includes("useState")) {
  devicesCode = `import { useState } from 'react';\n` + devicesCode;
}

// 3. Update the button
const buttonRegex = /<button className="border border-gray-300 text-gray-700 px-5 py-2\.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">[\s\S]*?View Setup Guide[\s\S]*?<\/button>/;
const newButton = `<button onClick={() => setShowGuide(true)} className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                View Setup Guide
              </button>`;

if (devicesCode.match(buttonRegex)) {
  devicesCode = devicesCode.replace(buttonRegex, newButton);
} else {
  console.log("Could not find View Setup Guide button");
}

// 4. Inject Modal
const modalCode = `
      {/* Setup Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Device Setup Guide</h3>
              <button onClick={() => setShowGuide(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#5f76e8]/10 text-[#5f76e8] flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Power on the smart scale</h4>
                  <p className="text-gray-500 text-sm mt-1">Plug the device into a power source and ensure the blue indicator light is blinking.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#5f76e8]/10 text-[#5f76e8] flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Connect to device WiFi</h4>
                  <p className="text-gray-500 text-sm mt-1">Use your phone to connect to the network named "CowFit-Setup-XXXX".</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#5f76e8]/10 text-[#5f76e8] flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Configure network</h4>
                  <p className="text-gray-500 text-sm mt-1">Open your browser to 192.168.4.1 and enter your farm's WiFi credentials.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#5f76e8]/10 text-[#5f76e8] flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Device auto-syncs</h4>
                  <p className="text-gray-500 text-sm mt-1">The scale will restart and automatically appear in this dashboard within 2 minutes.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowGuide(false)} className="px-5 py-2.5 bg-[#5f76e8] text-white rounded-lg hover:bg-[#5f76e8]/90 font-medium transition-colors shadow-sm">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
`;

const insertMarker = "</div>\n    );\n  }";
if (devicesCode.includes(insertMarker)) {
  devicesCode = devicesCode.replace(insertMarker, modalCode + insertMarker);
}

fs.writeFileSync('src/pages/Devices.tsx', devicesCode);
console.log("Devices.tsx guide patched.");
