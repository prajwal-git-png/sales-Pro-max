import { DailyReport, UserProfile, Complaint, SaleItem, StoreEODEntry, AttendanceEntry, FollowUp } from '../types';

const DB_NAME = 'SalesTrackDB';
const DB_VERSION = 4; // Incremented version
const STORES = {
  SALES: 'sales',
  EOD: 'eod',
  CRM: 'crm',
  ATTENDANCE: 'attendance',
  IMAGES: 'images',
  FOLLOWUPS: 'followups'
};

const LS_KEYS = {
  USER: 'app_user_profile',
  THEME: 'app_theme_mode',
};

// --- IndexedDB Wrapper ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      const transaction = event.currentTarget.transaction;
      
      if (!db.objectStoreNames.contains(STORES.SALES)) db.createObjectStore(STORES.SALES, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(STORES.EOD)) db.createObjectStore(STORES.EOD, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(STORES.CRM)) db.createObjectStore(STORES.CRM, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(STORES.IMAGES)) db.createObjectStore(STORES.IMAGES, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(STORES.FOLLOWUPS)) db.createObjectStore(STORES.FOLLOWUPS, { keyPath: 'id' });

      if (event.oldVersion < 3) {
        if (db.objectStoreNames.contains(STORES.SALES)) {
          const salesStore = transaction.objectStore(STORES.SALES);
          const imagesStore = transaction.objectStore(STORES.IMAGES);
          
          salesStore.openCursor().onsuccess = (e: any) => {
            const cursor = e.target.result;
            if (cursor) {
              const sale = cursor.value;
              const images = sale.billImages || (sale.billImage ? [sale.billImage] : []);
              if (images.length > 0) {
                imagesStore.put({ date: sale.date, images });
              }
              delete sale.billImages;
              delete sale.billImage;
              cursor.update(sale);
              cursor.continue();
            }
          };
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFromStore = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
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
export const getSalesWithoutImages = async (): Promise<DailyReport[]> => {
  return getAllFromStore<DailyReport>(STORES.SALES);
};

export const getSalesByMonth = async (monthPrefix: string): Promise<DailyReport[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SALES, 'readonly');
    const store = transaction.objectStore(STORES.SALES);
    const request = store.openCursor();
    const results: DailyReport[] = [];

    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.date.startsWith(monthPrefix)) {
          results.push(cursor.value);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getSales = (): Promise<DailyReport[]> => getAllFromStore<DailyReport>(STORES.SALES);

export const getImagesForDate = async (date: string): Promise<string[]> => {
  const record = await getFromStore<{date: string, images: string[]}>(STORES.IMAGES, date);
  return record?.images || [];
};

export const saveSaleEntry = async (date: string, newItems: SaleItem[], newBillImages: string[] = []) => {
  const existing = await getFromStore<DailyReport>(STORES.SALES, date);
  const existingImagesRecord = await getFromStore<{date: string, images: string[]}>(STORES.IMAGES, date);

  const calculateTotals = (items: SaleItem[]) => ({
    totalQty: items.reduce((acc, item) => acc + item.quantity, 0),
    totalValue: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  });

  const existingImages = existingImagesRecord?.images || [];
  const mergedImages = [...existingImages, ...newBillImages];

  if (mergedImages.length > 0) {
    await putToStore(STORES.IMAGES, { date, images: mergedImages });
  }

  if (existing) {
    const updatedItems = [...existing.items, ...newItems];
    const { totalQty, totalValue } = calculateTotals(updatedItems);

    const reportToSave = {
      ...existing,
      items: updatedItems,
      totalQty,
      totalValue,
    };
    delete reportToSave.billImages;
    delete reportToSave.billImage;

    await putToStore(STORES.SALES, reportToSave);
  } else {
    const { totalQty, totalValue } = calculateTotals(newItems);
    const reportToSave: DailyReport = {
      date,
      items: newItems,
      totalQty,
      totalValue,
    };
    await putToStore(STORES.SALES, reportToSave);
  }
};

export const updateDailyReport = async (date: string, updatedReport: DailyReport) => {
  const reportToSave = { ...updatedReport };
  if (reportToSave.billImages !== undefined) {
    await putToStore(STORES.IMAGES, { date, images: reportToSave.billImages });
    delete reportToSave.billImages;
    delete reportToSave.billImage;
  }
  await putToStore(STORES.SALES, reportToSave);
};

export const deleteDailyReport = async (date: string) => {
  await deleteFromStore(STORES.SALES, date);
  await deleteFromStore(STORES.IMAGES, date);
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

// --- FollowUps ---
export const getFollowUps = (): Promise<FollowUp[]> => getAllFromStore<FollowUp>(STORES.FOLLOWUPS);
export const saveFollowUp = async (followUp: FollowUp) => {
  await putToStore(STORES.FOLLOWUPS, followUp);
};
export const updateFollowUp = async (updated: FollowUp) => {
  await putToStore(STORES.FOLLOWUPS, updated);
};
export const deleteFollowUp = async (id: string) => {
  await deleteFromStore(STORES.FOLLOWUPS, id);
};

// --- Attendance ---
export const getAttendance = (): Promise<AttendanceEntry[]> => getAllFromStore<AttendanceEntry>(STORES.ATTENDANCE);
export const saveAttendance = async (entry: AttendanceEntry) => {
  await putToStore(STORES.ATTENDANCE, entry);
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
    attendance?: AttendanceEntry[];
    followups?: FollowUp[];
    theme: string;
  }
}

export const exportFullBackup = async (): Promise<void> => {
  try {
    const user = getUser();
    const eod = await getEODEntries();
    const crm = await getComplaints();
    const attendance = await getAttendance();
    const followups = await getFollowUps();
    const theme = localStorage.getItem(LS_KEYS.THEME) || 'light';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `SalesTrack_Backup_${timestamp}.json`;

    const db = await openDB();
    const salesKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const transaction = db.transaction(STORES.SALES, 'readonly');
        const request = transaction.objectStore(STORES.SALES).getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const parts: BlobPart[] = [];
    parts.push(`{"app":"SalesTrack","version":"8.0.0","timestamp":"${new Date().toISOString()}","data":{"user":${JSON.stringify(user)},"theme":"${theme}","eod":${JSON.stringify(eod)},"crm":${JSON.stringify(crm)},"attendance":${JSON.stringify(attendance)},"followups":${JSON.stringify(followups)},"sales":[`);
    
    let isFirst = true;
    for (const key of salesKeys) {
        const sale = await getFromStore<DailyReport>(STORES.SALES, key as string);
        if (sale) {
            const imgRec = await getFromStore<{date: string, images: string[]}>(STORES.IMAGES, key as string);
            sale.billImages = imgRec?.images || [];
            if (!isFirst) parts.push(',');
            parts.push(JSON.stringify(sale));
            isFirst = false;
        }
    }
    
    parts.push(`]}}`);

    const blob = new Blob(parts, { type: 'application/json' });

    // Try sharing first on mobile
    if (navigator.canShare) {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: filename,
                    text: 'SalesTrack Full Backup'
                });
                return;
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed', err);
                } else {
                    return; // user cancelled share
                }
            }
        }
    }

    // Try streaming if supported (Desktop Chrome/Edge)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'JSON File', accept: {'application/json': ['.json']} }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Streaming backup failed, falling back to Blob', err);
            } else {
                return; // User cancelled
            }
        }
    }

    // Fallback to Blob download (Desktop Safari / old browsers)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error("Backup failed", error);
    throw error;
  }
};

export const importFullBackup = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.app !== 'SalesTrack' || !parsed.data) {
      return { success: false, message: 'Invalid file format.' };
    }
    const { user, sales, eod, crm, attendance, followups, theme } = parsed.data;
    
    // Clear all
    localStorage.removeItem(LS_KEYS.USER);
    await clearStore(STORES.SALES);
    await clearStore(STORES.EOD);
    await clearStore(STORES.CRM);
    await clearStore(STORES.ATTENDANCE);
    await clearStore(STORES.FOLLOWUPS);
    await clearStore(STORES.IMAGES);

    if (user) saveUser(user);
    if (sales) {
        for (const s of sales) {
            const images = s.billImages || (s.billImage ? [s.billImage] : []);
            if (images.length > 0) {
                await putToStore(STORES.IMAGES, { date: s.date, images });
            }
            delete s.billImages;
            delete s.billImage;
            await putToStore(STORES.SALES, s);
        }
    }
    if (eod) for (const e of eod) await putToStore(STORES.EOD, e);
    if (crm) for (const c of crm) await putToStore(STORES.CRM, c);
    if (attendance) for (const a of attendance) await putToStore(STORES.ATTENDANCE, a);
    if (followups) for (const f of followups) await putToStore(STORES.FOLLOWUPS, f);
    if (theme) saveTheme(theme as 'light' | 'dark');

    return { success: true, message: 'Backup restored successfully!' };
  } catch (e: any) {
    return { success: false, message: `Restore failed: ${e.message}` };
  }
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Free memory
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Compress to 50% quality JPEG
        resolve(dataUrl);
      } else {
        // Fallback if canvas context fails
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      }
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    
    img.src = objectUrl;
  });
};
