import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

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
        if (daySale && Array.isArray(daySale.items)) {
          const items = daySale.items.filter(item => {
            if (!item || !item.productName) return false;
            const itemNorm = item.productName.trim().toLowerCase();
            const pNorm = p.description.trim().toLowerCase();
            return itemNorm === pNorm || itemNorm.includes(pNorm) || pNorm.includes(itemNorm);
          });
          qty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
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
    await generateMonthlyExcelReport(user, adjustedData, monthDate, sales);
    onClose();
  };

  const toggleExpand = (desc: string) => {
    setExpandedProduct(prev => prev === desc ? null : desc);
  };

  const products = activeTab === 'Bajaj' ? BAJAJ_PRODUCTS : MR_PRODUCTS;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalUnits = useMemo(() => {
    return products.reduce((acc, p) => {
      return acc + days.reduce((sum, d) => sum + (adjustedData[p.description]?.[d] || 0), 0);
    }, 0);
  }, [products, days, adjustedData]);

  const totalEstimatedValue = useMemo(() => {
    let sum = 0;
    const priceMap = new Map<string, number>();
    (sales || []).forEach(s => {
      (s.items || []).forEach(item => {
        if (item && item.productName && Number(item.price) > 0) {
          priceMap.set(item.productName.trim().toLowerCase(), Number(item.price));
        }
      });
    });

    products.forEach(p => {
      const q = days.reduce((s, d) => s + (adjustedData[p.description]?.[d] || 0), 0);
      if (q > 0) {
        const pNorm = p.description.trim().toLowerCase();
        const pPrice = priceMap.get(pNorm) || 0;
        sum += q * pPrice;
      }
    });
    return sum;
  }, [products, days, adjustedData, sales]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-white">Adjust Monthly Report</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('Bajaj')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'Bajaj' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>Bajaj</button>
          <button onClick={() => setActiveTab('MR')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'MR' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>Morphy Richards</button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
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

          {/* Mobile Collapsible View */}
          <div className="md:hidden flex flex-col gap-3 pb-8">
            {products.map(p => {
              const rowTotal = days.reduce((sum, d) => sum + (adjustedData[p.description]?.[d] || 0), 0);
              const isExpanded = expandedProduct === p.description;
              
              return (
                <div key={p.description} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleExpand(p.description)} 
                    className="w-full p-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/80 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col items-start text-left flex-1 pr-2">
                      <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2">{p.description}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Total: <strong className="text-emerald-600 dark:text-emerald-400">{rowTotal}</strong></span>
                    </div>
                    <div className="p-1 bg-zinc-200 dark:bg-zinc-700 rounded-full text-zinc-500 dark:text-zinc-300 shrink-0">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-3 grid grid-cols-5 sm:grid-cols-7 gap-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                      {days.map(d => {
                        const val = adjustedData[p.description]?.[d] || '';
                        return (
                          <div key={d} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{d}</span>
                            <input
                              type="number"
                              min="0"
                              value={val}
                              onChange={(e) => handleQtyChange(p.description, d, e.target.value)}
                              className={`w-full h-8 text-center text-sm border rounded-md outline-none transition-all ${val ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white'} focus:ring-2 focus:ring-emerald-500/50`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 w-full sm:w-auto justify-between sm:justify-start">
            <span>Total Sold Qty: <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">{totalUnits}</strong></span>
            {totalEstimatedValue > 0 && (
              <span>Total Value: <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">₹{Math.round(totalEstimatedValue).toLocaleString('en-IN')}</strong></span>
            )}
          </div>
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="px-4 sm:px-6 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm sm:text-base">Cancel</button>
            <button onClick={handleExport} className="px-4 sm:px-6 py-2.5 rounded-xl font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm text-sm sm:text-base">
              <Download size={18} />
              Generate Excel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
