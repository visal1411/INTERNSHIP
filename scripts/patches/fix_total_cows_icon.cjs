const fs = require('fs');

let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Replace the remaining cowIcon usage
home = home.replace(
  /<div className="w-6 h-6 bg-current text-gray-600 " style={{ WebkitMaskImage: `url\(\$\{cowIcon\}\)`, maskImage: `url\(\$\{cowIcon\}\)`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} \/>/g,
  '<Hash className="w-6 h-6 text-[#5f76e8]" />'
);

// Remove the import
home = home.replace(/import cowIcon from '\.\.\/assets\/cow\.png';\n/g, '');

fs.writeFileSync('src/pages/Home.tsx', home);
