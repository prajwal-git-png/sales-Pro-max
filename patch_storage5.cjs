const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

code = code.replace(/if \(uid\) \{\s*try \{\s*const docRef = doc\(db, storeName, docId\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*const cloudData = docSnap\.data\(\) as T;\s*const images = \(cloudData as any\)\?\.images \|\| \[\];\s*await idbSaveImages\(docId, normKey, images, uid\);\s*return cloudData;\s*\}\s*\} catch \(e\) \{\s*console\.warn\("getFromStore images cloud fetch warn", e\);\s*\}\s*\}/g, '');

code = code.replace(/try \{\s*const docRef = doc\(db, storeName, getDocId\(normKey, storeName\)\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*const data = docSnap\.data\(\) as T;\s*setLocalItem\(storeName, normKey, data\);\s*return data;\s*\}\s*return localVal;\s*\} catch \(e\) \{\s*console\.warn\("getFromStore fallback to local cache", e\);\s*return localVal;\s*\}/g, '');

code = code.replace(/if \(uid\) \{\s*try \{\s*const q = query\(collection\(db, storeName\), where\("userId", "==", uid\)\);\s*const querySnapshot = await getDocs\(q\);\s*querySnapshot\.docs\.forEach\(docSnap => \{\s*const item = docSnap\.data\(\) as any;\s*if \(item\?\.date\) \{\s*const norm = normalizeDateString\(item\.date\);\s*map\.set\(norm, \{ \.\.\.item, date: norm \}\);\s*idbSaveImages\(getDocId\(norm, storeName\), norm, item\.images \|\| \[\], uid\);\s*\}\s*\}\);\s*\} catch \(e\) \{\s*console\.warn\("getAllFromStore images cloud warning", e\);\s*\}\s*\}/g, '');

code = code.replace(/try \{\s*const q = query\(collection\(db, storeName\), where\("userId", "==", uid\)\);[\s\S]*?console\.warn\("getAllFromStore fallback to local cache", e\);\s*return localList;\s*\}/g, '');

fs.writeFileSync('services/storageService.ts', code);
