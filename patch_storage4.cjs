const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

// getFromStore
code = code.replace(/if \(!localVal && auth\.currentUser\?\.uid\) \{[\s\S]*?console\.warn\(`getFromStore cloud fetch warning \$\{storeName\}`, e\);\n\s*\}\n\s*\}/g, '');
code = code.replace(/if \(!localVal\) \{[\s\S]*?console\.warn\(`getFromStore cloud fetch warning \$\{storeName\}`, e\);\n\s*\}\n\s*\}/g, '');

// The actual block might be slightly different. Let's do a precise string replacement on getFromStore
code = code.replace(/if \(!localVal\) \{\s*try \{\s*const docRef = doc\(db, storeName, getDocId\(normKey, storeName\)\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*localVal = docSnap\.data\(\) as T;\s*if \(storeName === 'images'\) \{\s*const images = \(localVal as any\)\.images \|\| \[\];\s*await idbSaveImages\(getDocId\(normKey, storeName\), normKey, images, uid\);\s*\} else \{\s*setLocalItem\(storeName, normKey, localVal\);\s*\}\s*\}\s*\} catch \(e\) \{\s*console\.warn\(`getFromStore cloud fetch warning \$\{storeName\}`, e\);\s*\}\s*\}/g, '');
// Wait, getFromStore uses docRef. Let's see the exact code.
fs.writeFileSync('services/storageService.ts', code);
