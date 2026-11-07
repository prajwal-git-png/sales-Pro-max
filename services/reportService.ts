
import { DailyReport, UserProfile } from "../types";

export const formatToDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatMonthlyTarget = (target?: number): string => {
  if (!target || target <= 0) return '5lk';
  if (target >= 100000) {
    const lk = target / 100000;
    return lk % 1 === 0 ? `${lk}lk` : `${Number(lk.toFixed(2))}lk`;
  }
  if (target >= 1000) {
    const k = target / 1000;
    return k % 1 === 0 ? `${k}k` : `${Number(k.toFixed(1))}k`;
  }
  if (target > 0 && target <= 100) {
    return `${target}lk`;
  }
  return target.toLocaleString('en-IN');
};

export const isMorphyProduct = (productName?: string): boolean => {
  if (!productName) return false;
  const name = productName.trim().toLowerCase();

  // Explicit Morphy or MR markers
  if (name.includes('morphy') || name.includes('m.r.') || name.includes('m.r ')) return true;
  if (/\bmr\b/.test(name) || /\bmr[.\-_\s]/.test(name) || name.startsWith('mr')) return true;

  // Morphy Richards official catalogue product names / keywords
  const morphyKeywords = [
    'tresta',
    'tetragrind',
    'grindpro',
    'icon superb',
    'pronto',
    'at 205',
    'at205',
    'air fryer',
    'rcad',
    'rcss',
    '20ms',
    '20mws',
    'inspira',
    'ultra glide',
    'super glide',
    '20r',
  ];

  if (morphyKeywords.some(kw => name.includes(kw))) {
    return true;
  }

  // Morphy-exclusive appliance lines in this distribution
  if ((name.includes('otg') || name.includes('microwave') || name.includes('mwo')) && !name.includes('bajaj')) {
    return true;
  }

  return false;
};

export const isInstantGeyser = (productName?: string): boolean => {
  if (!productName) return false;
  const name = productName.trim().toLowerCase();

  // Instant explicit
  if (name.includes('instant') && (name.includes('geyser') || name.includes('water heater') || name.includes('heater') || name.includes('wh'))) {
    return true;
  }
  if (name.includes('instant geyser') || name.includes('instant water heater')) {
    return true;
  }
  // Common instant models in Bajaj
  if ((name.includes('aerono') || name.includes('majesty') || name.includes('flora')) && 
      (name.includes('3l') || name.includes('1l') || name.includes('3kw') || name.includes('instant'))) {
    return true;
  }
  if (name.includes('instant') && !name.includes('storage') && (name.includes('geyser') || name.includes('water heater') || name.includes('heater'))) {
    return true;
  }
  return false;
};

export const isStorageGeyser = (productName?: string): boolean => {
  if (!productName) return false;
  const name = productName.trim().toLowerCase();

  if (isInstantGeyser(name)) return false;

  // Storage explicit
  if (name.includes('storage') && (name.includes('geyser') || name.includes('water heater') || name.includes('heater') || name.includes('wh'))) {
    return true;
  }
  if (name.includes('storage geyser') || name.includes('storage water heater')) {
    return true;
  }
  // Recognized storage geyser models in Bajaj catalogue
  const storageKeywords = ['pentacle', 'newshakti', 'new shakti', 'calenta', 'popular', 'amora', 'panache', 'shield'];
  if (storageKeywords.some(kw => name.includes(kw))) {
    return true;
  }
  // Capacity markers for storage (10L, 15L, 25L, 35L, 50L, 6L)
  if ((name.includes('geyser') || name.includes('water heater') || name.includes('heater')) && 
      (name.includes('10l') || name.includes('15l') || name.includes('25l') || name.includes('35l') || name.includes('50l') || name.includes('6l'))) {
    return true;
  }
  // Generic geyser / water heater defaults to storage geyser
  if ((name.includes('geyser') || name.includes('water heater')) && !name.includes('instant')) {
    return true;
  }
  return false;
};

export interface GeyserSalesSummary {
  todayInstant: number;
  todayStorage: number;
  mtdInstant: number;
  mtdStorage: number;
}

export const calculateGeyserSales = (report: DailyReport, allSales: DailyReport[] = []): GeyserSalesSummary => {
  const currentMonth = new Date(report.date).getMonth();
  const currentYear = new Date(report.date).getFullYear();
  const salesList = (allSales && allSales.length > 0) ? allSales : [report];

  const mtdReports = salesList.filter(s => {
    if (!s || !s.date) return false;
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && d <= new Date(report.date);
  });

  if (!mtdReports.some(s => s.date === report.date)) {
    mtdReports.push(report);
  }

  let todayInstant = 0;
  let todayStorage = 0;

  if (!report.isWeekOff && Array.isArray(report.items)) {
    for (const item of report.items) {
      if (!item) continue;
      const qty = Number(item.quantity) || 0;
      if (isInstantGeyser(item.productName)) {
        todayInstant += qty;
      } else if (isStorageGeyser(item.productName)) {
        todayStorage += qty;
      }
    }
  }

  let mtdInstant = 0;
  let mtdStorage = 0;

  for (const s of mtdReports) {
    if (s.isWeekOff) continue;
    const sItems = Array.isArray(s.items) ? s.items : [];
    for (const item of sItems) {
      if (!item) continue;
      const qty = Number(item.quantity) || 0;
      if (isInstantGeyser(item.productName)) {
        mtdInstant += qty;
      } else if (isStorageGeyser(item.productName)) {
        mtdStorage += qty;
      }
    }
  }

  return { todayInstant, todayStorage, mtdInstant, mtdStorage };
};

export const generateTextReport = (user: UserProfile, report: DailyReport, allSales: DailyReport[] = []) => {
  const currentMonth = new Date(report.date).getMonth();
  const currentYear = new Date(report.date).getFullYear();

  const salesList = (allSales && allSales.length > 0) ? allSales : [report];

  const mtdReports = salesList.filter(s => {
    if (!s || !s.date) return false;
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && d <= new Date(report.date);
  });

  if (!mtdReports.some(s => s.date === report.date)) {
    mtdReports.push(report);
  }

  // Calculate Today's Sales
  let bajajToday = 0;
  let morphyToday = 0;

  if (!report.isWeekOff && Array.isArray(report.items)) {
    for (const item of report.items) {
      if (!item) continue;
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const val = qty * price;
      if (isMorphyProduct(item.productName)) {
        morphyToday += val;
      } else {
        bajajToday += val;
      }
    }
  }

  // Fallback if items was empty but totalValue was recorded
  if (!report.isWeekOff && bajajToday === 0 && morphyToday === 0 && (report.totalValue || 0) > 0) {
    bajajToday = report.totalValue;
  }

  // Calculate Month-To-Date (MTD) Sales
  let bajajMtd = 0;
  let morphyMtd = 0;

  for (const s of mtdReports) {
    if (s.isWeekOff) continue;
    const sItems = Array.isArray(s.items) ? s.items : [];
    let sBajaj = 0;
    let sMorphy = 0;
    for (const item of sItems) {
      if (!item) continue;
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const val = qty * price;
      if (isMorphyProduct(item.productName)) {
        sMorphy += val;
      } else {
        sBajaj += val;
      }
    }
    if (sBajaj === 0 && sMorphy === 0 && (s.totalValue || 0) > 0) {
      sBajaj = s.totalValue;
    }
    bajajMtd += sBajaj;
    morphyMtd += sMorphy;
  }

  const totalMtd = bajajMtd + morphyMtd;

  const geyserSales = calculateGeyserSales(report, allSales);

  const formatAmount = (val: number) => Number(val || 0).toLocaleString('en-IN');
  const dateStr = formatToDisplayDate(report.date);
  const storeLocation = user.storeNameAndLocation || user.storeName || '';
  const targetStr = formatMonthlyTarget(user.monthlyTarget);

  let text = ` Name: ${user.name || ''}\n`;
  text += `Date: ${dateStr}\n`;
  text += `Store location: ${storeLocation}\n\n`;
  text += `BAJAJ Today Sale: ${formatAmount(bajajToday)}\n`;
  text += `Morphy Today Sale : ${formatAmount(morphyToday)}\n\n`;
  text += `Total sale Bajaj: ${formatAmount(bajajMtd)}\n`;
  text += `Total sale Morphy: ${formatAmount(morphyMtd)}\n\n`;
  text += `Total MTD : ${formatAmount(totalMtd)}\n`;
  text += `This Month Target:${targetStr}\n\n`;
  text += `Instant geyser Qty: ${geyserSales.todayInstant}\n`;
  text += `Storage geyser Qty: ${geyserSales.todayStorage}\n`;
  text += `MTD instant geyser qty: ${geyserSales.mtdInstant}\n`;
  text += `MTD Storage gesyer Qty: ${geyserSales.mtdStorage}`;

  return text;
};

export const generateStoreEODReport = (
    user: UserProfile,
    date: string,
    dayTarget: number,
    dayAch: number,
    weekTarget: number,
    weekAch: number,
    eolTarget: number,
    eolAch: number
  ) => {
    // Format date DD/MM/YYYY
    const dateStr = formatToDisplayDate(date);
    
    // Get First Name
    const firstName = user.name.split(' ')[0];

    return `Date: ${dateStr}
Name:${firstName}
Brand:*BAJAJ* 
Day Target:${dayTarget}
Day achievement: ${dayAch}
Week Target : ${weekTarget}
Week achivement : ${weekAch}
Eol  target :${String(eolTarget).padStart(2, '0')}
Eol Achive :${String(eolAch).padStart(2, '0')}`;
  };

export const downloadCSV = (sales: DailyReport[]) => {
    const headers = ['Date', 'Product', 'Quantity', 'Unit Price', 'Total Value'];
    const rows: string[] = [];
    
    (sales || []).forEach(report => {
        (report?.items || []).forEach(item => {
            if (!item) return;
            rows.push([
                report.date || '',
                `"${(item.productName || '').replace(/"/g, '""')}"`, // Escape quotes
                (item.quantity || 0).toString(),
                (item.price || 0).toString(),
                ((item.quantity || 0) * (item.price || 0)).toString()
            ].join(','));
        });
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" + rows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
