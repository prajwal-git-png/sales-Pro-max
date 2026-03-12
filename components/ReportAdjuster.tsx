import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { BAJAJ_PRODUCTS, MR_PRODUCTS, generateMonthlyExcelReport } from '../services/excelExportService';
import { DailyReport, UserProfile } from '../types';

interface Props {
  user: UserProfile;
  sales: DailyReport[];
  monthDate: Date;
  onClose: () => void;
}

export function ReportAdjuster({ user, sales, monthDate, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'Bajaj' | 'MR'>('Bajaj');
  const [adjustedData, setAdjustedData] = useState<Record<string, Record<number, number>>>({});

  useEffect(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const initialData: Record<string, Record<number, number>> = {};
    const allProducts = [...BAJAJ_PRODUCTS, ...MR_PRODUCTS];

    allProducts.forEach(p => {
      initialData[p.description] = {};
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const daySale = sales.find(s => s.date === dateStr);
        let qty = 0;
        if (daySale) {
          const items = daySale.items.filter(item => item.productName === p.description);
          qty = items.reduce((sum, item) => sum + item.quantity, 0);
        }
        initialData[p.description][i] = qty;
      }
    });
    setAdjustedData(initialData);
  }, [sales, monthDate]);

  const handleQtyChange = (productDesc: string, day: number, val: string) => {
    const num = parseInt(val, 10);
    setAdjustedData(prev => ({
      ...prev,
      [productDesc]: {
        ...prev[productDesc],
        [day]: isNaN(num) ? 0 : num
      }
    }));
  };

  const handleExport = async () => {
    await generateMonthlyExcelReport(user, adjustedData, monthDate);
    onClose();
  };

  const products = activeTab === 'Bajaj' ? BAJAJ_PRODUCTS : MR_PRODUCTS;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Adjust Monthly Report</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setActiveTab('Bajaj')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'Bajaj' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>Bajaj</button>
          <button onClick={() => setActiveTab('MR')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'MR' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>Morphy Richards</button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 z-10">
              <tr>
                <th className="p-2 font-semibold border border-zinc-200 dark:border-zinc-700 sticky left-0 bg-zinc-100 dark:bg-zinc-800 z-20">Product</th>
                {days.map(d => (
                  <th key={d} className="p-2 font-semibold border border-zinc-200 dark:border-zinc-700 text-center w-12">{d}</th>
                ))}
                <th className="p-2 font-semibold border border-zinc-200 dark:border-zinc-700 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const rowTotal = days.reduce((sum, d) => sum + (adjustedData[p.description]?.[d] || 0), 0);
                return (
                  <tr key={p.description} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-700 sticky left-0 bg-white dark:bg-zinc-900 z-10 truncate max-w-[200px]" title={p.description}>
                      {p.description}
                    </td>
                    {days.map(d => (
                      <td key={d} className="p-1 border-r border-zinc-200 dark:border-zinc-700">
                        <input
                          type="number"
                          min="0"
                          value={adjustedData[p.description]?.[d] || ''}
                          onChange={(e) => handleQtyChange(p.description, d, e.target.value)}
                          className="w-10 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500 rounded text-zinc-800 dark:text-white"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold text-emerald-600 dark:text-emerald-400">{rowTotal > 0 ? rowTotal : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={handleExport} className="px-6 py-2 rounded-xl font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Download size={18} />
            Generate Excel
          </button>
        </div>
      </div>
    </div>
  );
}
