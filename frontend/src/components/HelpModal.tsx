import React from 'react';
import { X, HelpCircle, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { kitsCollegeConfig } from '../config/collegeConfig';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-[4px] border-2 border-[#D5D5D5] shadow-2xl max-w-xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        <span className="kits-cyan-corner-tl" />
        <span className="kits-cyan-corner-br" />

        {/* Header */}
        <div className="bg-[#F6F6F7] border-b border-[#D5D5D5] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[#0070C2]" />
            <h2 className="font-heading font-bold text-lg sm:text-xl text-[#19232B]">
              KITS ProjectHub Help & FAQs
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#19232B] leading-relaxed">
          <div className="space-y-1">
            <div className="font-bold text-sm text-[#0070C2]">
              Q: Who can view projects on KITS ProjectHub?
            </div>
            <p className="text-[#757F95]">
              Anyone, including recruiters, prospective students, and industry partners, can freely browse all approved projects without logging in.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-sm text-[#0070C2]">
              Q: Why is my submitted project not showing in Explore Projects?
            </div>
            <p className="text-[#757F95]">
              All new student submissions enter a <code>pending</code> review state. Once your assigned faculty mentor reviews and approves the submission, it immediately becomes public in the Explore catalogue.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-sm text-[#0070C2]">
              Q: How do I test the faculty review workflow?
            </div>
            <p className="text-[#757F95]">
              Use the role switcher in the top navigation bar to switch your perspective to <strong>Faculty</strong>. Then navigate to <strong>Faculty Review</strong> to evaluate submissions.
            </p>
          </div>

          <div className="border-t border-[#D5D5D5] pt-4 mt-2 space-y-2">
            <div className="font-bold text-sm text-[#CA0765]">Need Institutional Assistance?</div>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-[#CA0765]" />
              <span>{kitsCollegeConfig.contact.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-[#0070C2]" />
              <span>{kitsCollegeConfig.contact.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-[#CA0765] shrink-0 mt-0.5" />
              <span>{kitsCollegeConfig.address.line1}, {kitsCollegeConfig.address.city}, Telangana</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F6F6F7] border-t border-[#D5D5D5] px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[4px] bg-[#0070C2] text-white text-xs font-semibold hover:bg-[#005696] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
