const fs = require('fs');

// 1. Update Devices.tsx
let devicesCode = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// Add onAddDevice prop
devicesCode = devicesCode.replace(/onRemoveDevice: \(id: string\) => void;/, `onRemoveDevice: (id: string) => void;\n  onAddDevice?: (name: string) => void;`);
devicesCode = devicesCode.replace(/export function Devices\(\{ scalesData, onRemoveDevice,/, `export function Devices({ scalesData, onRemoveDevice, onAddDevice,`);

// Wire the button
const buttonRegex = /<button className="bg-\[#5f76e8\] text-white px-5 py-2\.5 rounded-lg font-medium hover:bg-\[#5f76e8\]\/90 transition-colors shadow-sm">[\s\S]*?\+\s*Add Device Manually[\s\S]*?<\/button>/;
const newButton = `<button onClick={() => { const name = prompt('Enter a name for the new scale device:'); if (name && name.trim()) onAddDevice?.(name.trim()); }} className="bg-[#5f76e8] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#5f76e8]/90 transition-colors shadow-sm">
                + Add Device Manually
              </button>`;
if (devicesCode.match(buttonRegex)) {
  devicesCode = devicesCode.replace(buttonRegex, newButton);
} else {
  console.log("Could not match empty state button in Devices.tsx");
}

fs.writeFileSync('src/pages/Devices.tsx', devicesCode);
console.log("Devices.tsx patched.");


// 2. Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Add handleAddDevice function
const removeDeviceRegex = /const handleRemoveDevice = async \(id: string\) => \{[\s\S]*?\};/;
const newDeviceLogic = `const handleAddDevice = (name: string) => {
    const newDevice = {
      id: 'SCALE-' + Math.floor(1000 + Math.random() * 9000),
      name: name,
      status: 'online',
      battery: '100%',
      lastSync: 'Just now',
      currentReading: '0 lbs'
    };
    setScalesData(prev => [...prev, newDevice as any]);
    setToastMessage("Device added successfully");
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const handleRemoveDevice = async (id: string) => {`;
  
appCode = appCode.replace(/const handleRemoveDevice = async \(id: string\) => \{/, newDeviceLogic);

// Pass to Devices component
appCode = appCode.replace(/<Devices scalesData=\{scalesData\} onRemoveDevice=\{handleRemoveDevice\}/, `<Devices scalesData={scalesData} onRemoveDevice={handleRemoveDevice} onAddDevice={handleAddDevice}`);

fs.writeFileSync('src/App.tsx', appCode);
console.log("App.tsx patched.");
