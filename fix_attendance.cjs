const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

code = code.replace(
  /const isCurrentOrLegacy = k\.includes\(`_\$\{activeUid\}_`\) \|\| k\.includes\(`_default_user_`\);\n\s*if \(\!isCurrentOrLegacy\) continue;/g,
  `// Removed strict partitioning so legacy Firebase-UID data is not lost on the same device.`
);

fs.writeFileSync('services/storageService.ts', code);
