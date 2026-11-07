import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  ShoppingBag, 
  X, 
  FileText, 
  PackageCheck, 
  RotateCcw, 
  BookOpen, 
  Upload, 
  FileUp, 
  Download
} from 'lucide-react';
import { UserProfile } from '../types';
import { GlassCard, GlassButton, Modal } from './ui/GlassComponents';
import { ISP_HANDBOOK_PRODUCTS, HandbookProduct, CATEGORIES_LIST } from '../services/handbookProducts';
import { getProductDocs, saveProductDoc, deleteProductDoc } from '../services/storageService';
import { StoredProductDoc } from '../services/indexedDbService';
import { PdfWebCanvasViewer } from './PdfWebCanvasViewer';

export interface StockRequestItem {
  id: string;
  name: string;
  code: string;
  brand: 'BAJAJ' | 'MORPHY RICHARDS';
  storeQty: string; // e.g. "0", "06", "not available"
  displayRequired: boolean;
  requiredQty: number; // e.g. 5, 10
}

const STOCK_REQUEST_LS_KEY = 'salestrack_stock_request_items_v2';

interface ProductsViewProps {
  user: UserProfile;
  onNavigateToSettings?: () => void;
}

/**
 * Robust helper to convert base64 data URLs to safe Blob URLs
 * This ensures iframes never block rendering due to data-URI iframe constraints.
 */
const getSafeBlobUrl = (dataUrl: string, mimeType: string): string => {
  try {
    if (!dataUrl) return '';
    if (dataUrl.startsWith('blob:')) return dataUrl;
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const meta = parts[0];
      const base64Data = parts[1];
      const contentType = meta.split(':')[1]?.split(';')[0] || mimeType;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: contentType });
      return URL.createObjectURL(blob);
    }
    return dataUrl;
  } catch (err) {
    console.warn('Error converting dataUrl to blob URL:', err);
    return dataUrl;
  }
};

export const ProductsView: React.FC<ProductsViewProps> = ({ user }) => {
  // 2 Distinct Menus requested by user:
  // 1: 'request' = "Product Details for Request"
  // 2: 'features' = "Understanding Features & Handbook (PDF / PPT Browser Viewer)"
  const [activeMenu, setActiveMenu] = useState<'request' | 'features'>('request');

  // Brand and search filter states for Request view
  const [selectedBrand, setSelectedBrand] = useState<'ALL' | 'BAJAJ' | 'MORPHY RICHARDS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Request list (Starts completely clean & clear)
  const [stockRequests, setStockRequests] = useState<StockRequestItem[]>(() => {
    try {
      const saved = localStorage.getItem(STOCK_REQUEST_LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Uploaded PDF / PPT Documents State
  const [productDocs, setProductDocs] = useState<StoredProductDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<StoredProductDoc | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreenDoc, setIsFullscreenDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick product selector modal for request builder
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_REQUEST_LS_KEY, JSON.stringify(stockRequests));
    } catch {
      // ignore
    }
  }, [stockRequests]);

  // Load uploaded detailed handbook documents (PDF/PPT)
  const loadDocs = async () => {
    try {
      const docs = await getProductDocs();
      setProductDocs(docs);
      if (docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0]);
      }
    } catch (err) {
      console.warn('Error loading product docs:', err);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // Whenever activeDoc changes, generate safe blob URL for the iframe
  useEffect(() => {
    if (!activeDoc) {
      setActiveBlobUrl('');
      return;
    }
    const blobUrl = getSafeBlobUrl(activeDoc.dataUrl, activeDoc.type || 'application/pdf');
    setActiveBlobUrl(blobUrl);

    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [activeDoc]);

  // Handle uploading multiple documents directly in the features view
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    setIsUploading(true);
    let count = 0;
    try {
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          setCopyFeedback(`"${file.name}" is over 50MB, skipped.`);
          continue;
        }
        const saved = await saveProductDoc(file);
        count++;
        // Set as active document immediately
        setActiveDoc(saved);
      }
      await loadDocs();
      setCopyFeedback(`Successfully attached ${count} document(s)! Available in offline viewer.`);
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err: any) {
      setCopyFeedback(`Upload error: ${err?.message || String(err)}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteActiveDoc = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from stored handbooks?`)) return;
    try {
      await deleteProductDoc(id);
      const updated = await getProductDocs();
      setProductDocs(updated);
      setActiveDoc(updated.length > 0 ? updated[0] : null);
      setCopyFeedback(`Deleted "${name}".`);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (err: any) {
      console.warn('Error deleting doc:', err);
    }
  };

  // Filtered Products for Catalog (Simplified and searchable)
  const filteredProducts = useMemo(() => {
    return ISP_HANDBOOK_PRODUCTS.filter((prod) => {
      if (selectedBrand !== 'ALL' && prod.brand !== selectedBrand) return false;
      if (selectedCategory !== 'ALL' && prod.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableText = `${prod.name} ${prod.category} ${prod.brand} ${prod.articleCode} ${prod.bajajCode} ${prod.description}`.toLowerCase();
        return searchableText.includes(query);
      }
      return true;
    });
  }, [selectedBrand, selectedCategory, searchQuery]);

  // Modal quick search list
  const modalFilteredProducts = useMemo(() => {
    if (!modalSearchQuery.trim()) return ISP_HANDBOOK_PRODUCTS;
    const q = modalSearchQuery.toLowerCase().trim();
    return ISP_HANDBOOK_PRODUCTS.filter(p =>
      `${p.name} ${p.articleCode} ${p.category} ${p.brand}`.toLowerCase().includes(q)
    );
  }, [modalSearchQuery]);

  // Format today's date DD/MM/YY
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }, []);

  // WhatsApp formatted string generator
  const generateWhatsAppMessage = () => {
    const storeCode = user.storeCode || '8883';
    const storeName = user.storeName || 'Reliance Digital';
    const storeLoc = user.storeNameAndLocation || user.storeLocation?.address || `${user.storeName || 'JP nagar'} reliance digital`;
    const name = user.name || 'Executive';

    let msg = `*Store code : ${storeCode}\n`;
    msg += `*Store name : ${storeName}\n`;
    msg += `*Location : ${storeLoc}\n`;
    msg += `*Name : ${name}\n`;
    msg += `*Date : ${todayFormatted}\n`;

    stockRequests.forEach((item) => {
      msg += `${item.name} : Code -${item.code}\n`;
      msg += `Store : ${item.storeQty}\n`;
      if (item.displayRequired) {
        msg += `Display required\n`;
      }
      msg += `Required : ${item.requiredQty}\n`;
    });

    return msg.trim();
  };

  const handleSendWhatsApp = () => {
    if (stockRequests.length === 0) {
      setCopyFeedback('Add at least one product before sending! ⚠️');
      setTimeout(() => setCopyFeedback(null), 2500);
      return;
    }
    const text = generateWhatsAppMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyRequest = () => {
    if (stockRequests.length === 0) {
      setCopyFeedback('Stock request is empty! ⚠️');
      setTimeout(() => setCopyFeedback(null), 2500);
      return;
    }
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopyFeedback('Stock request message copied! 📋');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleAddProductToRequest = (prod: HandbookProduct) => {
    const existingIndex = stockRequests.findIndex((r) => r.code === prod.articleCode);
    if (existingIndex >= 0) {
      setStockRequests((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, requiredQty: item.requiredQty + 1 } : item
        )
      );
    } else {
      setStockRequests((prev) => [
        ...prev,
        {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: prod.name,
          code: prod.articleCode,
          brand: prod.brand,
          storeQty: '0',
          displayRequired: false,
          requiredQty: 5
        }
      ]);
    }
    setCopyFeedback(`Added "${prod.name}" to Request! ✨`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleRemoveRequestItem = (id: string) => {
    setStockRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRequestItem = (id: string, field: keyof StockRequestItem, val: any) => {
    setStockRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleClearAllRequests = () => {
    if (stockRequests.length === 0) return;
    if (window.confirm('Clear all items from current Stock Request?')) {
      setStockRequests([]);
      setCopyFeedback('Stock request cleared! 🧹');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleLoadSampleItems = () => {
    setStockRequests([
      { id: 'req_1', name: 'Bajaj Infrared Induction 2200W', code: '494459697', brand: 'BAJAJ', storeQty: '0', displayRequired: false, requiredQty: 5 },
      { id: 'req_2', name: 'Bajaj Style Mix Mixer', code: '494622897', brand: 'BAJAJ', storeQty: 'not available', displayRequired: true, requiredQty: 10 },
      { id: 'req_3', name: 'Bajaj EVOQUE JET military grade MG', code: '494459717', brand: 'BAJAJ', storeQty: '06', displayRequired: false, requiredQty: 5 },
      { id: 'req_4', name: 'Mr 29L OTG DIGI.', code: '494338634', brand: 'MORPHY RICHARDS', storeQty: '0', displayRequired: false, requiredQty: 6 },
      { id: 'req_5', name: 'Mr AirCrisp 25L air fryer OTG', code: '494399378', brand: 'MORPHY RICHARDS', storeQty: '0', displayRequired: true, requiredQty: 3 },
      { id: 'req_6', name: 'Bajaj kompact', code: '494622900', brand: 'BAJAJ', storeQty: '0', displayRequired: false, requiredQty: 15 },
      { id: 'req_7', name: 'ICX 140TS', code: '494459702', brand: 'BAJAJ', storeQty: '0', displayRequired: false, requiredQty: 5 },
      { id: 'req_8', name: 'Vogue starm iron', code: '494405194', brand: 'MORPHY RICHARDS', storeQty: '2', displayRequired: false, requiredQty: 10 }
    ]);
    setCopyFeedback('Reference stock request sample loaded! 📦');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      {/* Toast Feedback */}
      {copyFeedback && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-center text-xs font-bold animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2 shadow-sm">
          <Check size={16} />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* 2 MAIN SECTIONS / MENUS AS REQUESTED */}
      <div className="p-1.5 bg-zinc-200/60 dark:bg-zinc-800/80 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-col sm:flex-row gap-1">
        <button
          onClick={() => setActiveMenu('request')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeMenu === 'request'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <PackageCheck size={18} className={activeMenu === 'request' ? 'text-blue-600 dark:text-blue-400' : ''} />
          <div className="text-left">
            <span className="block leading-tight">1. Product Details for Request</span>
            <span className="text-[10px] font-normal text-zinc-500">Stock builder &amp; WhatsApp broadcast</span>
          </div>
          {stockRequests.length > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              {stockRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMenu('features')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeMenu === 'features'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={18} className={activeMenu === 'features' ? 'text-emerald-600 dark:text-emerald-400' : ''} />
          <div className="text-left">
            <span className="block leading-tight">2. Understanding Feature &amp; Handbooks</span>
            <span className="text-[10px] font-normal text-zinc-500">Same-page PDF / PPT viewer &amp; catalogs</span>
          </div>
          {productDocs.length > 0 && (
            <span className="ml-auto bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              {productDocs.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================== */}
      {/* MENU 1: PRODUCT DETAILS FOR REQUEST (STOCK REQUEST BUILDER) */}
      {/* ========================================================== */}
      {activeMenu === 'request' && (
        <div className="space-y-4">
          {/* Header Action Card */}
          <GlassCard className="p-4 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border-blue-200/50 dark:border-blue-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <PackageCheck size={20} className="text-blue-600 dark:text-blue-400" />
                  <span>Store Stock WhatsApp Request Generator</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Format: Store code, name, location, executive name, date, stock count &amp; requirements
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleClearAllRequests}
                  disabled={stockRequests.length === 0}
                  className="px-3 py-2 text-xs font-bold rounded-2xl bg-zinc-200/70 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1 disabled:opacity-40"
                  title="Clear all products from request"
                >
                  <RotateCcw size={13} />
                  <span>Clear All</span>
                </button>
                <button
                  onClick={handleCopyRequest}
                  disabled={stockRequests.length === 0}
                  className="px-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={stockRequests.length === 0}
                  className="px-4 py-2 text-xs font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 disabled:opacity-40"
                >
                  <Send size={13} />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Store Info Header Summary */}
          <GlassCard className="p-3.5 rounded-2xl border border-white/60 dark:border-white/10 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-700 dark:text-zinc-300">
              <p><strong className="text-zinc-900 dark:text-white font-sans">*Store code :</strong> {user.storeCode || '8883'}</p>
              <p><strong className="text-zinc-900 dark:text-white font-sans">*Store name :</strong> {user.storeName || 'Reliance Digital'}</p>
              <p><strong className="text-zinc-900 dark:text-white font-sans">*Location :</strong> {user.storeNameAndLocation || user.storeLocation?.address || `${user.storeName || 'JP nagar'} reliance digital`}</p>
              <p><strong className="text-zinc-900 dark:text-white font-sans">*Name :</strong> {user.name || 'Executive'}</p>
              <p><strong className="text-zinc-900 dark:text-white font-sans">*Date :</strong> {todayFormatted}</p>
            </div>
          </GlassCard>

          {/* Stock Request Items List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Products In Request ({stockRequests.length})
              </span>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                <span>+ Pick From Catalog</span>
              </button>
            </div>

            {stockRequests.length === 0 ? (
              <GlassCard className="p-8 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-3">
                <PackageCheck size={36} className="mx-auto text-zinc-400 opacity-60" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Stock Request list is clean and clear
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Search below or pick products from the catalog to build your replenishment list.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <GlassButton
                    onClick={() => setShowAddProductModal(true)}
                    variant="primary"
                    className="!py-2 !text-xs"
                  >
                    <Plus size={14} />
                    <span>Select Products</span>
                  </GlassButton>
                  <GlassButton
                    onClick={handleLoadSampleItems}
                    variant="secondary"
                    className="!py-2 !text-xs"
                  >
                    <span>Load Reference Sample (8 items)</span>
                  </GlassButton>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-2.5">
                {stockRequests.map((item) => (
                  <GlassCard
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-white/60 dark:border-white/10 space-y-2 shadow-sm"
                  >
                    {/* Top Row: Product Name & Code & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-0.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateRequestItem(item.id, 'name', e.target.value)}
                          placeholder="Product Name"
                          className="w-full text-xs font-bold bg-transparent border-b border-zinc-200 dark:border-zinc-700 pb-0.5 outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                        />
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                          <span>Code:</span>
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleUpdateRequestItem(item.id, 'code', e.target.value)}
                            placeholder="Article Code"
                            className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 outline-none w-32"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveRequestItem(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                        title="Remove product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Bottom Row: Properly Aligned Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight w-20 shrink-0">
                          Store:
                        </label>
                        <input
                          type="text"
                          value={item.storeQty}
                          onChange={(e) => handleUpdateRequestItem(item.id, 'storeQty', e.target.value)}
                          placeholder="e.g. 0, 06, not available"
                          className="w-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 outline-none text-zinc-800 dark:text-zinc-200"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight w-20 shrink-0">
                          Required:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.requiredQty}
                          onChange={(e) =>
                            handleUpdateRequestItem(
                              item.id,
                              'requiredQty',
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 outline-none text-zinc-800 dark:text-zinc-200"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRequestItem(item.id, 'displayRequired', !item.displayRequired)
                          }
                          className={`w-full text-xs font-bold py-1.5 px-3 rounded-xl border transition-all text-center ${
                            item.displayRequired
                              ? 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-200 shadow-sm'
                              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                          }`}
                        >
                          {item.displayRequired ? '✓ Display Required' : '+ Mark Display Req'}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Product Searchable Catalog (Below List for Easy Selection) */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-blue-500" />
                <span>Search &amp; Add Products From Catalog ({ISP_HANDBOOK_PRODUCTS.length})</span>
              </h3>
            </div>

            {/* Brand Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBrand('ALL')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedBrand === 'ALL'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm'
                    : 'bg-white/60 dark:bg-zinc-800/50 border-white/50 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                All Brands
              </button>
              <button
                onClick={() => setSelectedBrand('BAJAJ')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedBrand === 'BAJAJ'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white/60 dark:bg-zinc-800/50 border-white/50 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                Bajaj
              </button>
              <button
                onClick={() => setSelectedBrand('MORPHY RICHARDS')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedBrand === 'MORPHY RICHARDS'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white/60 dark:bg-zinc-800/50 border-white/50 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                Morphy Richards
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === 'ALL'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-white shadow-sm'
                    : 'bg-white/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search products by model, article code (e.g. 494459697)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-white/60 dark:border-white/10 text-xs font-medium text-zinc-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Fast Product Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => {
                const inRequest = stockRequests.some((r) => r.code === prod.articleCode);
                return (
                  <div
                    key={prod.articleCode}
                    className="p-3 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl flex items-center justify-between gap-2 hover:border-blue-400 transition-all shadow-sm"
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                          {prod.brand === 'BAJAJ' ? 'BAJAJ' : 'MR'}
                        </span>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {prod.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                        Code: {prod.articleCode} • {prod.category}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddProductToRequest(prod)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl shrink-0 transition-all ${
                        inRequest
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {inRequest ? '+ Add' : '+ Pick'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live WhatsApp Message Preview Output */}
          {stockRequests.length > 0 && (
            <GlassCard className="p-4 rounded-3xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Formatted WhatsApp Message Output
                </h4>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {stockRequests.length} product(s)
                </span>
              </div>
              <pre className="p-3 bg-zinc-900 text-emerald-400 rounded-2xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-zinc-800 shadow-inner">
                {generateWhatsAppMessage()}
              </pre>
              <div className="flex justify-end gap-2 pt-2">
                <GlassButton onClick={handleCopyRequest} variant="secondary" className="!py-2 !text-xs">
                  <Copy size={14} />
                  <span>Copy Text</span>
                </GlassButton>
                <GlassButton onClick={handleSendWhatsApp} variant="primary" className="!py-2 !text-xs">
                  <Send size={14} />
                  <span>Send to WhatsApp</span>
                </GlassButton>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MENU 2: UNDERSTANDING FEATURES & HANDBOOK (IN-PAGE BROWSER VIEWER ON SAME PAGE) */}
      {/* ========================================================================= */}
      {activeMenu === 'features' && (
        <div className="space-y-4">
          {/* Top Controls: Upload Multiple Documents & List */}
          <GlassCard className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-200/50 dark:border-emerald-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Product Features &amp; Handbook Documents</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Browse attached official PDF handbooks and PPT presentation slides directly inside the app on this same page.
                </p>
              </div>

              {/* Upload Multiple Files Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileUp size={15} />
                  )}
                  <span>{isUploading ? 'Uploading...' : '+ Add PDF / PPT'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Document Selector Tabs */}
            {productDocs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200/40 dark:border-emerald-500/20 flex gap-2 overflow-x-auto no-scrollbar">
                {productDocs.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDoc(doc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                          : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500'
                      }`}
                    >
                      <FileText size={13} className={isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-zinc-400'} />
                      <span className="truncate max-w-[150px]">{doc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* IN-PAGE EMBEDDED BROWSER VIEWER (WEB CANVAS PDF.js ON SAME PAGE) */}
          {activeDoc ? (
            <div className="space-y-2">
              {/* Document Info & Delete Row */}
              <div className="flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-zinc-900 dark:text-white truncate">
                    📄 {activeDoc.name}
                  </span>
                  <span className="text-[11px] text-zinc-400 shrink-0 font-mono">
                    ({(activeDoc.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDeleteActiveDoc(activeDoc.id, activeDoc.name)}
                    className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* RENDER PDF VIA HTML5 WEB CANVAS (PDF.js) OR PRESENTATION CARD */}
              {activeDoc.type.includes('pdf') || activeDoc.name.toLowerCase().endsWith('.pdf') ? (
                <PdfWebCanvasViewer
                  dataUrl={activeDoc.dataUrl}
                  docName={activeDoc.name}
                  isFullscreen={isFullscreenDoc}
                  onToggleFullscreen={() => setIsFullscreenDoc(!isFullscreenDoc)}
                  onDownload={() => {
                    const a = document.createElement('a');
                    a.href = activeBlobUrl || activeDoc.dataUrl;
                    a.download = activeDoc.name;
                    a.click();
                  }}
                />
              ) : (
                <div className="w-full h-[65vh] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-900 shadow-xl flex flex-col items-center justify-center p-8 text-center text-white space-y-4">
                  <FileText size={48} className="text-emerald-400 opacity-80" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{activeDoc.name}</p>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      PowerPoint presentation slides are stored securely in offline memory. Tap below to download or view slides.
                    </p>
                  </div>
                  <a
                    href={activeBlobUrl || activeDoc.dataUrl}
                    download={activeDoc.name}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <Download size={15} />
                    <span>Download Presentation</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <GlassCard className="p-12 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-3">
              <BookOpen size={40} className="mx-auto text-zinc-400 opacity-60" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  No Handbook Documents Attached Yet
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Upload your official ISP product handbook PDF or PPT presentation using the button above to view all slides, diagrams, and features on this same page.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>Upload Handbook PDF / PPT</span>
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* QUICK-ADD CATALOG PICKER MODAL */}
      {showAddProductModal && (
        <Modal
          isOpen={showAddProductModal}
          onClose={() => {
            setShowAddProductModal(false);
            setModalSearchQuery('');
          }}
          title="Pick Products for Stock Request"
        >
          <div className="space-y-3 pb-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search products by model or article code..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium outline-none text-zinc-800 dark:text-white"
              />
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
              {modalFilteredProducts.map((prod) => (
                <div
                  key={prod.articleCode}
                  onClick={() => {
                    handleAddProductToRequest(prod);
                    setShowAddProductModal(false);
                    setModalSearchQuery('');
                  }}
                  className="p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer flex items-center justify-between gap-2 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                        {prod.brand === 'BAJAJ' ? 'BAJAJ' : 'MR'}
                      </span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                        {prod.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      RD: {prod.articleCode} • {prod.category}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 shrink-0">+ Add</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductsView;
