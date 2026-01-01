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
    // If we hit quota, try to inform the user
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      alert('Local storage limit reached. Please delete old reports with many high-quality images to save more data.');
      throw new Error('Storage limit reached.');
    }
    throw e;
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
export interface BackupPackage {
  app: 'SalesTrack';
  version: string;
  timestamp: string;
  data: {
    user: UserProfile | null;
    sales: DailyReport[];
    eod: StoreEODEntry[];
    crm: Complaint[];
    theme: string;
  }
}

export const exportFullBackup = (): string => {
  const packageData: BackupPackage = {
    app: 'SalesTrack',
    version: '6.0.0',
    timestamp: new Date().toISOString(),
    data: {
      user: getJSON<UserProfile>(KEYS.USER),
      sales: getSales(),
      eod: getEODEntries(),
      crm: getComplaints(),
      theme: localStorage.getItem(KEYS.THEME) || 'light'
    }
  };
  return JSON.stringify(packageData);
};

export const importFullBackup = (jsonString: string): { success: boolean; message: string } => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.app !== 'SalesTrack' || !parsed.data) {
      return { success: false, message: 'Invalid file format. Please use a SalesTrack backup file.' };
    }
    const { user, sales, eod, crm, theme } = parsed.data;
    localStorage.clear();
    if (user) setJSON(KEYS.USER, user);
    if (sales) setJSON(KEYS.SALES, sales);
    if (eod) setJSON(KEYS.EOD, eod);
    if (crm) setJSON(KEYS.CRM, crm);
    if (theme) localStorage.setItem(KEYS.THEME, theme);
    return { success: true, message: 'Backup restored successfully!' };
  } catch (e: any) {
    console.error("Restore failed:", e);
    return { success: false, message: `Restore failed: ${e.message || 'Unknown error'}` };
  }
};

// --- Utils ---
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            // Instruciton: Don't compress image quality, use original size.
            // We directly return the data URL which is a Base64 representation of the original file.
            resolve(event.target?.result as string);
        };
        reader.onerror = error => reject(error);
    });
};