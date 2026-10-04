import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
  Send,
  Linkedin,
  Twitter,
  Mail,
  Smartphone,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useApp, useAuth } from '../context/AppContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSignIn?: () => void;
  project: {
    id: string;
    title: string;
    summary?: string;
    department_code?: string;
    departmentCode?: string;
    department_name?: string;
    departmentName?: string;
    department_id?: string;
    views_count?: number;
    viewsCount?: number;
    shares_count?: number;
    sharesCount?: number;
    thumbnail?: string;
    screenshots?: string[] | string;
    submissionType?: string;
    submission_type?: string;
    [key: string]: any;
  };
  onShareRecorded?: (newSharesCount: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onShareRecorded,
  onNavigateSignIn,
}) => {
  const { recordShare } = useApp();
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentShares, setCurrentShares] = useState<number>(
    project.shares_count ?? project.sharesCount ?? 0
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync shares count when project prop updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentShares(project.shares_count ?? project.sharesCount ?? 0);
      setCopied(false);
      setToastMessage(null);
    }
  }, [isOpen, project.shares_count, project.sharesCount]);

  // Construct absolute public details URL
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?project=${encodeURIComponent(project.id)}`
    : '';

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTrackShare = async (channel: string) => {
    try {
      const newCount = await recordShare(project.id, channel);
      if (typeof newCount === 'number') {
        setCurrentShares(newCount);
        if (onShareRecorded) {
          onShareRecorded(newCount);
        }
      }
    } catch {
      // Optimistic increment
      const updated = currentShares + 1;
      setCurrentShares(updated);
      if (onShareRecorded) {
        onShareRecorded(updated);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
      }
      setCopied(true);
      showToast('Link copied to clipboard! Share it with your classmates.');
      await handleTrackShare('copy_link');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  const shareText = `🎓 Check out "${project.title}" by KITS singapur engineering students on KITS ProjectHub!\n\n${shareUrl}`;

  // WhatsApp Share
  const handleWhatsAppShare = async () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening WhatsApp to share project...');
    await handleTrackShare('whatsapp');
  };

  // Telegram Share
  const handleTelegramShare = async () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
      `🎓 Check out "${project.title}" on KITS ProjectHub`
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening Telegram to share project...');
    await handleTrackShare('telegram');
  };

  // LinkedIn Share
  const handleLinkedInShare = async () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening LinkedIn to share project...');
    await handleTrackShare('linkedin');
  };

  // X / Twitter Share
  const handleTwitterShare = async () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out "${project.title}" on KITS ProjectHub! #KITSProjectHub #Engineering #Innovation`
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening X to share project...');
    await handleTrackShare('twitter');
  };

  // Email Share
  const handleEmailShare = async () => {
    const subject = `Check out "${project.title}" on KITS ProjectHub`;
    const body = `Hi,\n\nI wanted to share this engineering project from Kamala Institute of Technology & Science (KITS Singapur):\n\n${project.title}\n\n${project.summary || ''}\n\nView full project report, source code, and live demo here:\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showToast('Opening email client...');
    await handleTrackShare('email');
  };

  // Native Web Share API (Mobile / Tablet / Supported Browsers)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.summary || `Check out "${project.title}" on KITS ProjectHub`,
          url: shareUrl,
        });
        showToast('Shared successfully!');
        await handleTrackShare('native');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const deptCode = (
    project.departmentCode ||
    project.department_code ||
    project.departmentId ||
    project.department_id ||
    'KITS'
  ).toUpperCase();

  const viewsCount = project.views_count ?? project.viewsCount ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagram-share-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Instagram Header with Signature Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Top Title & Close Button */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    id="instagram-share-modal-title"
                    className="font-heading font-bold text-base sm:text-lg text-[#19232B] tracking-tight"
                  >
                    Share Project
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-[#CA0765] border border-pink-200">
                    {currentShares} shares
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Share instantly with classmates, teams, & faculty
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close share dialog"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project Preview Snippet (Instagram Post Preview Style) */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-3.5 rounded-xl border border-slate-200/90 relative">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#0070C2] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs uppercase">
                {deptCode}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase rounded bg-[#0070C2]/10 text-[#0070C2]">
                    KITS Singapur
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">•</span>
                  <span className="text-[10px] font-semibold text-slate-500">{deptCode}</span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#19232B] line-clamp-1 leading-snug">
                  {project.title}
                </h4>
                {project.summary && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {project.summary}
                  </p>
                )}
                {/* Live Stats Preview */}
                <div className="flex items-center gap-3 mt-2 text-[10.5px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1 text-[#0070C2]">
                    <Eye className="w-3 h-3" />
                    <span>{viewsCount} views</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#CA0765]">
                    <Share2 className="w-3 h-3" />
                    <span>{currentShares} shares</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification Alert */}
          {toastMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {!isAuthenticated ? (
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/80 to-pink-50/40 border border-blue-200 text-center space-y-3.5 my-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0070C2] flex items-center justify-center mx-auto font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#19232B]">Student Sign-In Required</h4>
                <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                  Please sign in with your verified student account to share projects across WhatsApp, Telegram, LinkedIn, and copy links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateSignIn) {
                    onNavigateSignIn();
                  }
                }}
                className="px-5 py-2 rounded-lg bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Sign In with Student Account</span>
              </button>
            </div>
          ) : (
            <>
              {/* Instagram-Style Quick Share Channels Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Share to
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 pt-1">
                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="Share via WhatsApp"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
                      <MessageCircle className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-emerald-700">
                      WhatsApp
                    </span>
                  </button>

                  {/* Instagram / Direct Copy */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="Copy Link"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white'
                      }`}
                    >
                      {copied ? <Check className="w-6 h-6" /> : <Copy className="w-5 h-5" />}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-[#CA0765]">
                      {copied ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>

                  {/* Telegram */}
                  <button
                    type="button"
                    onClick={handleTelegramShare}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="Share via Telegram"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
                      <Send className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-[#229ED9]">
                      Telegram
                    </span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    type="button"
                    onClick={handleLinkedInShare}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="Share on LinkedIn"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
                      <Linkedin className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-[#0A66C2]">
                      LinkedIn
                    </span>
                  </button>

                  {/* X / Twitter */}
                  <button
                    type="button"
                    onClick={handleTwitterShare}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="Share on X (Twitter)"
                  >
                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
                      <Twitter className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-black">
                      X / Post
                    </span>
                  </button>

                  {/* Email */}
                  <button
                    type="button"
                    onClick={handleEmailShare}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="Share via Email"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EA4335] text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-[#EA4335]">
                      Email
                    </span>
                  </button>

                  {/* Native System Share / More */}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                    title="More Sharing Options"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-transform">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900">
                      More...
                    </span>
                  </button>
                </div>
              </div>

              {/* Direct Link Input Box */}
              <div className="space-y-1.5 pt-2">
                <label
                  htmlFor="instagram-share-link-input"
                  className="text-xs font-semibold text-slate-700 block"
                >
                  Project Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="instagram-share-link-input"
                    ref={inputRef}
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#CA0765] hover:bg-[#A10550] text-white active:scale-95'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
