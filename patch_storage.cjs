const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

// Remove Firebase imports
code = code.replace(/import \{ db, auth, logoutFirebase \} from '\.\/firebase';\n/, '');
code = code.replace(/import \{ collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc \} from 'firebase\/firestore';\n/, '');
code = code.replace(/import \{ User \} from 'firebase\/auth';\n/, '');

// Remove ensureUserProfileFromGoogle
code = code.replace(/export const ensureUserProfileFromGoogle = async [\s\S]*?^};\n/m, '');

// Clean putToStore
code = code.replace(/if \(auth\.currentUser\?\.uid\) \{[\s\S]*?console\.warn\("putToStore cloud write warning", e\);\n\s*\}\n\s*\}/g, '');

// Clean deleteFromStore
code = code.replace(/if \(auth\.currentUser\?\.uid\) \{[\s\S]*?console\.warn\("deleteFromStore cloud write warning", e\);\n\s*\}\n\s*\}/g, '');

// Clean logoutUser
code = code.replace(/logoutFirebase\(\);\n/g, '');

// Clean saveUser
code = code.replace(/if \(auth\.currentUser\?\.uid\) \{[\s\S]*?console\.warn\("saveUser cloud write warning", e\);\n\s*\}\n\s*\}/g, '');

// Search for any other auth.currentUser usages
fs.writeFileSync('services/storageService.ts', code);
