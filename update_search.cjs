const fs = require('fs');
let code = fs.readFileSync('components/NewEntry.tsx', 'utf8');

// Change PRODUCT_LIST to export the original objects from excelExportService
code = code.replace(
  /const PRODUCT_LIST = \[\.\.\.BAJAJ_PRODUCTS, \.\.\.MR_PRODUCTS\]\.map\(p => p\.description\);/,
  `const PRODUCT_LIST_OBJS = [...BAJAJ_PRODUCTS.map(p => ({ ...p, brand: 'BAJAJ' })), ...MR_PRODUCTS.map(p => ({ ...p, brand: 'MORPHY RICHARDS' }))];\nconst PRODUCT_LIST = PRODUCT_LIST_OBJS.map(p => p.description);`
);

// Update search logic
const newSearchLogic = `const filteredProducts = searchTerm 
      ? PRODUCT_LIST_OBJS.filter(p => {
          let searchStr = (p.brand + ' ' + p.category + ' ' + p.description).toLowerCase();
          // Normalize "mr" to "morphy richards" in search terms
          const searchWords = searchTerm.toLowerCase().replace(/\\bmr\\b/g, 'morphy richards').split(' ').filter(Boolean);
          return searchWords.every(word => searchStr.includes(word));
        }).map(p => p.description)
      : PRODUCT_LIST;`;

code = code.replace(
  /const filteredProducts = searchTerm[\s\S]*?: PRODUCT_LIST;/,
  newSearchLogic
);

fs.writeFileSync('components/NewEntry.tsx', code);
