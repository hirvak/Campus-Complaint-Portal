import React, { useState, useEffect } from 'react';
import { ZoomIn, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

export function ComplaintPhoto({ imageUrl, title = 'Complaint Photo', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim() || loadError) {
    return null;
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const fullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
    ? imageUrl
    : `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" />
          Attached Photo
        </h4>
        <span className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">Click photo to enlarge</span>
      </div>

      {/* Thumbnail Card */}
      <div
        onClick={() => setIsOpen(true)}
        className="group relative cursor-pointer inline-block overflow-hidden rounded-[8px] border border-[#DED8CC] dark:border-[#344155] bg-[#FAF7F0] dark:bg-[#182235] transition-all duration-150 hover:shadow-md hover:border-[#B51232] dark:hover:border-[#C51F3D] max-w-md w-full"
      >
        <div className="max-h-72 overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/20">
          <img
            src={fullUrl}
            alt={title}
            onError={() => setLoadError(true)}
            className="w-full h-auto max-h-72 object-contain group-hover:scale-102 transition-transform duration-200"
            loading="lazy"
          />
        </div>

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[1px]">
          <ZoomIn className="w-4 h-4" />
          <span>Click to Enlarge</span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-[#DED8CC] dark:border-[#344155] flex items-center justify-between bg-[#FAF7F0] dark:bg-[#202B3D]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC]">
                  {title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] hover:bg-[#DED8CC]/40 dark:hover:bg-[#344155] rounded-[4px] transition-colors"
                  title="Open full image in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#60708A] dark:text-[#AEB9C9] hover:text-[#10213A] dark:hover:text-[#F8FAFC] hover:bg-[#DED8CC]/40 dark:hover:bg-[#344155] rounded-[4px] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 sm:p-6 flex-1 flex items-center justify-center overflow-auto bg-[#F5F0E7]/40 dark:bg-black/30 max-h-[calc(90vh-60px)]">
              <img
                src={fullUrl}
                alt={title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-[6px] shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintPhoto;
