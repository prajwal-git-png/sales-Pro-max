import { DailyReport, UserProfile, Complaint, SaleItem, StoreEODEntry, AttendanceEntry, FollowUp } from '../types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const LS_KEYS = {
  USER: 'app_user_profile',
  THEME: 'app_theme_mode',
};

const getUid = () => auth.currentUser?.uid;

const getDocId = (key: string, storeName?: string) => storeName === 'users' ? key : `${getUid()}_${key}`;

export const getFromStore = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const uid = getUid();
  if (!uid) return undefined;
  try {
    const docRef = doc(db, storeName, getDocId(key, storeName));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return undefined;
  } catch (e) {
    console.error("getFromStore error", e);
    return undefined;
  }
};

const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const uid = getUid();
  if (!uid) return [];
  try {
    const q = query(collection(db, storeName), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  } catch (e) {
    console.error("getAllFromStore error", e);
    return [];
  }
};

const putToStore = async <T>(storeName: string, key: string, data: T): Promise<void> => {
  const uid = getUid();
  if (!uid) return;
  try {
    const docRef = doc(db, storeName, getDocId(key, storeName));
    await setDoc(docRef, { ...data, userId: uid }, { merge: true });
  } catch (e) {
    console.error("putToStore error", e);
  }
};

const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  const uid = getUid();
  if (!uid) return;
  try {
    await deleteDoc(doc(db, storeName, getDocId(key, storeName)));
  } catch (e) {
    console.error("deleteFromStore error", e);
  }
};

export const getUser = (): UserProfile | null => {
  const item = localStorage.getItem(LS_KEYS.USER);
  return item ? JSON.parse(item) : null;
};
export const saveUser = (user: UserProfile) => {
  localStorage.setItem(LS_KEYS.USER, JSON.stringify(user));
  if (user.uid) {
    putToStore('users', user.uid, { ...user, email: auth.currentUser?.email || '' });
  }
};
import { logoutFirebase } from './firebase';
export const logoutUser = async () => {
  localStorage.removeItem(LS_KEYS.USER);
  await logoutFirebase();
};

export const getTheme = (): 'light' | 'dark' => (localStorage.getItem(LS_KEYS.THEME) as 'light' | 'dark') || 'light';
export const saveTheme = (theme: 'light' | 'dark') => localStorage.setItem(LS_KEYS.THEME, theme);

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

    const reportToSave = {
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

// Mock Backup functions since we are on Firebase now
export const exportFullBackup = async (): Promise<void> => {
    console.log("Export backed up by Firestore now.");
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

