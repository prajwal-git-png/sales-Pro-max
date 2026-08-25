const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

code = code.replace(/await\s*\} catch/g, '} catch');

fs.writeFileSync('services/storageService.ts', code);
