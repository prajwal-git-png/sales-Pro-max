import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  LayoutList, 
  Columns, 
  Search, 
  X, 
  Loader2, 
  AlertCircle,
  FileText
} from 'lucide-react';

// Initialize PDF.js worker locally for 100% offline & fast rendering without console warnings
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PdfWebCanvasViewerProps {
  dataUrl: string;
  docName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onDownload?: () => void;
}

export const PdfWebCanvasViewer: React.FC<PdfWebCanvasViewerProps> = ({
  dataUrl,
  docName,
  isFullscreen = false,
  onToggleFullscreen,
  onDownload
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('continuous');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search in PDF
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchingPages, setMatchingPages] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Single page mode canvas ref
  const singleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  
  // Continuous scroll mode container ref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // 1. Convert dataUrl (base64 or blob) to Uint8Array & load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setCurrentPage(1);

    const loadDocument = async () => {
      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

        if (dataUrl.startsWith('data:')) {
          const parts = dataUrl.split(',');
          const base64 = parts[1];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument(dataUrl);
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load PDF via PDF.js:', err);
        setError(err?.message || 'Could not parse PDF document. It may be corrupt or encrypted.');
        setLoading(false);
      }
    };

    if (dataUrl) {
      loadDocument();
    } else {
      setLoading(false);
      setError('No document data provided.');
    }

    return () => {
      isCancelled = true;
    };
  }, [dataUrl]);

  // 2. Render Single Page Mode
  const renderSinglePage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !singleCanvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = singleCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Sharp high-dpi rendering
      const viewport = page.getViewport({ scale: scale * dpr, rotation });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('Single page render warning:', err);
      }
    }
  }, [pdfDoc, scale, rotation]);

  useEffect(() => {
    if (viewMode === 'single' && pdfDoc) {
      renderSinglePage(currentPage);
    }
  }, [viewMode, pdfDoc, currentPage, scale, rotation, renderSinglePage]);

  // 3. Render Continuous Mode Page
  const renderContinuousPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement) => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale * dpr, rotation });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn(`Continuous page ${pageNum} render warning:`, err);
      }
    }
  }, [pdfDoc, scale, rotation]);

  // Auto-render continuous pages when visible or when scale/rotation changes
  useEffect(() => {
    if (viewMode === 'continuous' && pdfDoc && numPages > 0) {
      pageRefs.current.forEach((canvas, pageNum) => {
        renderContinuousPage(pageNum, canvas);
      });
    }
  }, [viewMode, pdfDoc, numPages, scale, rotation, renderContinuousPage]);

  // 4. Search text in PDF
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) {
      setMatchingPages([]);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    const matches: number[] = [];

    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .toLowerCase();

        if (pageText.includes(query)) {
          matches.push(i);
        }
      }
      setMatchingPages(matches);
      if (matches.length > 0) {
        goToPage(matches[0]);
      }
    } catch (err) {
      console.warn('Error during PDF text search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const goToPage = (pageNumber: number) => {
    const target = Math.max(1, Math.min(numPages, pageNumber));
    setCurrentPage(target);

    if (viewMode === 'continuous') {
      const element = document.getElementById(`pdf-page-container-${target}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const zoomIn = () => setScale(prev => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  const zoomOut = () => setScale(prev => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  const fitWidth = () => setScale(1.0);
  const rotateDoc = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className={`flex flex-col bg-zinc-950 text-zinc-100 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl transition-all ${
      isFullscreen ? 'fixed inset-3 z-50 rounded-2xl' : 'h-[78vh]'
    }`}>
      {/* Top Main Toolbar */}
      <div className="bg-zinc-900/90 backdrop-blur-md px-3 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0">
        {/* Left: Document Info & View Toggle */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs" title={docName}>
              {docName}
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">
              {numPages > 0 ? `${numPages} pages • Web Canvas` : 'PDF Document'}
            </p>
          </div>
        </div>

        {/* Center: Page Controls */}
        {numPages > 0 && (
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-2xl border border-zinc-700/60 text-xs">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg hover:bg-zinc-700 disabled:opacity-30 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
              <input
                type="number"
                min="1"
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) goToPage(val);
                }}
                className="w-10 text-center bg-zinc-900 border border-zinc-700 rounded-md py-0.5 text-white outline-none focus:border-emerald-500"
              />
              <span className="text-zinc-400">/</span>
              <span className="text-zinc-300">{numPages}</span>
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1 rounded-lg hover:bg-zinc-700 disabled:opacity-30 transition-colors"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Right: Zoom, Rotate, Search, Layout & Fullscreen Controls */}
        <div className="flex items-center gap-1 text-xs">
          {/* View mode toggle (Continuous vs Single page) */}
          <div className="hidden sm:flex bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-700/60 mr-1">
            <button
              onClick={() => setViewMode('continuous')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'continuous' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Continuous Vertical Scroll"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'single' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Single Slide / Page"
            >
              <Columns size={14} />
            </button>
          </div>

          {/* Thumbnails toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded-xl border transition-all ${
              showThumbnails
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700'
            }`}
            title="Toggle Page Thumbnails"
          >
            <span className="text-[10px] font-bold px-1">Pages</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-zinc-800/80 rounded-xl border border-zinc-700/60 p-0.5">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={fitWidth}
              className="px-1.5 text-[10px] font-mono text-zinc-300 font-bold hover:text-white"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={rotateDoc}
            className="p-1.5 rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-700"
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-xl border transition-all ${
              showSearch
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700'
            }`}
            title="Search Text in Document"
          >
            <Search size={14} />
          </button>

          {/* Download */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-1.5 rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-700"
              title="Download File"
            >
              <Download size={14} />
            </button>
          )}

          {/* Fullscreen */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-700"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Optional Search Bar Overlay */}
      {showSearch && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search keyword in this PDF (e.g. wattage, 2200W, warranty)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-8 py-1.5 bg-zinc-800 text-xs rounded-xl border border-zinc-700 text-white outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setMatchingPages([]);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-40"
          >
            {isSearching ? <Loader2 size={12} className="animate-spin" /> : 'Find'}
          </button>
          {matchingPages.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <span>{matchingPages.length} found:</span>
              <div className="flex gap-1 overflow-x-auto max-w-[200px]">
                {matchingPages.map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/40 rounded text-emerald-300 font-bold"
                  >
                    p.{p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Canvas Document Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Page Thumbnails Sidebar */}
        {showThumbnails && numPages > 0 && (
          <div className="w-28 sm:w-36 bg-zinc-900 border-r border-zinc-800 overflow-y-auto p-2 space-y-2 shrink-0 animate-in slide-in-from-left duration-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 px-1">
              Slides / Pages
            </div>
            {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-full text-left p-1.5 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                  currentPage === p
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-zinc-400'
                }`}
              >
                <div className="w-full aspect-[3/4] bg-zinc-800/60 rounded flex items-center justify-center text-xs font-bold">
                  📄 {p}
                </div>
                <span className="text-[10px] font-mono">Slide {p}</span>
              </button>
            ))}
          </div>
        )}

        {/* Document Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-zinc-950/90 flex flex-col items-center p-3 sm:p-6"
        >
          {loading && (
            <div className="m-auto flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Loader2 size={36} className="text-emerald-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Rendering Web Canvas...</p>
                <p className="text-xs text-zinc-400">Loading document pages directly inside browser memory</p>
              </div>
            </div>
          )}

          {error && (
            <div className="m-auto max-w-md p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-center space-y-3 text-rose-300">
              <AlertCircle size={36} className="mx-auto text-rose-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold">Unable to Render PDF</p>
                <p className="text-xs text-rose-200/80">{error}</p>
              </div>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download File Directly</span>
                </button>
              )}
            </div>
          )}

          {/* SINGLE PAGE VIEW */}
          {!loading && !error && viewMode === 'single' && (
            <div className="flex flex-col items-center my-auto transition-all">
              <div className="bg-white rounded-xl shadow-2xl p-1 border border-zinc-700 overflow-hidden">
                <canvas ref={singleCanvasRef} className="block max-w-full" />
              </div>
              <div className="mt-3 text-xs text-zinc-400 font-mono">
                Slide {currentPage} of {numPages}
              </div>
            </div>
          )}

          {/* CONTINUOUS VERTICAL SCROLL VIEW */}
          {!loading && !error && viewMode === 'continuous' && (
            <div className="w-full flex flex-col items-center space-y-6 max-w-4xl">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  id={`pdf-page-container-${pageNum}`}
                  className="flex flex-col items-center transition-all w-full"
                >
                  <div className="w-full flex items-center justify-between px-2 mb-1 text-[11px] text-zinc-400 font-mono">
                    <span>Page {pageNum}</span>
                    <span>{docName}</span>
                  </div>
                  <div className="bg-white rounded-xl shadow-2xl p-1 border border-zinc-700 overflow-hidden max-w-full">
                    <canvas
                      ref={(el) => {
                        if (el) {
                          pageRefs.current.set(pageNum, el);
                          renderContinuousPage(pageNum, el);
                        } else {
                          pageRefs.current.delete(pageNum);
                        }
                      }}
                      className="block max-w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfWebCanvasViewer;
