import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, X, Info } from 'lucide-react';
import { recordProjectShare } from '../services/apiClient';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    summary?: string;
  };
  onShareRecorded?: (newSharesCount: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onShareRecorded,
}) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Construct absolute public details URL
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?project=${encodeURIComponent(project.id)}`
    : '';

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
      }
      setCopied(true);
      // Record share action on backend
      recordProjectShare(project.id, 'copy_link')
        .then((res) => {
          if (res?.shares_count && onShareRecorded) {
            onShareRecorded(res.shares_count);
          }
        })
        .catch(() => {});
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback: select text inside the input
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-[8px] max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close share dialog"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-[4px] hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[#0070C2]">
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4 text-[#0070C2]" />
          </div>
          <div>
            <h3 id="share-modal-title" className="font-heading font-bold text-base text-[#19232B]">
              Share Project
            </h3>
            <p className="text-xs text-slate-500">
              Copy link to share on WhatsApp, Telegram, or email.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-200/80">
          <div className="font-bold text-xs text-[#19232B] line-clamp-1">{project.title}</div>
          {project.summary && (
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
              {project.summary}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="share-link-input" className="text-xs font-semibold text-slate-700 block">
            Public Project URL
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-link-input"
              ref={inputRef}
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded font-mono text-slate-800 focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#CA0765] hover:bg-[#A10550] text-white shadow-2xs'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Verification Note */}
        <div className="flex items-start gap-2 p-2.5 rounded bg-blue-50/60 border border-blue-100 text-[11px] text-[#4A6B82] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-[#0070C2] shrink-0 mt-0.5" />
          <span>Share actions and copied links; recipient delivery is not verified.</span>
        </div>
      </div>
    </div>
  );
};
