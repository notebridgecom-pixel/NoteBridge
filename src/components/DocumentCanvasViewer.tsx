import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { NoteItem } from '../types';
import { getNotePdfData } from '../utils/storage';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize, 
  Minimize, 
  FileText, 
  AlertCircle,
  RefreshCw,
  Lock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

// Configure pdfjs worker to reliably render inside sandboxed iframes without Chrome browser plugin blocks
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (e) {
  console.warn('PDF.js worker setup fallback:', e);
}

interface DocumentCanvasViewerProps {
  note: NoteItem;
  pdfUrl?: string | null;
  className?: string;
  initialScale?: number;
  onPageChange?: (page: number, total: number) => void;
  isPurchased?: boolean;
  maxPreviewPages?: number;
  onBuy?: () => void;
}

export const DocumentCanvasViewer: React.FC<DocumentCanvasViewerProps> = ({
  note,
  pdfUrl,
  className = '',
  initialScale = 1.2,
  onPageChange,
  isPurchased = false,
  maxPreviewPages = 3,
  onBuy,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isImageSource, setIsImageSource] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showPageLimitAlert, setShowPageLimitAlert] = useState<boolean>(false);

  // Render task cancellation ref to avoid racing render tasks
  const renderTaskRef = useRef<any>(null);

  // Calculate maximum navigable preview pages
  const effectiveMaxPages = isPurchased ? numPages : Math.min(maxPreviewPages, numPages);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setShowPageLimitAlert(false);

    const loadDocument = async () => {
      try {
        let sourceData: string | ArrayBuffer | undefined = note.pdfData || (note.pdfUrl?.startsWith('data:') ? note.pdfUrl : undefined);
        if (!sourceData && note.id) {
          sourceData = (await getNotePdfData(note.id)) || undefined;
        }
        if (!sourceData && pdfUrl) {
          sourceData = pdfUrl;
        }

        // Check if source is an image (JPEG/PNG/WebP)
        if (typeof sourceData === 'string' && (sourceData.startsWith('data:image/') || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(sourceData))) {
          if (!isMounted) return;
          setIsImageSource(true);
          setImageSrc(sourceData);
          setNumPages(1);
          setCurrentPage(1);
          setLoading(false);
          return;
        }

        if (note.previewImageUrl && (note.previewImageUrl.startsWith('data:image/') || !sourceData)) {
          if (note.previewImageUrl.startsWith('data:image/')) {
            setIsImageSource(true);
            setImageSrc(note.previewImageUrl);
            setNumPages(1);
            setCurrentPage(1);
            setLoading(false);
            return;
          }
        }

        // Parse PDF Source
        let loadingTask: any;

        if (typeof sourceData === 'string' && sourceData.startsWith('data:application/pdf;base64,')) {
          const base64Clean = sourceData.replace(/^data:application\/pdf;base64,/, '');
          const binaryStr = atob(base64Clean);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else if (sourceData) {
          loadingTask = pdfjsLib.getDocument(sourceData);
        } else if (pdfUrl) {
          loadingTask = pdfjsLib.getDocument(pdfUrl);
        } else {
          // If no raw source, check if previewImageUrl exists
          if (note.previewImageUrl) {
            setIsImageSource(true);
            setImageSrc(note.previewImageUrl);
            setLoading(false);
            return;
          }
          throw new Error('No PDF or document content available to preview.');
        }

        const loadedDoc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setCurrentPage(1);
        setLoading(false);
        if (onPageChange) {
          onPageChange(1, isPurchased ? loadedDoc.numPages : Math.min(maxPreviewPages, loadedDoc.numPages));
        }
      } catch (err: any) {
        console.error('Error loading PDF in canvas viewer:', err);
        if (!isMounted) return;
        
        // If PDF loading fails, check if note has sample image
        if (note.previewImageUrl) {
          setIsImageSource(true);
          setImageSrc(note.previewImageUrl);
          setLoading(false);
        } else {
          setError(err?.message || 'Unable to render document preview in canvas.');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel?.();
      }
    };
  }, [note, pdfUrl, isPurchased, maxPreviewPages]);

  // Render Page or Image onto Canvas
  useEffect(() => {
    if (isImageSource && imageSrc && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelRatio = window.devicePixelRatio || 1;
        const isRotated90 = rotation % 180 !== 0;
        const baseWidth = isRotated90 ? img.height : img.width;
        const baseHeight = isRotated90 ? img.width : img.height;

        const maxDisplayWidth = 840;
        const scaleFactor = Math.min(1, maxDisplayWidth / baseWidth);
        const displayWidth = baseWidth * scaleFactor * scale;
        const displayHeight = baseHeight * scaleFactor * scale;

        canvas.width = displayWidth * pixelRatio;
        canvas.height = displayHeight * pixelRatio;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);
        ctx.translate(displayWidth / 2, displayHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const drawW = (isRotated90 ? displayHeight : displayWidth);
        const drawH = (isRotated90 ? displayWidth : displayHeight);

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        // Add Watermark overlay on preview if unpurchased
        if (!isPurchased) {
          ctx.restore();
          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);
          ctx.font = 'bold 24px sans-serif';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
          ctx.textAlign = 'center';
          ctx.translate(displayWidth / 2, displayHeight / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(`NoteBridge Preview • Page 1 of ${Math.min(maxPreviewPages, numPages)}`, 0, -40);
          ctx.fillText(`Verified Notes • Buy to Unlock Full PDF`, 0, 20);
        }

        ctx.restore();
      };
      img.src = imageSrc;
      return;
    }

    if (!pdfDoc) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        // Cancel previous render task if still in flight
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {
            // ignore
          }
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Handle high DPI screens
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * pixelRatio, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        // Overlay Diagonal Preview Watermark if not purchased
        if (!isPurchased) {
          context.save();
          const w = canvas.width;
          const h = canvas.height;
          context.font = `bold ${Math.round(28 * pixelRatio)}px sans-serif`;
          context.fillStyle = 'rgba(30, 41, 59, 0.13)';
          context.textAlign = 'center';
          context.translate(w / 2, h / 2);
          context.rotate(-Math.PI / 4);
          context.fillText(`NOTEBRIDGE PREVIEW • PAGE ${currentPage} OF ${effectiveMaxPages}`, 0, -60 * pixelRatio);
          context.fillText(`Clean Unwatermarked PDF Unlocked on Purchase`, 0, 20 * pixelRatio);
          context.restore();
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Canvas render page notice:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, isImageSource, imageSrc, isPurchased, effectiveMaxPages, maxPreviewPages]);

  const handleNextPage = () => {
    if (currentPage < effectiveMaxPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setShowPageLimitAlert(false);
      if (onPageChange) onPageChange(next, isPurchased ? numPages : effectiveMaxPages);
    } else if (!isPurchased && numPages > effectiveMaxPages) {
      setShowPageLimitAlert(true);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setShowPageLimitAlert(false);
      if (onPageChange) onPageChange(prev, isPurchased ? numPages : effectiveMaxPages);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.0, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, prev - 0.2));
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
      onDragStart={(e) => { e.preventDefault(); return false; }}
      className={`flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 text-white relative select-none ${className}`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* Top Floating / Fixed Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="font-mono text-xs text-slate-300 truncate max-w-[140px] sm:max-w-[220px]">
            {note.pdfFileName || `${note.title}.pdf`}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
            isPurchased 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isPurchased ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Full Access (Page {currentPage}/{numPages})</span>
              </>
            ) : isImageSource ? (
              'Sample Photo (Page 1/1)'
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>3-Page Preview (Page {currentPage}/{effectiveMaxPages})</span>
              </>
            )}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Page Navigation */}
          {!isImageSource && (
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-200">
                {currentPage} / {isPurchased ? numPages : effectiveMaxPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= effectiveMaxPages && (isPurchased || currentPage >= effectiveMaxPages)}
                className={`p-1 rounded-lg transition ${
                  currentPage >= effectiveMaxPages && !isPurchased && numPages > effectiveMaxPages
                    ? 'text-amber-400 hover:bg-amber-950/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent'
                }`}
                title={currentPage >= effectiveMaxPages && !isPurchased ? 'Remaining pages locked (Purchase to unlock)' : 'Next Page'}
              >
                {currentPage >= effectiveMaxPages && !isPurchased && numPages > effectiveMaxPages ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Zoom & View Controls */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 font-mono text-[10px] font-bold text-slate-300 hover:text-white transition"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate Control */}
          <button
            onClick={handleRotate}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3-Page Free Preview Lock Limit Notice */}
      {!isPurchased && (currentPage === effectiveMaxPages || showPageLimitAlert) && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-20 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-amber-200">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>End of Free 3-Page Preview.</strong> Unlock all <strong>{numPages || note.totalPages} pages</strong> without watermark.
            </span>
          </div>
          {onBuy && (
            <button
              onClick={onBuy}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs shadow-sm transition flex items-center gap-1 flex-shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>Unlock for ₹{note.price}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Canvas Render Area */}
      <div 
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
        onDragStart={(e) => { e.preventDefault(); return false; }}
        className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col justify-start items-center min-h-[450px] sm:min-h-[520px] bg-slate-950 relative select-none"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 text-slate-400 gap-3">
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
            <span className="text-xs font-semibold">Rendering document preview...</span>
          </div>
        )}

        {error && (
          <div className="max-w-md my-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Document Preview Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This note includes verified study material uploaded by <strong>{note.sellerName}</strong>. You can unlock and download the full clean copy.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div 
            className="transition-transform duration-150 flex flex-col justify-center items-center relative my-auto"
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
          >
            <canvas
              ref={canvasRef}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
              className="rounded-xl shadow-2xl border border-slate-800 bg-white max-w-full pointer-events-none"
            />
            {/* Anti-copy transparent shield */}
            <div 
              className="absolute inset-0 w-full h-full cursor-default"
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
              onDragStart={(e) => { e.preventDefault(); return false; }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

