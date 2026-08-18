import { DailyReport, UserProfile, Complaint, SaleItem, StoreEODEntry, AttendanceEntry, FollowUp } from '../types';
import { db, auth, logoutFirebase } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const LS_KEYS = {
  USER: 'app_user_profile',
  THEME: 'app_theme_mode',
  STORE_PREFIX: 'salestrack_store_',
};

export const getUser = (): UserProfile | null => {
  try {
    const item = localStorage.getItem(LS_KEYS.USER);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const getUid = () => {
  return auth.currentUser?.uid || getUser()?.uid || 'local_user';
};

const getDocId = (key: string, storeName?: string) => {
  return storeName === 'users' ? key : `${getUid()}_${key}`;
};

// Local storage backup helpers
const getLocalKey = (storeName: string, key: string) => `${LS_KEYS.STORE_PREFIX}${storeName}_${getUid()}_${key}`;
const getLocalCollectionKey = (storeName: string) => `${LS_KEYS.STORE_PREFIX}${storeName}_${getUid()}_all`;

const getLocalItem = <T>(storeName: string, key: string): T | undefined => {
  try {
    const item = localStorage.getItem(getLocalKey(storeName, key));
    return item ? JSON.parse(item) : undefined;
  } catch {
    return undefined;
  }
};

const setLocalItem = <T>(storeName: string, key: string, data: T): void => {
  try {
    localStorage.setItem(getLocalKey(storeName, key), JSON.stringify(data));
    // Also maintain list in all
    const all = getLocalAll<T>(storeName);
    const idKey = (data as any)?.date || (data as any)?.id || key;
    const existingIndex = all.findIndex((i: any) => (i?.date || i?.id || i?.uid) === idKey);
    if (existingIndex >= 0) {
      all[existingIndex] = data;
    } else {
      all.push(data);
    }
    localStorage.setItem(getLocalCollectionKey(storeName), JSON.stringify(all));
  } catch (e) {
    console.error("setLocalItem error", e);
  }
};

const removeLocalItem = (storeName: string, key: string): void => {
  try {
    localStorage.removeItem(getLocalKey(storeName, key));
    const all = getLocalAll(storeName);
    const filtered = all.filter((i: any) => (i?.date || i?.id || i?.uid) !== key);
    localStorage.setItem(getLocalCollectionKey(storeName), JSON.stringify(filtered));
  } catch (e) {
    console.error("removeLocalItem error", e);
  }
};

const getLocalAll = <T>(storeName: string): T[] => {
  try {
    const item = localStorage.getItem(getLocalCollectionKey(storeName));
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

export const getFromStore = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const localVal = getLocalItem<T>(storeName, key);
  const uid = auth.currentUser?.uid;
  if (!uid) return localVal;

  try {
    const docRef = doc(db, storeName, getDocId(key, storeName));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as T;
      setLocalItem(storeName, key, data);
      return data;
    }
    return localVal;
  } catch (e) {
    console.warn("getFromStore cloud fallback to local", e);
    return localVal;
  }
};

const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const localList = getLocalAll<T>(storeName);
  const uid = auth.currentUser?.uid;
  if (!uid) return localList;

  try {
    const q = query(collection(db, storeName), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const cloudData = querySnapshot.docs.map(doc => doc.data() as T);
      try {
        localStorage.setItem(getLocalCollectionKey(storeName), JSON.stringify(cloudData));
      } catch {}
      return cloudData;
    }
    return localList;
  } catch (e) {
    console.warn("getAllFromStore cloud fallback to local", e);
    return localList;
  }
};

const putToStore = async <T>(storeName: string, key: string, data: T): Promise<void> => {
  const uid = getUid();
  const payload = { ...data, userId: uid };
  setLocalItem(storeName, key, payload);

  if (auth.currentUser?.uid) {
    try {
      const docRef = doc(db, storeName, getDocId(key, storeName));
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn("putToStore cloud save failed, saved locally", e);
    }
  }
};

const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  removeLocalItem(storeName, key);
  if (auth.currentUser?.uid) {
    try {
      await deleteDoc(doc(db, storeName, getDocId(key, storeName)));
    } catch (e) {
      console.warn("deleteFromStore cloud delete failed", e);
    }
  }
};

export const saveUser = (user: UserProfile) => {
  try {
    localStorage.setItem(LS_KEYS.USER, JSON.stringify(user));
    if (user.uid) {
      putToStore('users', user.uid, { ...user, email: auth.currentUser?.email || user.email || '' });
    }
  } catch (e) {
    console.error("saveUser error", e);
  }
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem(LS_KEYS.USER);
    await logoutFirebase();
  } catch (e) {
    console.error("logoutUser error", e);
  }
};

export const getTheme = (): 'light' | 'dark' => {
  try {
    return (localStorage.getItem(LS_KEYS.THEME) as 'light' | 'dark') || 'light';
  } catch {
    return 'light';
  }
};

export const saveTheme = (theme: 'light' | 'dark') => {
  try {
    localStorage.setItem(LS_KEYS.THEME, theme);
  } catch {}
};

export const getSalesWithoutImages = async (): Promise<DailyReport[]> => {
  return getAllFromStore<DailyReport>('sales');
};

export const getSalesByMonth = async (monthPrefix: string): Promise<DailyReport[]> => {
  const allSales = await getSalesWithoutImages();
  return allSales.filter(s => s.date.startsWith(monthPrefix));
};

export const getSales = (): Promise<DailyReport[]> => getAllFromStore<DailyReport>('sales');

export const getImagesForDate = async (date: string): Promise<string[]> => {
  const record = await getFromStore<{date: string, images: string[]}>('images', date);
  return record?.images || [];
};

export const saveSaleEntry = async (date: string, newItems: SaleItem[], newBillImages: string[] = []) => {
  const existing = await getFromStore<DailyReport>('sales', date);
  const existingImagesRecord = await getFromStore<{date: string, images: string[]}>('images', date);

  const calculateTotals = (items: SaleItem[]) => ({
    totalQty: items.reduce((acc, item) => acc + item.quantity, 0),
    totalValue: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  });

  const existingImages = existingImagesRecord?.images || [];
  const mergedImages = [...existingImages, ...newBillImages];

  if (mergedImages.length > 0) {
    await putToStore('images', date, { date, images: mergedImages });
  }

  if (existing) {
    const updatedItems = [...(existing.items || []), ...newItems];
    const { totalQty, totalValue } = calculateTotals(updatedItems);
    const reportToSave: DailyReport = {
      ...existing,
      items: updatedItems,
      totalQty,
      totalValue,
    };
    delete reportToSave.billImages;
    delete reportToSave.billImage;
    await putToStore('sales', date, reportToSave);
  } else {
    const { totalQty, totalValue } = calculateTotals(newItems);
    const reportToSave: DailyReport = {
      date,
      items: newItems,
      totalQty,
      totalValue,
    };
    await putToStore('sales', date, reportToSave);
  }
};

export const updateDailyReport = async (date: string, updatedReport: DailyReport) => {
  const reportToSave = { ...updatedReport };
  if (reportToSave.billImages !== undefined) {
    await putToStore('images', date, { date, images: reportToSave.billImages });
    delete reportToSave.billImages;
    delete reportToSave.billImage;
  }
  await putToStore('sales', date, reportToSave);
};

export const deleteDailyReport = async (date: string) => {
  await deleteFromStore('sales', date);
  await deleteFromStore('images', date);
};

export const getEODEntries = (): Promise<StoreEODEntry[]> => getAllFromStore<StoreEODEntry>('eod');
export const saveEODEntry = async (entry: StoreEODEntry) => {
  await putToStore('eod', entry.date, entry);
};
export const deleteEODEntry = async (date: string) => {
  await deleteFromStore('eod', date);
};

export const getComplaints = (): Promise<Complaint[]> => getAllFromStore<Complaint>('crm');
export const saveComplaint = async (complaint: Complaint) => {
  await putToStore('crm', complaint.id, complaint);
};
export const updateComplaint = async (updated: Complaint) => {
  await putToStore('crm', updated.id, updated);
};

export const getFollowUps = (): Promise<FollowUp[]> => getAllFromStore<FollowUp>('followups');
export const saveFollowUp = async (followUp: FollowUp) => {
  await putToStore('followups', followUp.id, followUp);
};
export const updateFollowUp = async (updated: FollowUp) => {
  await putToStore('followups', updated.id, updated);
};
export const deleteFollowUp = async (id: string) => {
  await deleteFromStore('followups', id);
};

export const getAttendance = (): Promise<AttendanceEntry[]> => getAllFromStore<AttendanceEntry>('attendance');
export const saveAttendance = async (entry: AttendanceEntry) => {
  await putToStore('attendance', entry.date, entry);
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      } else {
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

export const exportFullBackup = async (): Promise<void> => {
  console.log("Export backed up by Firestore and local storage.");
};

export interface BackupPackage {
  app: string;
  version: string;
  timestamp: string;
  data: any;
}

export const importFullBackup = async (_jsonString: string): Promise<{ success: boolean; message: string }> => {
  return { success: false, message: 'Restore disabled in cloud mode.' };
};
