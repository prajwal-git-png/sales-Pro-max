import React, { useState } from 'react';
import { Camera, Plus, Trash2, Send, Copy, X, Search, ChevronDown, Check, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { GlassCard, GlassButton, Modal } from './ui/GlassComponents';
import { SaleItem, UserProfile } from '../types';
import { saveSaleEntry, compressImage, getSales } from '../services/storageService';
import { generateTextReport } from '../services/reportService';

// --- Product Data Constant ---
const PRODUCT_LIST = [
    "BAJAJ MIXER GRINDER GX15 500W",
    "BAJAJ MIXER 500W 3JARS GRACIO LILAC",
    "BAJAJ MIXER 750W 3JARS CARVE PURPLE",
    "BAJAJ MIXER 750W 4JARS VIRTUE BLACK",
    "BAJAJ MG 1000W 4J EVOQUE JET BLK",
    "BAJAJ FOOD PROCESSOR FX 1000 DLX 1000W",
    "BAJAJ INSTANT GEYSER MAJESTY 3KW 3L",
    "BAJAJ INSTANT GEYSER AERONO 3L 3KW",
    "BAJAJ STORAGE GEYSER PENTACLE 10L",
    "BAJAJ STORAGE GEYSER PENTACLE 15L",
    "BAJAJ STORAGE GEYSER PENTACLE 25L",
    "BAJAJ WATER HEATER NEWSHAKTI 0742 15L",
    "BAJAJ WATER HEATER NEWSHAKTI 0743 25L",
    "BAJAJ COOKTOP CGX4 ECO GLASS 4 BURNER",
    "BAJAJ UCX 2B- 2 Burner",
    "BAJAJ COOKTOP 2BR GP6 2B BLACK",
    "Bajaj Shield Series Glanza 30",
    "Bajaj Shield Series Glanza 42",
    "Bajaj TMH50",
    "Bajaj Shield Series Elevate 65",
    "Bajaj Shield Series Elevate 90",
    "Bajaj Shield Series Mighty 95",
    "BAJAJ POP UP TSTR ATX 4",
    "BAJAJ POP UP TOASTER ATX 3 SS BK",
    "BAJAJ SANDWICH MAKER GRILL SWX4 DLX",
    "BAJAJ SANDWICH MAKR SWX6 GRILL",
    "BAJAJ HAND BLENDER HB 21 BK 300W",
    "BAJAJ HAND BLENDER HB 22 BL 300W",
    "Bajaj Hand Blender Juvel 300W",
    "Bajaj Flashy New",
    "RX10",
    "RX11",
    "BAJAJ INDUCTION COOKTOP 1400W ICX 140TS",
    "BAJAJ INDUCTION CT MAJESTY SLIM BK 2100W",
    "BAJAJ DRY IRON DX 11",
    "BAJAJ MAJESTY DX4 DRY IRON 1000W WHITE",
    "Bajaj Steam Iron MX 3 Neo 1250W",
    "BAJAJ STEAM IRON MX 35N BLACK & PURPLE",
    "MR Tresta 500W Mixer Grinder",
    "MR TetraGrind 750W 3 Jar Mixer Grinder",
    "MR GrindPro Maxx 1000W MG",
    "Icon Superb Food Processor",
    "Pronto Plus",
    "640099 MR HB-PRONTO ULTRA",
    "AT 205",
    "5L Digital Air Fryer BL",
    "MR OTG 29 RCAD DIGI",
    "20R",
    "OTG 60 RCSS",
    "Microwave Oven - 20MS",
    "Inspira dry iron",
    "Ultra Glide Steam Iron - 1600W",
    "Super Glide Steam Iron - 2000W"
];

interface NewEntryProps {
  user: UserProfile;
  onEntryComplete: () => void;
}

const NewEntry: React.FC<NewEntryProps> = ({ user, onEntryComplete }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<SaleItem[]>([
    { id: '1', productName: '', quantity: 1, price: 0 }
  ]);
  const [inputModes, setInputModes] = useState<('unit'|'total')[]>(['unit']);

  const [billImages, setBillImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Week Off Logic
  const [isWeekOff, setIsWeekOff] = useState(false);

  // Search State
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = searchTerm 
      ? PRODUCT_LIST.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
      : PRODUCT_LIST;

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), productName: '', quantity: 1, price: 0 }]);
    setInputModes([...inputModes, 'unit']);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    
    const newModes = [...inputModes];
    newModes.splice(index, 1);
    setInputModes(newModes);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updatePrice = (index: number, value: number) => {
      const mode = inputModes[index];
      const qty = items[index].quantity || 1;
      
      if (mode === 'total') {
          // User input is Total Price, so Unit Price = Total / Qty
          updateItem(index, 'price', value / qty);
      } else {
          // User input is Unit Price
          updateItem(index, 'price', value);
      }
  };

  const togglePriceMode = (index: number) => {
      const newModes = [...inputModes];
      newModes[index] = newModes[index] === 'unit' ? 'total' : 'unit';
      setInputModes(newModes);
      
      // Reset price to 0 to avoid confusion when switching modes
      updateItem(index, 'price', 0);
  };

  const handleProductSelect = (index: number, name: string) => {
      updateItem(index, 'productName', name);
      setActiveSearchIndex(null);
      setSearchTerm('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const files = Array.from(e.target.files);
        const newImages = await Promise.all(files.map(f => compressImage(f as File)));
        setBillImages(prev => [...prev, ...newImages]);
      } catch (err) {
        alert('Error uploading images');
      }
    }
  };

  const removeImage = (index: number) => {
      setBillImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isWeekOff) {
        if(confirm("Mark " + date + " as Week Off?")) {
            setIsSubmitting(true);
            setTimeout(() => {
                const sales = getSales();
                const existingIndex = sales.findIndex(s => s.date === date);
                if(existingIndex > -1) {
                     sales[existingIndex] = {
                         ...sales[existingIndex],
                         isWeekOff: true,
                         items: [],
                         totalQty: 0,
                         totalValue: 0
                     }
                } else {
                    sales.push({
                        date,
                        items: [],
                        totalQty: 0,
                        totalValue: 0,
                        isWeekOff: true
                    });
                }
                localStorage.setItem('app_sales_data', JSON.stringify(sales));

                setIsSubmitting(false);
                setShowSuccessModal(true);
            }, 500);
        }
        return;
    }

    if (billImages.length === 0 && !confirm("Save without bill image?")) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
        saveSaleEntry(date, items, billImages);
        setIsSubmitting(false);
        setShowSuccessModal(true);
    }, 500);
  };

  const handleShareWhatsApp = () => {
      if(isWeekOff) return;
      const allSales = getSales();
      const report = allSales.find(s => s.date === date);
      if (report) {
          const text = generateTextReport(user, report);
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
  };

  const handleCopyText = () => {
      if(isWeekOff) {
          navigator.clipboard.writeText(`Name: ${user.name}\nDate: ${date}\nStatus: Week Off`);
          alert('Week Off report copied');
          return;
      }
      const allSales = getSales();
      const report = allSales.find(s => s.date === date);
      if (report) {
          const text = generateTextReport(user, report);
          navigator.clipboard.writeText(text);
          alert('Report copied!');
      }
  };

  const resetForm = () => {
      setItems([{ id: Date.now().toString(), productName: '', quantity: 1, price: 0 }]);
      setInputModes(['unit']);
      setBillImages([]);
      setDate(new Date().toISOString().split('T')[0]);
      setIsWeekOff(false);
      setShowSuccessModal(false);
      onEntryComplete();
  };

  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formattedDate = date.split('-').reverse().join('/');

  return (
    <>
    <div className="space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">New Entry</h2>
        <p className="text-slate-500 text-sm">Log your daily performance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Status Card */}
        <GlassCard className="p-4">
          <div className="flex justify-between items-center gap-4">
             <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
             </div>
             <div className="flex flex-col items-end space-y-2">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</span>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isWeekOff} onChange={e => setIsWeekOff(e.target.checked)} />
                    <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 shadow-inner"></div>
                    <span className="ml-2 text-xs font-semibold text-gray-500 dark:text-gray-400 w-12">{isWeekOff ? 'OFF' : 'Work'}</span>
                </label>
             </div>
          </div>
        </GlassCard>

        {!isWeekOff && (
        <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Products</label>
                <button type="button" onClick={addItem} className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
                    <Plus size={16} /> Add Item
                </button>
            </div>
            
            {items.map((item, index) => {
              const mode = inputModes[index];
              const displayPrice = mode === 'total' 
                  ? (item.price * item.quantity)
                  : item.price;
              const calculatedTotal = item.price * item.quantity;

              return (
              <div key={item.id} className="relative bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-sm animate-in zoom-in-95 duration-200 overflow-hidden">
                {items.length > 1 && (
                    <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full shadow-md hover:bg-red-200 transition-colors z-10"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
                
                <div className="p-5 space-y-4">
                    {/* Product Name Search */}
                    <div className="space-y-1.5 relative z-20">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Product Model</label>
                        <div className="relative">
                            <div 
                                className="flex items-center justify-between w-full bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5 rounded-xl px-4 py-3 cursor-pointer hover:bg-white/70 transition-colors"
                                onClick={() => {
                                    setActiveSearchIndex(index);
                                    setSearchTerm(item.productName);
                                }}
                            >
                                <span className={`text-sm font-medium ${!item.productName && 'text-slate-400 italic'}`}>
                                    {item.productName || 'Select Product...'}
                                </span>
                                <ChevronDown size={16} className="text-slate-400" />
                            </div>

                            {activeSearchIndex === index && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 z-50">
                                    <div className="p-2 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur">
                                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/40 rounded-lg px-3 py-1.5">
                                            <Search size={14} className="text-gray-400" />
                                            <input 
                                                autoFocus
                                                className="w-full py-1 text-sm outline-none bg-transparent"
                                                placeholder="Search model..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && <X size={14} className="text-gray-400 cursor-pointer" onClick={() => setSearchTerm('')} />}
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar">
                                        {filteredProducts.map(p => (
                                            <div 
                                                key={p} 
                                                className="px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-white/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0"
                                                onClick={() => handleProductSelect(index, p)}
                                            >
                                                {p}
                                            </div>
                                        ))}
                                        {searchTerm && !filteredProducts.includes(searchTerm) && (
                                            <div 
                                                className="px-4 py-3 text-sm text-blue-600 cursor-pointer font-bold bg-blue-50/50"
                                                onClick={() => handleProductSelect(index, searchTerm)}
                                            >
                                                + Add "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Backdrop for search */}
                            {activeSearchIndex === index && (
                                <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setActiveSearchIndex(null)} />
                            )}
                        </div>
                    </div>

                    {/* Qty & Price Row - Using Grid for alignment */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Column 1: Quantity */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Quantity</label>
                            <input 
                                type="number"
                                min="1"
                                className="w-full bg-white/50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-t-lg px-3 py-2.5 text-center font-mono text-lg font-semibold outline-none transition-all h-12"
                                value={item.quantity}
                                onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                required
                            />
                        </div>

                        {/* Column 2: Price (Unit or Total based on mode) */}
                        <div className="space-y-1.5 relative">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                {mode === 'total' ? 'Total Amount' : 'Unit Price'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium z-10">₹</span>
                                <input 
                                    type="number"
                                    min="0"
                                    step="any"
                                    className={`w-full bg-white/50 dark:bg-black/20 border-b-2 rounded-t-lg pl-8 pr-3 py-2.5 font-mono text-lg font-semibold outline-none transition-all h-12 ${
                                        mode === 'total' ? 'border-purple-300 focus:border-purple-500 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
                                    }`}
                                    value={displayPrice || ''}
                                    onChange={e => updatePrice(index, parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Logic for Calculation Mode */}
                <div className="bg-slate-50/50 dark:bg-black/30 border-t border-white/20 dark:border-white/5 p-3 flex justify-between items-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
                        Total: <span className="text-slate-800 dark:text-white font-bold ml-1">₹{calculatedTotal.toLocaleString()}</span>
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={() => togglePriceMode(index)}
                        className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                    >
                        <RefreshCcw size={10} className={mode === 'total' ? 'text-purple-500' : ''} />
                        {mode === 'total' ? 'Input Unit Price' : 'Input Total Amount'}
                    </button>
                </div>

              </div>
            )})}
          </div>
          )}

        {/* Bill Images Section - Hide if Week Off */}
        {!isWeekOff && (
        <GlassCard className="p-5">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">Bill Copies</p>
                    <p className="text-xs text-slate-500">{billImages.length} images selected</p>
                </div>
                <div className="flex gap-2">
                    <label className="cursor-pointer bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                        <Camera size={14} /> Add
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                </div>
            </div>
            
            {billImages.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 dark:bg-black/20">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <p className="text-xs font-medium">No bills uploaded</p>
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                    {billImages.map((img, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-24 h-32 snap-start group">
                            <img src={img} alt={`Bill ${idx}`} className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-white/10 shadow-sm" />
                            <button 
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 rounded-b-xl">
                                <span className="text-[10px] text-white font-bold opacity-80">#{idx + 1}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GlassCard>
        )}

        {!isWeekOff && (
        <div className="bg-white/60 dark:bg-blue-900/20 backdrop-blur-xl border border-white/40 dark:border-blue-500/30 rounded-2xl p-4 flex justify-between items-center shadow-lg">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Total Value</span>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">₹{totalValue.toLocaleString()}</span>
        </div>
        )}

        <GlassButton type="submit" className="w-full py-4 text-lg shadow-xl shadow-blue-500/20" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Entry...' : (isWeekOff ? 'Mark as Week Off' : 'Save Entry')}
        </GlassButton>
      </form>
    </div>

    {/* Success Modal */}
    <Modal 
        isOpen={showSuccessModal} 
        onClose={resetForm} 
        title={isWeekOff ? "Week Off Recorded" : "Entry Saved!"}
    >
        <div className="text-center space-y-6 pt-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl ${isWeekOff ? 'bg-gray-100 text-gray-500' : 'bg-gradient-to-tr from-green-400 to-emerald-600 text-white'}`}>
                {isWeekOff ? <Check size={40} /> : <Check size={40} strokeWidth={3} />}
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
                {isWeekOff 
                    ? `Marked ${formattedDate} as Week Off.` 
                    : `Your data has been added to the cumulative report for ${formattedDate}.`
                }
            </p>
            
            {!isWeekOff && (
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={handleShareWhatsApp}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 hover:scale-[1.02]"
                >
                    <Send size={24} />
                    <span className="font-bold text-sm">WhatsApp</span>
                </button>
                <button 
                    onClick={handleCopyText}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all border border-blue-500/20 hover:scale-[1.02]"
                >
                    <Copy size={24} />
                    <span className="font-bold text-sm">Copy</span>
                </button>
            </div>
            )}

            <GlassButton onClick={resetForm} variant="secondary" className="w-full">
                Close & New Entry
            </GlassButton>
        </div>
    </Modal>
    </>
  );
};

export default NewEntry;