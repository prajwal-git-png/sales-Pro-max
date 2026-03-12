import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyReport, UserProfile } from '../types';

export const BAJAJ_PRODUCTS = [
  { category: 'Mixer', article: '410561', rdArticle: '492391787', description: 'BAJAJ MIXER GRINDER GX15 500W' },
  { category: 'Mixer', article: '410588', rdArticle: '494226658', description: 'BAJAJ MIXER 500W 3JARS GRACIO LILAC' },
  { category: 'Mixer', article: '410578', rdArticle: '494226659', description: 'BAJAJ MIXER 750W 3JARS CARVE PURPLE' },
  { category: 'Mixer', article: '410595', rdArticle: '494226661', description: 'BAJAJ MIXER 750W 4JARS VIRTUE BLACK' },
  { category: 'Mixer', article: '410630', rdArticle: '494459717', description: 'BAJAJ MG 1000W 4J EVOQUE JET BLK' },
  { category: 'FP', article: '410529', rdArticle: '491892015', description: 'BAJAJ FOOD PROCESSOR FX 1000 DLX 1000W' },
  { category: 'Geyser', article: '150742', rdArticle: '490024627', description: 'BAJAJ INSTANT GEYSER MAJESTY 3KW 3L' },
  { category: 'Geyser', article: '150743', rdArticle: '494426479', description: 'BAJAJ INSTANT GEYSER AERONO 3L 3KW' },
  { category: 'Geyser', article: '150829', rdArticle: '494459605', description: 'BAJAJ STORAGE GEYSER PENTACLE 10L' },
  { category: 'Geyser', article: '150830', rdArticle: '494426477', description: 'BAJAJ STORAGE GEYSER PENTACLE 15L' },
  { category: 'Geyser', article: '150831', rdArticle: '494426478', description: 'BAJAJ STORAGE GEYSER PENTACLE 25L' },
  { category: 'Geyser', article: '150896', rdArticle: '491166983', description: 'BAJAJ WATER HEATER NEWSHAKTI 0742 15L' },
  { category: 'Geyser', article: '150897', rdArticle: '491166984', description: 'BAJAJ WATER HEATER NEWSHAKTI 0743 25L' },
  { category: 'Gas Stove', article: '450135', rdArticle: '491213728', description: 'BAJAJ COOKTOP CGX 2 ECO' },
  { category: 'Gas Stove', article: '450136', rdArticle: '491213729', description: 'BAJAJ COOKTOP MAJESTY CGX3 ECO GLASS' },
  { category: 'Gas Stove', article: '450091', rdArticle: '491454780', description: 'BAJAJ COOKTOP CGX4 ECO GLASS 4 BURNER' },
  { category: 'Gas Stove', article: '450506', rdArticle: '494459543', description: 'Bajaj UCX 2B- 2 Burner' },
  { category: 'Gas Stove', article: '450507', rdArticle: '494338753', description: 'BAJAJ COOKTOP 2BR GP6 2B BLACK' },
  { category: 'Coolers', article: '494510099', rdArticle: '480165', description: 'Bajaj Shield Series Glanza 30' },
  { category: 'Coolers', article: '494510098', rdArticle: '480164', description: 'Bajaj Shield Series Glanza 42' },
  { category: 'Coolers', article: '494338772', rdArticle: '480118', description: 'Bajaj TMH50' },
  { category: 'Coolers', article: '494338771', rdArticle: '480151', description: 'Bajaj Shield Series Elevate 65' },
  { category: 'Coolers', article: '494510095', rdArticle: '480150', description: 'Bajaj Shield Series Elevate 90' },
  { category: 'Coolers', article: '494338770', rdArticle: '480146', description: 'Bajaj Shield Series Mighty 95' },
  { category: 'Toaster, SWM, HB', article: '270030', rdArticle: '490614124', description: 'BAJAJ POP UP TSTR ATX 4' },
  { category: 'Toaster, SWM, HB', article: '270029', rdArticle: '492664396', description: 'BAJAJ POP UP TOASTER ATX 3 SS BK' },
  { category: 'Toaster, SWM, HB', article: '270106', rdArticle: '492284114', description: 'BAJAJ SANDWICH MAKER GRILL SWX4 DLX 800W' },
  { category: 'Toaster, SWM, HB', article: '270107', rdArticle: '494399374', description: 'BAJAJ SANDWICH MAKR SWX6 GRILL' },
  { category: 'Toaster, SWM, HB', article: '410181', rdArticle: '492573221', description: 'BAJAJ HAND BLENDER HB 21 BK 300W' },
  { category: 'Toaster, SWM, HB', article: '410536', rdArticle: '492573222', description: 'BAJAJ HAND BLENDER HB 22 BL 300W' },
  { category: 'Toaster, SWM, HB', article: '410537', rdArticle: '491903207', description: 'Bajaj Hand Blender Juvel 300W' },
  { category: 'Room Heater', article: '260098', rdArticle: '490024601', description: 'Bajaj Flashy New' },
  { category: 'Room Heater', article: '260024', rdArticle: '490024602', description: 'RX10' },
  { category: 'Room Heater', article: '260025', rdArticle: '490024603', description: 'RX11' },
  { category: 'Induction', article: '740054', rdArticle: '494459702', description: 'BAJAJ INDUCTION COOKTOP 1400W ICX 140TS' },
  { category: 'Induction', article: '740076', rdArticle: '492573223', description: 'BAJAJ INDUCTION CT MAJESTY SLIM BK 2100W' },
  { category: 'Irons', article: '440203', rdArticle: '491281337', description: 'BAJAJ DRY IRON DX 11' },
  { category: 'Irons', article: '440214', rdArticle: '491186175', description: 'BAJAJ MAJESTY DX4' },
  { category: 'Irons', article: '440502', rdArticle: '492664385', description: 'Bajaj Steam Iron MX 3 Neo 1250W' },
  { category: 'Irons', article: '440508', rdArticle: '492392008', description: 'BAJAJ STEAM IRON MX 35N' }
];

export const MR_PRODUCTS = [
  { category: 'Mixer', article: '640148', rdArticle: '494338875', description: 'MR Tresta 500W Mixer Grinder' },
  { category: 'Mixer', article: '640149', rdArticle: '494338876', description: 'MR TetraGrind 750W 3 Jar Mixer Grinder' },
  { category: 'Mixer', article: '640137', rdArticle: '494338633', description: 'MR GrindPro Maxx 1000W MG' },
  { category: 'FP', article: '640098', rdArticle: '491892000', description: 'Icon Superb Food Processor' },
  { category: 'HB', article: '640133', rdArticle: '494226825', description: 'Pronto Plus' },
  { category: 'HB', article: '640099', rdArticle: '491581689', description: '640099 MR HB-PRONTO ULTRA' },
  { category: 'Toaster', article: '370067', rdArticle: '494226823', description: 'AT 205' },
  { category: 'Air Fryer', article: '510056', rdArticle: '494226706', description: '5L Digital Air Fryer BL' },
  { category: 'OTG', article: '510057', rdArticle: '494338634', description: 'MR OTG 29 RCAD DIGI' },
  { category: 'OTG', article: '510062', rdArticle: '494404939', description: '20R' },
  { category: 'OTG', article: '510035', rdArticle: '492911243', description: 'OTG 60 RCSS' },
  { category: 'MWO', article: '790008', rdArticle: '491934215', description: 'Microwave Oven - 20MS' },
  { category: 'Irons', article: '500045', rdArticle: '490917545', description: 'Inspira dry iron' },
  { category: 'Irons', article: '500071', rdArticle: '491581690', description: 'Ultra Glide Steam Iron - 1600W' },
  { category: 'Irons', article: '500072', rdArticle: '491186076', description: 'Super Glide Steam Iron - 2000W' }
];

export const generateMonthlyExcelReport = async (user: UserProfile, sales: DailyReport[], monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter sales for the selected month
  const monthSales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const workbook = new ExcelJS.Workbook();

  const createSheet = (brand: 'Bajaj' | 'Morphy Richards', products: any[]) => {
    const sheetName = brand === 'Bajaj' ? 'Bajaj' : 'Morphy Richards';
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: false }]
    });

    // --- Define Columns ---
    ws.columns = [
      { width: 15 }, // Category
      { width: 15 }, // Brand Article
      { width: 15 }, // RD Article
      { width: 40 }, // Article Description
      { width: 12 }, // Target Qty
      ...Array.from({ length: 31 }, () => ({ width: 4 })), // Days 1-31
      { width: 12 }  // Total Qty
    ];

    // --- Styles ---
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };

    const titleFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DDEBF7' } // Light blue
    };

    const lightGrayFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };

    // --- Row 1: Title ---
    const row1 = ws.addRow([`${brand} ISP Monthly Target Sheet | Reliance Digital`]);
    ws.mergeCells(1, 1, 1, 37);
    row1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row1.getCell(1).font = { bold: true };
    row1.getCell(1).fill = titleFill;
    for (let i = 1; i <= 37; i++) row1.getCell(i).border = borderStyle;

    // --- Row 2: Info 1 ---
    const row2 = ws.addRow([
      'ISP Name', user.name, '', '',
      'Store Name', 'Reliance Digital', '', '',
      'Location', user.storeLocation?.address || '', '', '',
      'Reporting LAS', '', '', '',
      'Reporting Manager', 'Basavaraj Patil'
    ]);
    
    // Merge cells for Row 2
    ws.mergeCells(2, 2, 2, 4); // ISP Name value
    ws.mergeCells(2, 6, 2, 8); // Store Name value
    ws.mergeCells(2, 10, 2, 12); // Location value
    ws.mergeCells(2, 14, 2, 16); // Reporting LAS value
    ws.mergeCells(2, 18, 2, 37); // Reporting Manager value

    for (let i = 1; i <= 37; i++) {
      const cell = row2.getCell(i);
      cell.border = borderStyle;
      if ([1, 5, 9, 13, 17].includes(i)) {
        cell.fill = lightGrayFill;
      }
    }

    // --- Row 3: Info 2 ---
    let totalAchieved = 0;
    monthSales.forEach(daySale => {
      daySale.items.forEach(item => {
        if (products.some(p => p.description === item.productName)) {
          totalAchieved += item.quantity;
        }
      });
    });

    const row3 = ws.addRow([
      'Month', monthName, '', '',
      'Target Qty', user.monthlyTarget || 0, '', '',
      'Achivement', totalAchieved, '', '',
      'LAS Review Rating', '', '', '',
      'Manager Remark', ''
    ]);

    // Merge cells for Row 3
    ws.mergeCells(3, 2, 3, 4); // Month value
    ws.mergeCells(3, 6, 3, 8); // Target Qty value
    ws.mergeCells(3, 10, 3, 12); // Achievement value
    ws.mergeCells(3, 14, 3, 16); // LAS Review Rating value
    ws.mergeCells(3, 18, 3, 37); // Manager Remark value

    for (let i = 1; i <= 37; i++) {
      const cell = row3.getCell(i);
      cell.border = borderStyle;
      if ([1, 5, 9, 13, 17].includes(i)) {
        cell.fill = lightGrayFill;
      }
    }

    // --- Row 4: Brand Header & Date ---
    const row4 = ws.addRow([brand, '', '', '', '', 'Date']);
    ws.mergeCells(4, 1, 4, 5); // Brand
    ws.mergeCells(4, 6, 4, 36); // Date
    row4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row4.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row4.getCell(1).fill = lightGrayFill;
    row4.getCell(6).fill = lightGrayFill;
    for (let i = 1; i <= 37; i++) row4.getCell(i).border = borderStyle;

    // --- Row 5: Headers ---
    const headers = ['Category', brand === 'Bajaj' ? 'Bajaj Article' : 'MR Article', 'RD Article', 'Article Description', 'Target Qty'];
    for (let i = 1; i <= 31; i++) headers.push(i.toString());
    headers.push('Total Qty');
    
    const row5 = ws.addRow(headers);
    row5.font = { bold: true };
    for (let i = 1; i <= 37; i++) {
      const cell = row5.getCell(i);
      cell.border = borderStyle;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (i >= 6 && i <= 36) {
        // Add green triangle to date headers to match image
        cell.font = { bold: true, color: { argb: '000000' } };
      }
    }

    // Merge Total Qty vertically
    ws.mergeCells(4, 37, 5, 37);
    ws.getCell(4, 37).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(4, 37).font = { bold: true };

    // --- Product Rows ---
    const dailyTotals = new Array(31).fill(0);
    let grandTotal = 0;
    
    // Group products by category to merge cells
    let currentRow = 6;
    let currentCategory = '';
    let categoryStartRow = 6;

    products.forEach((product, index) => {
      const rowData = [product.category, product.article, product.rdArticle, product.description, ''];
      
      let productTotal = 0;
      for (let i = 1; i <= 31; i++) {
        if (i <= daysInMonth) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const daySale = monthSales.find(s => s.date === dateStr);
          let qty = 0;
          if (daySale) {
            const items = daySale.items.filter(item => item.productName === product.description);
            qty = items.reduce((sum, item) => sum + item.quantity, 0);
          }
          rowData.push(qty > 0 ? qty : '');
          productTotal += qty;
          dailyTotals[i-1] += qty;
        } else {
          rowData.push('');
        }
      }
      rowData.push(productTotal > 0 ? productTotal : '');
      grandTotal += productTotal;
      
      const row = ws.addRow(rowData);
      
      for (let i = 1; i <= 37; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle;
        if (i >= 6 && i <= 36) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }

      // Handle Category Merging
      if (product.category !== currentCategory) {
        if (currentCategory !== '' && currentRow - 1 > categoryStartRow) {
          ws.mergeCells(categoryStartRow, 1, currentRow - 1, 1);
          ws.getCell(categoryStartRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
        }
        currentCategory = product.category;
        categoryStartRow = currentRow;
      }
      
      // Merge last category if it's the end
      if (index === products.length - 1 && currentRow > categoryStartRow) {
        ws.mergeCells(categoryStartRow, 1, currentRow, 1);
        ws.getCell(categoryStartRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      }

      currentRow++;
    });
    
    // --- Last Row: Totals ---
    const totalRowData: any[] = ['Total Qty', '', '', '', ''];
    for (let i = 1; i <= 31; i++) {
      if (i <= daysInMonth) {
        totalRowData.push(dailyTotals[i-1] > 0 ? dailyTotals[i-1] : '');
      } else {
        totalRowData.push('');
      }
    }
    totalRowData.push(grandTotal > 0 ? grandTotal : '');
    
    const totalRow = ws.addRow(totalRowData);
    ws.mergeCells(currentRow, 1, currentRow, 4);
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    for (let i = 1; i <= 37; i++) {
      const cell = totalRow.getCell(i);
      cell.border = borderStyle;
      if (i >= 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  };

  createSheet('Bajaj', BAJAJ_PRODUCTS);
  createSheet('Morphy Richards', MR_PRODUCTS);

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Monthly_Report_${monthName.replace(' ', '_')}.xlsx`);
};
