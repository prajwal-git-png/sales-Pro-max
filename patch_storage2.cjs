const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

code = code.replace(/auth\.currentUser\?\.uid \|\| /g, '');
code = code.replace(/const uid = auth\.currentUser\?\.uid;/g, 'const uid = null;'); // It falls back later

// Remove the cloud block in saveUser if it still exists
code = code.replace(/if \(auth\.currentUser\?\.uid\) \{[\s\S]*?\}\s*catch\s*\(e\)\s*\{\s*console\.warn\("saveUser cloud write warning",\s*e\);\s*\}\s*\}/g, '');

fs.writeFileSync('services/storageService.ts', code);
