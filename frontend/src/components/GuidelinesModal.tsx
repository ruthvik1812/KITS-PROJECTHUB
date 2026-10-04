import React from 'react';
import { X, CheckCircle, FileText, AlertCircle, Award, ShieldCheck } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSubmit: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  isOpen,
  onClose,
  onNavigateSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-[4px] border-2 border-[#D5D5D5] shadow-2xl max-w-2xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        <span className="kits-cyan-corner-tl" />
        <span className="kits-cyan-corner-br" />

        {/* Header */}
        <div className="bg-[#F6F6F7] border-b border-[#D5D5D5] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#CA0765]" />
            <h2 className="font-heading font-bold text-lg sm:text-xl text-[#19232B]">
              KITS Project Submission Guidelines
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#757F95] hover:text-[#19232B] hover:bg-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm text-[#19232B] leading-relaxed">
          <p className="text-xs text-[#757F95]">
            All undergraduate engineering students of Kamala Institute of Technology and Science must adhere to the following standards prior to submitting capstones or mini projects for departmental scrutiny.
          </p>

          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-[#D5D5D5] rounded-[4px] space-y-1">
              <div className="font-bold text-[#0070C2] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-[#0070C2]" />
                1. Team Structure & JNTU Hall Ticket Numbers
              </div>
              <p className="text-xs text-[#19232B]">
                Each team may consist of 2 to 4 student members. All members must supply valid JNTU roll numbers (e.g., 21B91A0501) and document their distinct technical contributions.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-[#D5D5D5] rounded-[4px] space-y-1">
              <div className="font-bold text-[#0070C2] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-[#0070C2]" />
                2. Mandatory Source Code Repository & Live Links
              </div>
              <p className="text-xs text-[#19232B]">
                Software components must include an active public GitHub/GitLab repository with a well-formatted README. Hardware projects must include circuit schematics or SolidWorks CAD models. Provide a live URL or prototype video link whenever available.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-[#D5D5D5] rounded-[4px] space-y-1">
              <div className="font-bold text-[#0070C2] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-[#0070C2]" />
                3. Faculty Mentor Endorsement
              </div>
              <p className="text-xs text-[#19232B]">
                Every project must be guided by an appointed KITS faculty mentor. Once submitted, the project enters the mentor's review queue. Submissions will only be published publicly upon faculty approval.
              </p>
            </div>

            <div className="p-3.5 bg-[#EFF6FC] border border-[#0070C2]/30 rounded-[4px] space-y-1">
              <div className="font-bold text-[#0070C2] flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <Award className="w-4 h-4 text-[#CA0765]" />
                4. Academic Integrity & Originality
              </div>
              <p className="text-xs text-[#19232B]">
                Plagiarized projects or unverified third-party clones will be rejected immediately by the review committee. Proper citations are required for all open-source libraries.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F6F6F7] border-t border-[#D5D5D5] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#757F95] hover:text-[#19232B] text-center sm:text-left py-1 sm:py-0"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateSubmit();
            }}
            className="px-5 py-2.5 rounded-[4px] bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm text-center w-full sm:w-auto"
          >
            Proceed to Submit Project
          </button>
        </div>
      </div>
    </div>
  );
};
