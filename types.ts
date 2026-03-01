export interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  customerPhone?: string;
  billId?: string;
  txnNumber?: string;
}

export interface DailyReport {
  date: string; // ISO format YYYY-MM-DD
  items: SaleItem[];
  totalValue: number;
  totalQty: number;
  billImages?: string[]; // Array of Base64 strings
  /** @deprecated use billImages instead */
  billImage?: string; 
  isWeekOff?: boolean;
}

export interface StoreEODEntry {
  date: string;
  achievement: number;
  eolAchieve: number;
  dayTarget: number;
  weekTarget: number;
  eolTarget: number;
}

export interface StoreLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface AttendanceEntry {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Week Off' | 'Leave';
  checkInTime?: string;
  location?: StoreLocation;
}

export interface UserProfile {
  name: string;
  employeeId: string;
  phoneNumber: string;
  email?: string;
  storeName: string;
  monthlyTarget: number;
  avatar?: string; // Base64
  apiKey?: string; // User provided API Key
  storeLocation?: StoreLocation;
  brandSiteUrl?: string;
  tollFreeNumber?: string;
  customTargets?: {
    daily: number;
    weekly: number;
    eol: number;
  };
}

export interface Complaint {
  id: string;
  customerName: string;
  phoneNumber: string;
  productModel: string;
  issueType: 'Installation' | 'Complaint' | 'Store Stock' | 'Store Stack';
  customProductName?: string;
  isResolved: boolean;
  date: string;
}

export type Tab = 'dashboard' | 'attendance' | 'entry' | 'eod' | 'crm' | 'settings';