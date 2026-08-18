import { DailyReport, UserProfile, Complaint, SaleItem, StoreEODEntry, AttendanceEntry, FollowUp } from '../types';
import { db, auth, logoutFirebase } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

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
  return auth.currentUser?.uid || getUser()?.uid || 'default_user';
};

const getDocId = (key: string, storeName?: string) => {
  return storeName === 'users' ? key : `${getUid()}_${key}`;
};

// Local storage backup helpers
const getLocalKey = (storeName: string, key: string) => `${LS_KEYS.STORE_PREFIX}${storeName}_${getUid()}_${key}`;
const getLocalCollectionKey = (storeName: string) => `${LS_KEYS.STORE_PREFIX}${storeName}_${getUid()}_all`;

const getLocalItem = <T>(storeName: string, key: string): T | undefined => {
  try {
    const uid = getUid();
    if (!uid) return undefined;
    const item = localStorage.getItem(getLocalKey(storeName, key));
    return item ? JSON.parse(item) : undefined;
  } catch {
    return undefined;
  }
};

const setLocalItem = <T>(storeName: string, key: string, data: T): void => {
  try {
    const uid = getUid();
    if (!uid) return;
    localStorage.setItem(getLocalKey(storeName, key), JSON.stringify(data));
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
    const uid = getUid();
    if (!uid) return;
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
    const uid = getUid();
    if (!uid) return [];
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
    console.warn("getFromStore fallback to local cache", e);
    return localVal;
  }
};

export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
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
    console.warn("getAllFromStore fallback to local cache", e);
    return localList;
  }
};

export const putToStore = async <T>(storeName: string, key: string, data: T): Promise<void> => {
  const uid = getUid();
  const payload = { ...data, userId: uid };
  setLocalItem(storeName, key, payload);

  if (auth.currentUser?.uid) {
    try {
      const docRef = doc(db, storeName, getDocId(key, storeName));
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn("putToStore cloud write warning", e);
    }
  }
};

export const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  removeLocalItem(storeName, key);
  if (auth.currentUser?.uid) {
    try {
      await deleteDoc(doc(db, storeName, getDocId(key, storeName)));
    } catch (e) {
      console.warn("deleteFromStore cloud delete warning", e);
    }
  }
};

export const saveUser = async (user: UserProfile) => {
  try {
    const activeUid = getUid() || user.uid || 'default_user';
    const profileToSave = { ...user, uid: user.uid || activeUid, userId: user.userId || activeUid };
    localStorage.setItem(LS_KEYS.USER, JSON.stringify(profileToSave));

    if (auth.currentUser?.uid) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { 
        ...profileToSave, 
        userId: auth.currentUser.uid,
        email: auth.currentUser.email || user.email || '' 
      }, { merge: true });
    }
  } catch (e) {
    console.error("saveUser error", e);
  }
};

export const ensureUserProfileFromGoogle = async (firebaseUser: User): Promise<UserProfile> => {
  try {
    // 1. Try to load from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const cloudProfile = docSnap.data() as UserProfile;
      const fullProfile = { ...cloudProfile, uid: firebaseUser.uid, userId: firebaseUser.uid };
      localStorage.setItem(LS_KEYS.USER, JSON.stringify(fullProfile));
      return fullProfile;
    }
  } catch (e) {
    console.warn("Could not fetch remote user profile, using Google defaults", e);
  }

  // 2. Try from local storage
  const existingLocal = getUser();
  if (existingLocal && (existingLocal.uid === firebaseUser.uid || !existingLocal.uid)) {
    const updated = { ...existingLocal, uid: firebaseUser.uid, userId: firebaseUser.uid };
    localStorage.setItem(LS_KEYS.USER, JSON.stringify(updated));
    return updated;
  }

  // 3. Auto-provision profile from Google Account
  const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Field Executive';
  const autoProfile: UserProfile = {
    uid: firebaseUser.uid,
    userId: firebaseUser.uid,
    name: displayName.toUpperCase(),
    email: firebaseUser.email || '',
    employeeId: `EMP-${firebaseUser.uid.slice(0, 4).toUpperCase()}`,
    phoneNumber: firebaseUser.phoneNumber || '',
    storeName: 'RELIANCE DIGITAL',
    monthlyTarget: 100000,
    avatar: firebaseUser.photoURL || undefined
  };

  try {
    localStorage.setItem(LS_KEYS.USER, JSON.stringify(autoProfile));
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, autoProfile, { merge: true });
  } catch (e) {
    console.warn("Auto-provision save warn", e);
  }

  return autoProfile;
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
    totalQty: items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0),
    totalValue: items.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0),
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

export interface BackupPackage {
  app: string;
  version: string;
  timestamp: string;
  data: {
    user?: UserProfile;
    sales?: DailyReport[];
    images?: { date: string; images: string[] }[];
    eod?: StoreEODEntry[];
    crm?: Complaint[];
    followups?: FollowUp[];
    attendance?: AttendanceEntry[];
  };
}

export const exportFullBackup = async (): Promise<void> => {
  const currentUser = getUser();
  const sales = await getAllFromStore<DailyReport>('sales');
  const images = await getAllFromStore<{ date: string; images: string[] }>('images');
  const eod = await getAllFromStore<StoreEODEntry>('eod');
  const crm = await getAllFromStore<Complaint>('crm');
  const followups = await getAllFromStore<FollowUp>('followups');
  const attendance = await getAllFromStore<AttendanceEntry>('attendance');

  const backupPackage: BackupPackage = {
    app: 'SalesTrack',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    data: {
      user: currentUser || undefined,
      sales,
      images,
      eod,
      crm,
      followups,
      attendance,
    }
  };

  const jsonString = JSON.stringify(backupPackage, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = currentUser?.name ? currentUser.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Executive';
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `SalesTrack_Backup_${safeName}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFullBackup = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, message: 'Empty or invalid backup file.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return { success: false, message: 'Invalid JSON format: ' + (e.message || String(e)) };
    }

    // Extract payload from various formats (wrapper object or direct object or array)
    let payloadData: any = {};
    if (parsed && typeof parsed === 'object') {
      if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
        payloadData = parsed.data;
      } else if (Array.isArray(parsed)) {
        payloadData = { sales: parsed };
      } else {
        payloadData = parsed;
      }
    }

    const currentUid = getUid();

    // 1. Restore User Profile
    const userToRestore: UserProfile | undefined = payloadData.user || payloadData.userProfile || parsed.user;
    if (userToRestore && typeof userToRestore === 'object') {
      const activeUser = getUser();
      const updatedUser: UserProfile = {
        ...userToRestore,
        uid: activeUser?.uid || userToRestore.uid || currentUid,
        userId: activeUser?.userId || userToRestore.userId || currentUid,
        name: userToRestore.name || activeUser?.name || 'Sales Executive',
        storeName: userToRestore.storeName || activeUser?.storeName || 'RELIANCE DIGITAL',
        monthlyTarget: Number(userToRestore.monthlyTarget) || activeUser?.monthlyTarget || 100000,
        employeeId: userToRestore.employeeId || activeUser?.employeeId || 'EMP-1001',
        phoneNumber: userToRestore.phoneNumber || activeUser?.phoneNumber || '',
      };
      await saveUser(updatedUser);
    }

    // 2. Restore Sales Reports
    const rawSales: any[] = payloadData.sales || payloadData.reports || payloadData.salesData || payloadData.entries || [];
    let salesRestoredCount = 0;
    if (Array.isArray(rawSales)) {
      for (const item of rawSales) {
        if (!item || !item.date) continue;
        const dateKey = String(item.date).trim();
        
        // Normalize items array
        const rawItems = item.items || item.saleItems || [];
        const normalizedItems: SaleItem[] = Array.isArray(rawItems) ? rawItems.map((si: any, idx: number) => ({
          id: si.id || `item_${dateKey}_${idx}_${Date.now()}`,
          productName: si.productName || si.product || si.name || 'Sales Item',
          quantity: Number(si.quantity || si.qty || 1) || 1,
          price: Number(si.price || si.rate || si.amount || 0) || 0,
          customerPhone: si.customerPhone || si.phone || '',
          billId: si.billId || si.invoiceNo || '',
          txnNumber: si.txnNumber || '',
        })) : [];

        const totalQty = item.totalQty !== undefined ? Number(item.totalQty) : normalizedItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalValue = item.totalValue !== undefined ? Number(item.totalValue) : normalizedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        const cleanReport: DailyReport = {
          date: dateKey,
          items: normalizedItems,
          totalQty,
          totalValue,
          isWeekOff: Boolean(item.isWeekOff),
          notes: item.notes || '',
          userId: currentUid,
        };

        // Extract any attached images
        const embeddedImages: string[] = item.billImages || (item.billImage ? [item.billImage] : []);
        if (embeddedImages.length > 0) {
          await putToStore('images', dateKey, { date: dateKey, images: embeddedImages });
        }

        await putToStore('sales', dateKey, cleanReport);
        salesRestoredCount++;
      }
    }

    // 3. Restore Standalone Images
    const rawImages: any[] = payloadData.images || [];
    if (Array.isArray(rawImages)) {
      for (const imgItem of rawImages) {
        if (imgItem && imgItem.date && Array.isArray(imgItem.images) && imgItem.images.length > 0) {
          await putToStore('images', imgItem.date, { date: imgItem.date, images: imgItem.images });
        }
      }
    }

    // 4. Restore EOD Entries
    const rawEod: any[] = payloadData.eod || payloadData.eodEntries || [];
    let eodCount = 0;
    if (Array.isArray(rawEod)) {
      for (const entry of rawEod) {
        if (!entry || !entry.date) continue;
        const eodPayload: StoreEODEntry = {
          date: String(entry.date).trim(),
          achievement: Number(entry.achievement || entry.dayAchieve || 0) || 0,
          eolAchieve: Number(entry.eolAchieve || 0) || 0,
          dayTarget: Number(entry.dayTarget || 0) || 0,
          weekTarget: Number(entry.weekTarget || 0) || 0,
          eolTarget: Number(entry.eolTarget || 0) || 0,
          userId: currentUid,
        };
        await putToStore('eod', eodPayload.date, eodPayload);
        eodCount++;
      }
    }

    // 5. Restore CRM Complaints
    const rawCrm: any[] = payloadData.crm || payloadData.complaints || [];
    let crmCount = 0;
    if (Array.isArray(rawCrm)) {
      for (const comp of rawCrm) {
        if (!comp) continue;
        const compId = String(comp.id || `crm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
        const crmPayload: Complaint = {
          id: compId,
          customerName: comp.customerName || comp.name || 'Customer',
          phoneNumber: comp.phoneNumber || comp.phone || '',
          productModel: comp.productModel || comp.product || comp.model || 'Model',
          issueType: comp.issueType || 'Complaint',
          customProductName: comp.customProductName || '',
          status: comp.status || (comp.isResolved ? 'Resolved' : 'Raised'),
          timeline: Array.isArray(comp.timeline) ? comp.timeline : [
            { status: comp.status || 'Raised', date: comp.date || new Date().toISOString(), note: 'Imported complaint' }
          ],
          date: comp.date || new Date().toISOString().split('T')[0],
          repairsDone: comp.repairsDone || '',
          partsReplaced: comp.partsReplaced || '',
          userId: currentUid,
        };
        await putToStore('crm', compId, crmPayload);
        crmCount++;
      }
    }

    // 6. Restore Follow-ups
    const rawFollowups: any[] = payloadData.followups || payloadData.followUps || [];
    if (Array.isArray(rawFollowups)) {
      for (const fu of rawFollowups) {
        if (!fu) continue;
        const fuId = String(fu.id || `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
        const fuPayload: FollowUp = {
          id: fuId,
          customerName: fu.customerName || 'Customer',
          phoneNumber: fu.phoneNumber || '',
          reminderDate: fu.reminderDate || new Date().toISOString().split('T')[0],
          note: fu.note || '',
          isCompleted: Boolean(fu.isCompleted),
          createdAt: fu.createdAt || new Date().toISOString(),
          userId: currentUid,
        };
        await putToStore('followups', fuId, fuPayload);
      }
    }

    // 7. Restore Attendance
    const rawAttendance: any[] = payloadData.attendance || payloadData.attendanceList || [];
    if (Array.isArray(rawAttendance)) {
      for (const att of rawAttendance) {
        if (!att || !att.date) continue;
        const attPayload: AttendanceEntry = {
          date: String(att.date).trim(),
          status: att.status || 'Present',
          checkInTime: att.checkInTime || '',
          location: att.location || undefined,
          userId: currentUid,
        };
        await putToStore('attendance', attPayload.date, attPayload);
      }
    }

    return {
      success: true,
      message: `Successfully imported ${salesRestoredCount} sales reports, ${eodCount} EOD records, and ${crmCount} CRM cases.`,
    };
  } catch (err: any) {
    console.error("importFullBackup failed", err);
    return {
      success: false,
      message: 'Restore failed: ' + (err?.message || String(err)),
    };
  }
};
