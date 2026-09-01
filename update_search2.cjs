const fs = require('fs');
let code = fs.readFileSync('components/NewEntry.tsx', 'utf8');

code = code.replace(
  /const searchWords = searchTerm\.toLowerCase\(\)\.replace\(\/\\\\bmr\\\\b\/g, 'morphy richards'\)\.split\(' '\)\.filter\(Boolean\);/,
  `const searchWords = searchTerm.toLowerCase().replace(/\\bmr\\b/g, 'morphy richards').replace(/otgs/g, 'otg').split(' ').filter(Boolean);`
);

fs.writeFileSync('components/NewEntry.tsx', code);
