const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

// Remove deleteFromStore cloud delete
code = code.replace(/if \(auth\.currentUser\?\.uid\) \{[\s\S]*?console\.warn\("deleteFromStore cloud delete warning", e\);\n\s*\}\n\s*\}/g, '');

// Remove saveUser cloud write
code = code.replace(/if \(auth\.currentUser\?\.uid\) \{[\s\S]*?\{ merge: true \}\);\n\s*\}/g, '');

// Remove await from logoutUser
code = code.replace(/await\s*\n/g, '');

fs.writeFileSync('services/storageService.ts', code);
