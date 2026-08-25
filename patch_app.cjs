const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Remove ensureUserProfileFromGoogle
code = code.replace(/ensureUserProfileFromGoogle,?\s*/, '');
// Remove firebase imports
code = code.replace(/import \{ auth \} from '\.\/services\/firebase';\n/, '');
code = code.replace(/import \{ onAuthStateChanged \} from 'firebase\/auth';\n/, '');

// Remove Firebase Auth state listener
code = code.replace(/\/\/ 2\. Listen to Firebase Auth state for cloud sync[\s\S]*?return \(\) => \{\n\s*unsubscribe\(\);\n\s*\};\n/g, '');

fs.writeFileSync('App.tsx', code);
