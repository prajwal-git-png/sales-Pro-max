import { DailyReport, UserProfile, Complaint, SaleItem, StoreEODEntry } from '../types';

const DB_NAME = 'SalesTrackDB';
const DB_VERSION = 1;
const STORES = {
  SALES: 'sales',
  EOD: 'eod',
  CRM: 'crm'
};

const LS_KEYS = {
  USER: 'app_user_profile',
  THEME: 'app_theme_mode',
};

// --- IndexedDB Wrapper ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.SALES)) db.createObjectStore(STORES.SALES, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(STORES.EOD)) db.createObjectStore(STORES.EOD, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(STORES.CRM)) db.createObjectStore(STORES.CRM, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const putToStore = async <T>(storeName: string, data: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- User & Theme (Small data remains in LS for sync access) ---
export const getUser = (): UserProfile | null => {
  const item = localStorage.getItem(LS_KEYS.USER);
  return item ? JSON.parse(item) : null;
};
export const saveUser = (user: UserProfile) => {
  localStorage.setItem(LS_KEYS.USER, JSON.stringify(user));
};
export const logoutUser = () => {
  localStorage.removeItem(LS_KEYS.USER);
};

export const getTheme = (): 'light' | 'dark' => (localStorage.getItem(LS_KEYS.THEME) as 'light' | 'dark') || 'light';
export const saveTheme = (theme: 'light' | 'dark') => localStorage.setItem(LS_KEYS.THEME, theme);

// --- Sales ---
export const getSales = (): Promise<DailyReport[]> => getAllFromStore<DailyReport>(STORES.SALES);

export const saveSaleEntry = async (date: string, newItems: SaleItem[], newBillImages: string[] = []) => {
  const sales = await getSales();
  const existing = sales.find(s => s.date === date);

  const calculateTotals = (items: SaleItem[]) => ({
    totalQty: items.reduce((acc, item) => acc + item.quantity, 0),
    totalValue: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  });

  if (existing) {
    const updatedItems = [...existing.items, ...newItems];
    const { totalQty, totalValue } = calculateTotals(updatedItems);
    const existingImages = existing.billImages || (existing.billImage ? [existing.billImage] : []);
    const mergedImages = [...existingImages, ...newBillImages];

    await putToStore(STORES.SALES, {
      ...existing,
      items: updatedItems,
      totalQty,
      totalValue,
      billImages: mergedImages,
      billImage: undefined,
    });
  } else {
    const { totalQty, totalValue } = calculateTotals(newItems);
    await putToStore(STORES.SALES, {
      date,
      items: newItems,
      totalQty,
      totalValue,
      billImages: newBillImages,
    });
  }
};

export const updateDailyReport = async (date: string, updatedReport: DailyReport) => {
  await putToStore(STORES.SALES, updatedReport);
};

export const deleteDailyReport = async (date: string) => {
  await deleteFromStore(STORES.SALES, date);
};

// --- EOD ---
export const getEODEntries = (): Promise<StoreEODEntry[]> => getAllFromStore<StoreEODEntry>(STORES.EOD);
export const saveEODEntry = async (entry: StoreEODEntry) => {
  await putToStore(STORES.EOD, entry);
};
export const deleteEODEntry = async (date: string) => {
  await deleteFromStore(STORES.EOD, date);
};

// --- CRM ---
export const getComplaints = (): Promise<Complaint[]> => getAllFromStore<Complaint>(STORES.CRM);
export const saveComplaint = async (complaint: Complaint) => {
  await putToStore(STORES.CRM, complaint);
};
export const updateComplaint = async (updated: Complaint) => {
  await putToStore(STORES.CRM, updated);
};

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

export const exportFullBackup = async (): Promise<string> => {
  const packageData: BackupPackage = {
    app: 'SalesTrack',
    version: '7.0.0',
    timestamp: new Date().toISOString(),
    data: {
      user: getUser(),
      sales: await getSales(),
      eod: await getEODEntries(),
      crm: await getComplaints(),
      theme: localStorage.getItem(LS_KEYS.THEME) || 'light'
    }
  };
  return JSON.stringify(packageData);
};

export const importFullBackup = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.app !== 'SalesTrack' || !parsed.data) {
      return { success: false, message: 'Invalid file format.' };
    }
    const { user, sales, eod, crm, theme } = parsed.data;
    
    // Clear all
    localStorage.removeItem(LS_KEYS.USER);
    await clearStore(STORES.SALES);
    await clearStore(STORES.EOD);
    await clearStore(STORES.CRM);

    if (user) saveUser(user);
    if (sales) for (const s of sales) await putToStore(STORES.SALES, s);
    if (eod) for (const e of eod) await putToStore(STORES.EOD, e);
    if (crm) for (const c of crm) await putToStore(STORES.CRM, c);
    if (theme) saveTheme(theme as 'light' | 'dark');

    return { success: true, message: 'Backup restored successfully!' };
  } catch (e: any) {
    return { success: false, message: `Restore failed: ${e.message}` };
  }
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = error => reject(error);
  });
};
