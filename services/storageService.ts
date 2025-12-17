import { DailyReport, UserProfile, Complaint, SaleItem, StoreEODEntry } from '../types';

const KEYS = {
  USER: 'app_user_profile',
  SALES: 'app_sales_data',
  EOD: 'app_eod_data',
  CRM: 'app_crm_data',
  THEME: 'app_theme_mode',
};

// --- Helpers ---
const getJSON = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return null;
  }
};

const setJSON = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
    alert('Storage full! Please clear some data or old images.');
  }
};

// --- User ---
export const getUser = (): UserProfile | null => getJSON<UserProfile>(KEYS.USER);
export const saveUser = (user: UserProfile) => setJSON(KEYS.USER, user);
export const logoutUser = () => {
    localStorage.removeItem(KEYS.USER);
};

// --- Sales (Detailed Brand Sales) ---
export const getSales = (): DailyReport[] => getJSON<DailyReport[]>(KEYS.SALES) || [];

export const saveSaleEntry = (date: string, newItems: SaleItem[], newBillImages: string[] = []) => {
  const sales = getSales();
  const existingIndex = sales.findIndex((s) => s.date === date);

  const calculateTotals = (items: SaleItem[]) => ({
    totalQty: items.reduce((acc, item) => acc + item.quantity, 0),
    totalValue: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  });

  if (existingIndex > -1) {
    const existing = sales[existingIndex];
    const updatedItems = [...existing.items, ...newItems];
    const { totalQty, totalValue } = calculateTotals(updatedItems);
    const existingImages = existing.billImages || (existing.billImage ? [existing.billImage] : []);
    const mergedImages = [...existingImages, ...newBillImages];

    sales[existingIndex] = {
      ...existing,
      items: updatedItems,
      totalQty,
      totalValue,
      billImages: mergedImages,
      billImage: undefined,
    };
  } else {
    const { totalQty, totalValue } = calculateTotals(newItems);
    sales.push({
      date,
      items: newItems,
      totalQty,
      totalValue,
      billImages: newBillImages,
    });
  }
  setJSON(KEYS.SALES, sales);
};

export const updateDailyReport = (date: string, updatedReport: DailyReport) => {
    const sales = getSales();
    const index = sales.findIndex(s => s.date === date);
    if (index > -1) {
        sales[index] = updatedReport;
        setJSON(KEYS.SALES, sales);
    }
};

export const deleteDailyReport = (date: string) => {
    const sales = getSales();
    const filtered = sales.filter(s => s.date !== date);
    setJSON(KEYS.SALES, filtered);
};

// --- Store EOD (Manual Store Achievement) ---
export const getEODEntries = (): StoreEODEntry[] => getJSON<StoreEODEntry[]>(KEYS.EOD) || [];

export const saveEODEntry = (entry: StoreEODEntry) => {
    const entries = getEODEntries();
    const index = entries.findIndex(e => e.date === entry.date);
    if (index > -1) {
        entries[index] = entry;
    } else {
        entries.push(entry);
    }
    setJSON(KEYS.EOD, entries);
};

export const deleteEODEntry = (date: string) => {
    const entries = getEODEntries();
    const filtered = entries.filter(e => e.date !== date);
    setJSON(KEYS.EOD, filtered);
};

// --- CRM ---
export const getComplaints = (): Complaint[] => getJSON<Complaint[]>(KEYS.CRM) || [];
export const saveComplaint = (complaint: Complaint) => {
  const list = getComplaints();
  list.unshift(complaint);
  setJSON(KEYS.CRM, list);
};
export const updateComplaint = (updated: Complaint) => {
    const list = getComplaints();
    const index = list.findIndex(c => c.id === updated.id);
    if (index > -1) {
        list[index] = updated;
        setJSON(KEYS.CRM, list);
    }
}

// --- Theme ---
export const getTheme = (): 'light' | 'dark' => (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light';
export const saveTheme = (theme: 'light' | 'dark') => localStorage.setItem(KEYS.THEME, theme);

// --- Backup & Restore ---
export const exportFullBackup = () => {
  const backup = {
    version: '5.2.0',
    exportDate: new Date().toISOString(),
    user: getJSON(KEYS.USER),
    sales: getJSON(KEYS.SALES) || [],
    eod: getJSON(KEYS.EOD) || [],
    crm: getJSON(KEYS.CRM) || [],
    theme: localStorage.getItem(KEYS.THEME) || 'light'
  };
  return JSON.stringify(backup, null, 2);
};

export const importFullBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.user && !data.sales) throw new Error("Invalid backup format");

    if (data.user) setJSON(KEYS.USER, data.user);
    if (data.sales) setJSON(KEYS.SALES, data.sales);
    if (data.eod) setJSON(KEYS.EOD, data.eod);
    if (data.crm) setJSON(KEYS.CRM, data.crm);
    if (data.theme) localStorage.setItem(KEYS.THEME, data.theme);
    
    return true;
  } catch (e) {
    console.error("Restore failed", e);
    return false;
  }
};

// --- Utils ---
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 1024 / img.width;
                const width = scale < 1 ? 1024 : img.width;
                const height = scale < 1 ? img.height * scale : img.height;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.onerror = error => reject(error);
    });
};