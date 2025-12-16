export interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
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

export interface UserProfile {
  name: string;
  employeeId: string;
  phoneNumber: string;
  email?: string;
  storeName: string;
  monthlyTarget: number;
  avatar?: string; // Base64
}

export interface Complaint {
  id: string;
  customerName: string;
  phoneNumber: string;
  productModel: string;
  issueType: 'Installation' | 'Complaint';
  isResolved: boolean;
  date: string;
}

export type Tab = 'dashboard' | 'entry' | 'crm' | 'settings';
