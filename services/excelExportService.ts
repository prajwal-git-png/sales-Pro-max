import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyReport, UserProfile } from '../types';

export interface ProductItem {
  category: string;
  article: string;
  rdArticle: string;
  description: string;
}

// EXACT Bajaj products from provided official PDF target sheet (No duplicates)
export const BAJAJ_PRODUCTS: ProductItem[] = [
  // Mixer
  { category: 'Mixer', article: '410561', rdArticle: '492391787', description: 'BAJAJ MIXER GRINDER GX15 500W' },
  { category: 'Mixer', article: '410588', rdArticle: '494226658', description: 'BAJAJ MIXER 500W 3JARS GRACIO LILAC' },
  { category: 'Mixer', article: '410578', rdArticle: '494226659', description: 'BAJAJ MIXER 750W 3JARS CARVE PURPLE' },
  { category: 'Mixer', article: '410595', rdArticle: '494226661', description: 'BAJAJ MIXER 750W 4JARS VIRTUE BLACK' },
  { category: 'Mixer', article: '410630', rdArticle: '494459717', description: 'BAJAJ MG 1000W 4J EVOQUE JET BLK' },

  // FP
  { category: 'FP', article: '410529', rdArticle: '491892015', description: 'BAJAJ FOOD PROCESSOR FX 1000 DLX 1000W' },

  // Geyser
  { category: 'Geyser', article: '150742', rdArticle: '490024627', description: 'BAJAJ INSTANT GEYSER MAJESTY 3KW 3L' },
  { category: 'Geyser', article: '150743', rdArticle: '494426479', description: 'BAJAJ INSTANT GEYSER AERONO 3L 3KW' },
  { category: 'Geyser', article: '150829', rdArticle: '494459605', description: 'BAJAJ STORAGE GEYSER PENTACLE 10L' },
  { category: 'Geyser', article: '150830', rdArticle: '494426477', description: 'BAJAJ STORAGE GEYSER PENTACLE 15L' },
  { category: 'Geyser', article: '150831', rdArticle: '494426478', description: 'BAJAJ STORAGE GEYSER PENTACLE 25L' },
  { category: 'Geyser', article: '150896', rdArticle: '491166983', description: 'BAJAJ WATER HEATER NEWSHAKTI 0742 15L' },
  { category: 'Geyser', article: '150897', rdArticle: '491166984', description: 'BAJAJ WATER HEATER NEWSHAKTI 0743 25L' },

  // Gas Stove
  { category: 'Gas Stove', article: '450135', rdArticle: '491213728', description: 'BAJAJ COOKTOP CGX 2 ECO' },
  { category: 'Gas Stove', article: '450136', rdArticle: '491213729', description: 'BAJAJ COOKTOP MAJESTY CGX3 ECO GLASS' },
  { category: 'Gas Stove', article: '450091', rdArticle: '491454780', description: 'BAJAJ COOKTOP CGX4 ECO GLASS 4 BURNER' },
  { category: 'Gas Stove', article: '450506', rdArticle: '494459543', description: 'Bajaj UCX 2B - 2 Burner' },
  { category: 'Gas Stove', article: '450507', rdArticle: '494338753', description: 'BAJAJ COOKTOP 2BR GP6 2B BLACK' },

  // Coolers
  { category: 'Coolers', article: '494510099', rdArticle: '480165', description: 'Bajaj Shield Series Glanza 30' },
  { category: 'Coolers', article: '494510098', rdArticle: '480164', description: 'Bajaj Shield Series Glanza 42' },
  { category: 'Coolers', article: '494338772', rdArticle: '480118', description: 'Bajaj TMH50' },
  { category: 'Coolers', article: '494338771', rdArticle: '480151', description: 'Bajaj Shield Series Elevate 65' },
  { category: 'Coolers', article: '494510095', rdArticle: '480150', description: 'Bajaj Shield Series Elevate 90' },
  { category: 'Coolers', article: '494338770', rdArticle: '480146', description: 'Bajaj Shield Series Mighty 95' },

  // Toaster, SWM, HB
  { category: 'Toaster, SWM, HB', article: '270030', rdArticle: '490614124', description: 'BAJAJ POP UP TSTR ATX 4 18.3X16.4X28.3cm' },
  { category: 'Toaster, SWM, HB', article: '270029', rdArticle: '492664396', description: 'BAJAJ POP UP TOASTER ATX 3 SS BK' },
  { category: 'Toaster, SWM, HB', article: '270106', rdArticle: '492284114', description: 'BAJAJ SANDWICH MAKER GRILL SWX4 DLX 800W' },
  { category: 'Toaster, SWM, HB', article: '270107', rdArticle: '494399374', description: 'BAJAJ SANDWICH MAKR SWX6 GRILL' },
  { category: 'Toaster, SWM, HB', article: '410181', rdArticle: '492573221', description: 'BAJAJ HAND BLENDER HB 21 BK 300W' },
  { category: 'Toaster, SWM, HB', article: '410536', rdArticle: '492573222', description: 'BAJAJ HAND BLENDER HB 22 BL 300W' },
  { category: 'Toaster, SWM, HB', article: '410537', rdArticle: '491903207', description: 'Bajaj Hand Blender Juvel 300W' },

  // Room Heater
  { category: 'Room Heater', article: '260098', rdArticle: '490024601', description: 'Bajaj Flashy New' },
  { category: 'Room Heater', article: '260024', rdArticle: '490024602', description: 'RX10' },
  { category: 'Room Heater', article: '260025', rdArticle: '490024603', description: 'RX11' },

  // Induction
  { category: 'Induction', article: '740054', rdArticle: '494459702', description: 'BAJAJ INDUCTION COOKTOP 1400W ICX 140TS' },
  { category: 'Induction', article: '740076', rdArticle: '492573223', description: 'BAJAJ INDUCTION CT MAJESTY SLIM BK 2100W' },

  // Irons
  { category: 'Irons', article: '440203', rdArticle: '491281337', description: 'BAJAJ DRY IRON DX 11' },
  { category: 'Irons', article: '440214', rdArticle: '491186175', description: 'BAJAJ MAJESTY DX4 DRY IRON 1000W WHITE' },
  { category: 'Irons', article: '440502', rdArticle: '492664385', description: 'Bajaj Steam Iron MX 3 Neo 1250W' },
  { category: 'Irons', article: '440508', rdArticle: '492392008', description: 'BAJAJ STEAM IRON MX 35N BLACK & PURPLE' }
];

// EXACT Morphy Richards products from provided official PDF target sheet (No duplicates)
export const MR_PRODUCTS: ProductItem[] = [
  // Mixer
  { category: 'Mixer', article: '640148', rdArticle: '494338875', description: 'MR Tresta 500W Mixer Grinder' },
  { category: 'Mixer', article: '640149', rdArticle: '494338876', description: 'MR TetraGrind 750W 3 Jar Mixer Grinder' },
  { category: 'Mixer', article: '640137', rdArticle: '494338633', description: 'MR GrindPro Maxx 1000W MG' },

  // FP
  { category: 'FP', article: '640098', rdArticle: '491892000', description: 'Icon Superb Food Processor' },

  // HB
  { category: 'HB', article: '640133', rdArticle: '494226825', description: 'Pronto Plus' },
  { category: 'HB', article: '640099', rdArticle: '491581689', description: '640099 MR HB-PRONTO ULTRA' },

  // Toaster
  { category: 'Toaster', article: '370067', rdArticle: '494226823', description: 'AT 205' },

  // Air Fryer
  { category: 'Air Fryer', article: '510056', rdArticle: '494226706', description: '5L Digital Air Fryer BL' },

  // OTG
  { category: 'OTG', article: '510057', rdArticle: '494338634', description: 'MR OTG 29 RCAD DIGI' },
  { category: 'OTG', article: '510062', rdArticle: '494404939', description: '20R' },
  { category: 'OTG', article: '510035', rdArticle: '492911243', description: 'OTG 60 RCSS' },

  // MWO
  { category: 'MWO', article: '790008', rdArticle: '491934215', description: 'Microwave Oven - 20MS' },

  // Irons
  { category: 'Irons', article: '500045', rdArticle: '490917545', description: 'Inspira dry iron' },
  { category: 'Irons', article: '500071', rdArticle: '491581690', description: 'Ultra Glide Steam Iron - 1600W' },
  { category: 'Irons', article: '500072', rdArticle: '491186076', description: 'Super Glide Steam Iron - 2000W' }
];

export const generateMonthlyExcelReport = async (
  user: UserProfile,
  adjustedData: Record<string, Record<number, number>>,
  monthDate: Date,
  sales?: DailyReport[]
) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Fallback to fetch sales records if not provided directly
  let allSales: DailyReport[] = sales || [];
  if (!allSales || allSales.length === 0) {
    try {
      const { getSalesWithoutImages } = await import('./storageService');
      allSales = await getSalesWithoutImages();
    } catch {
      allSales = [];
    }
  }

  const workbook = new ExcelJS.Workbook();

  const createSheet = (brand: 'Bajaj' | 'Morphy Richards', products: ProductItem[]) => {
    const sheetName = brand === 'Bajaj' ? 'Bajaj' : 'Morphy Richards';
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }]
    });

    // Column widths matching exact template:
    // 1: Category, 2: Bajaj Article, 3: RD Article, 4: Brand, 5: Article Description, 6: Target Qty, 7-37: Days 1-31, 38: Total Qty / Remarks
    ws.columns = [
      { width: 18 }, // A: Category
      { width: 14 }, // B: Bajaj Article
      { width: 14 }, // C: RD Article
      { width: 16 }, // D: Brand
      { width: 44 }, // E: Article Description
      { width: 12 }, // F: Target Qty
      ...Array.from({ length: 31 }, () => ({ width: 4.5 })), // G-AK: Days 1 to 31 (cols 7 to 37)
      { width: 34 }  // AL: Total Qty / Remarks (col 38)
    ];

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: '000000' } },
      left: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: '000000' } },
      bottom: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: '000000' } },
      right: { style: 'thin' as ExcelJS.BorderStyle, color: { argb: '000000' } }
    };

    // --- Header Row 1 ---
    const row1 = ws.addRow([
      'ISP Name',
      user.name || '',
      '',
      user.storeName || '',
      user.storeNameAndLocation || '',
      'Target Qty'
    ]);
    row1.height = 25;
    row1.getCell(7).value = 'Bajaj ISP Monthly Target Sheet | Reliance Digital';
    row1.getCell(38).value = 'Reporting LAS: ' + (user.storeCode || 'RRL');

    // --- Header Row 2 ---
    const row2 = ws.addRow([
      'Month',
      monthName,
      '',
      user.tlName || 'Basavaraj Patil',
      '',
      user.monthlyTarget ? user.monthlyTarget.toLocaleString('en-IN') : ''
    ]);
    row2.height = 25;
    row2.getCell(7).value = 'Date';
    row2.getCell(38).value = 'Manager Remarks: ' + (user.tlName || 'Basavaraj Patil');

    // --- Header Row 3 ---
    const headers = [
      'Category',
      'Bajaj Article',
      'RD Article',
      brand === 'Bajaj' ? 'Bajaj' : 'Morphy Richards',
      'Article Description',
      'Target Qty'
    ];
    for (let i = 1; i <= 31; i++) headers.push(i.toString());
    headers.push('Total Qty / Remarks');
    const row3 = ws.addRow(headers);
    row3.height = 25;

    // Apply borders across all header cells
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 38; c++) {
        ws.getCell(r, c).border = borderStyle;
      }
    }

    // Header Merges matching official template
    ws.mergeCells('B1:C1'); // ISP Name value
    ws.mergeCells('B2:C2'); // Month value
    ws.mergeCells('G1:AK1'); // Title across dates
    ws.mergeCells('G2:AK2'); // Date label across dates

    const setCell = (ref: string, bold: boolean, horiz: ExcelJS.Alignment['horizontal'], size = 10) => {
      const cell = ws.getCell(ref);
      cell.font = { bold: bold, size: size };
      cell.alignment = { vertical: 'middle', horizontal: horiz, wrapText: false };
    };

    setCell('A1', true, 'left');
    setCell('B1', false, 'left');
    setCell('D1', true, 'left');
    setCell('E1', true, 'left');
    setCell('F1', true, 'center');
    setCell('G1', true, 'center', 11);
    setCell('AL1', true, 'center', 10);

    setCell('A2', true, 'left');
    setCell('B2', false, 'left');
    setCell('D2', true, 'left');
    setCell('F2', true, 'center');
    setCell('G2', true, 'center', 10);
    setCell('AL2', true, 'center', 10);

    for (let c = 1; c <= 38; c++) {
      ws.getCell(3, c).font = { bold: true, size: 10 };
      ws.getCell(3, c).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    ws.getCell('E3').alignment = { vertical: 'middle', horizontal: 'left' };

    let currentRow = 4;
    let currentCategory = '';
    let categoryStartRow = 4;

    let grandTotalQty = 0;
    let grandTotalValue = 0;
    const dailyTotals: number[] = Array(32).fill(0);

    products.forEach((product, index) => {
      // Calculate total quantity sold for this product across the month
      let productQty = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        const q = adjustedData[product.description]?.[i] || 0;
        productQty += q;
        dailyTotals[i] += q;
      }
      grandTotalQty += productQty;

      // Calculate total value of sold product based on recorded sales
      let unitPrice = 0;
      let recordedProductValue = 0;
      let recordedProductQty = 0;

      if (allSales && allSales.length > 0) {
        const matchingSales = allSales.flatMap(s => s.items || []).filter(item => {
          if (!item || !item.productName) return false;
          const pName = item.productName.trim().toLowerCase();
          const desc = product.description.trim().toLowerCase();
          return pName === desc || pName.includes(desc) || desc.includes(pName);
        });

        if (matchingSales.length > 0) {
          recordedProductQty = matchingSales.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
          recordedProductValue = matchingSales.reduce(
            (sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)),
            0
          );
          if (recordedProductQty > 0) {
            unitPrice = recordedProductValue / recordedProductQty;
          } else if (Number(matchingSales[0].price) > 0) {
            unitPrice = Number(matchingSales[0].price);
          }
        }
      }

      let productValue = 0;
      if (productQty > 0) {
        if (productQty === recordedProductQty && recordedProductValue > 0) {
          productValue = recordedProductValue;
        } else if (unitPrice > 0) {
          productValue = productQty * unitPrice;
        } else if (recordedProductValue > 0) {
          productValue = recordedProductValue;
        }
      }
      grandTotalValue += productValue;

      // Remarks text:
      let remarksText = '';
      if (productQty > 0) {
        if (productValue > 0) {
          remarksText = `Total Qty: ${productQty} | Total Value: ₹${Math.round(productValue).toLocaleString('en-IN')}`;
        } else {
          remarksText = `Total Qty: ${productQty}`;
        }
      }

      const rowData: (string | number)[] = [
        product.category,
        product.article,
        product.rdArticle,
        brand === 'Bajaj' ? 'Bajaj' : 'Morphy Richards',
        product.description,
        ''
      ];

      for (let i = 1; i <= 31; i++) {
        if (i <= daysInMonth) {
          const qty = adjustedData[product.description]?.[i] || 0;
          rowData.push(qty > 0 ? qty : '');
        } else {
          rowData.push('');
        }
      }
      rowData.push(remarksText);

      const row = ws.addRow(rowData);
      row.height = 20;

      for (let i = 1; i <= 38; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle;
        if (i === 5) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (i === 38) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (remarksText) {
            cell.font = { bold: true, size: 9 };
          }
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }

      // Merge category cells vertically for grouped look as shown in PDF
      if (product.category !== currentCategory) {
        if (currentCategory !== '' && currentRow - 1 > categoryStartRow) {
          ws.mergeCells(categoryStartRow, 1, currentRow - 1, 1);
          ws.getCell(categoryStartRow, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
        currentCategory = product.category;
        categoryStartRow = currentRow;
      }

      if (index === products.length - 1 && currentRow > categoryStartRow) {
        ws.mergeCells(categoryStartRow, 1, currentRow, 1);
        ws.getCell(categoryStartRow, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      currentRow++;
    });

    // Add Total Qty summary row at the bottom (matching PDF layout: Total Qty 0)
    const totalRowData: (string | number)[] = [
      'Total Qty',
      '',
      '',
      '',
      '',
      ''
    ];
    for (let i = 1; i <= 31; i++) {
      if (i <= daysInMonth) {
        const dTot = dailyTotals[i];
        totalRowData.push(dTot > 0 ? dTot : '');
      } else {
        totalRowData.push('');
      }
    }

    const totalRemarks = grandTotalQty > 0
      ? (grandTotalValue > 0
          ? `Total Qty: ${grandTotalQty} | Total Value: ₹${Math.round(grandTotalValue).toLocaleString('en-IN')}`
          : `Total Qty: ${grandTotalQty}`)
      : '0';
    totalRowData.push(totalRemarks);

    const totalRow = ws.addRow(totalRowData);
    totalRow.height = 24;

    for (let i = 1; i <= 38; i++) {
      const cell = totalRow.getCell(i);
      cell.border = borderStyle;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };
      if (i === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (i === 38) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }

    // Merge Total Qty across first 5 columns for clean summary look
    ws.mergeCells(`A${currentRow}:E${currentRow}`);
    ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  };

  createSheet('Bajaj', BAJAJ_PRODUCTS);
  createSheet('Morphy Richards', MR_PRODUCTS);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Monthly_Report_${monthName.replace(' ', '_')}.xlsx`);
};
