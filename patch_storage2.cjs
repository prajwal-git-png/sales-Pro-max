const fs = require('fs');
let content = fs.readFileSync('services/storageService.ts', 'utf8');

content = content.replace(
  "const getDocId = (key: string) => `${getUid()}_${key}`;",
  "const getDocId = (key: string, storeName?: string) => storeName === 'users' ? key : `${getUid()}_${key}`;"
);

content = content.replace(
  "const docRef = doc(db, storeName, getDocId(key));",
  "const docRef = doc(db, storeName, getDocId(key, storeName));"
);
content = content.replace(
  "const docRef = doc(db, storeName, getDocId(key));",
  "const docRef = doc(db, storeName, getDocId(key, storeName));"
);
content = content.replace(
  "await deleteDoc(doc(db, storeName, getDocId(key)));",
  "await deleteDoc(doc(db, storeName, getDocId(key, storeName)));"
);

content = content.replace(
  "putToStore('users', user.uid, user);",
  "putToStore('users', user.uid, { ...user, email: auth.currentUser?.email || '' });"
);

fs.writeFileSync('services/storageService.ts', content);
