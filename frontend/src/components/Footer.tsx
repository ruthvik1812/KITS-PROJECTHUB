import React from 'react';
import { kitsCollegeConfig } from '../config/collegeConfig';
import { KitsLogo } from './KitsLogo';
import { useAuth, useApp } from '../context/AppContext';
import {
  GraduationCap,
  ArrowUp,
  MapPin,
  Phone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, filterParam?: string) => void;
  onOpenGuidelines?: () => void;
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenGuidelines,
  onOpenHelp,
}) => {
  const { isAuthenticated } = useAuth();
  const { departments } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDepartmentClick = (deptId: string) => {
    if (!isAuthenticated) {
      onNavigate('signin');
    } else {
      onNavigate('explore', deptId);
    }
  };

  const handleExploreClick = () => {
    if (!isAuthenticated) {
      onNavigate('signin');
    } else {
      onNavigate('explore');
    }
  };

  const handleSubmitClick = () => {
    if (!isAuthenticated) {
      onNavigate('signin');
    } else {
      onNavigate('submit');
    }
  };

  const handleMyProjectsClick = () => {
    if (!isAuthenticated) {
      onNavigate('signin');
    } else {
      onNavigate('my-group');
    }
  };

  return (
    <footer className="kits-footer-gradient text-white pt-14 pb-8 border-t-4 border-[#CA0765]">
      <div className="kits-container">
        {/* Four Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-white/20">
          {/* Column 1: About ProjectHub */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <KitsLogo theme="white" size="md" showBadge={true} />
              <span className="text-[11px] text-white/75 uppercase tracking-wider pl-1">
                Singapur · Huzurabad · Estd 1997
              </span>
            </div>

            <p className="text-[13px] text-white/90 leading-relaxed font-light">
              The institutional engineering repository of Kamala Institute of Technology and Science. Showcasing undergraduate capstones, AI prototypes, and IoT innovations evaluated by departmental faculty.
            </p>

            <div className="text-[12px] text-white/80 bg-black/15 p-3 rounded-[4px] border border-white/10">
              <div className="font-semibold text-white">Institutional Accreditation:</div>
              <div className="text-[11px] text-white/90 mt-0.5">{kitsCollegeConfig.accreditationText}</div>
            </div>
          </div>

          {/* Column 2: Engineering Departments */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-white border-b border-white/20 pb-2">
              Departments
            </h4>
            <ul className="space-y-2 text-[13px] text-white/90">
              {(departments && departments.length > 0 ? departments : kitsCollegeConfig.departments).slice(0, 6).map((dept) => (
                <li key={dept.id}>
                  <button
                    onClick={() => handleDepartmentClick(dept.id)}
                    className="hover:underline flex items-center gap-1.5 text-left hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                    <span>{dept.name}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleExploreClick}
                  className="text-[12px] font-bold text-white underline hover:text-white/80 pt-1 block cursor-pointer"
                >
                  View All 8 Departments →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-white border-b border-white/20 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-[13px] text-white/90">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  <span>ProjectHub Home</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleExploreClick}
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  <span>Explore Project Catalogue</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleSubmitClick}
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  <span>Submit New Project</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenGuidelines}
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  <span>Submission Guidelines</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleMyProjectsClick}
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  <span>My Projects</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('signin')}
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  <span>Sign In</span>
                </button>
              </li>
              <li>
                <a
                  href="https://www.kitss.edu.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                  <span>Official College Website</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Help & Contact Information */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-white border-b border-white/20 pb-2">
              Help & Contact
            </h4>
            <div className="space-y-2.5 text-[13px] text-white/90">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />
                <span>
                  {kitsCollegeConfig.address.line1}, {kitsCollegeConfig.address.city}, Dist. {kitsCollegeConfig.address.district}, {kitsCollegeConfig.address.state} - {kitsCollegeConfig.address.pincode}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-white/80 shrink-0" />
                <a href={`tel:${kitsCollegeConfig.contact.phone}`} className="hover:underline">
                  {kitsCollegeConfig.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Back-to-Top Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/80">
          <div>
            © {new Date().getFullYear()} Kamala Institute of Technology and Science. All rights reserved.
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors border border-white/20"
            aria-label="Back to top of page"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
