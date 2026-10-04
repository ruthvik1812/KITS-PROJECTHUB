import React, { useState, useEffect, useRef } from 'react';
import { useApp, useAuth } from '../context/AppContext';
import { kitsCollegeConfig } from '../config/collegeConfig';
import {
  ChevronDown,
  ExternalLink,
  HelpCircle,
  FileText,
  Mail,
  Menu,
  X,
  PlusCircle,
  Check,
  FolderGit2,
  LogIn,
  LogOut,
  User,
  Bookmark
} from 'lucide-react';
import { KitsLogo } from './KitsLogo';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string, filterParam?: string) => void;
  onOpenGuidelines?: () => void;
  onOpenHelp?: () => void;
  onOpenContact?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  onOpenGuidelines,
  onOpenHelp,
  onOpenContact,
}) => {
  const { projects, wishlistIds, departments } = useApp();
  const {
    currentUser,
    isAuthenticated,
    signOut,
  } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDeptsOpen, setMobileDeptsOpen] = useState(false);
  const [mobileBatchesOpen, setMobileBatchesOpen] = useState(false);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  // Count student projects (both individual and group)
  const myProjectsCount = projects.filter(
    (p) =>
      p.submissionType === 'individual' || p.submission_type === 'individual'
        ? (p.ownerUserId === currentUser.uid ||
           p.owner_user_id === currentUser.uid ||
           p.submittedBy?.uid === currentUser.uid ||
           (currentUser.rollNumber ? p.submittedBy?.rollNumber === currentUser.rollNumber : false))
        : (p.ownerUid === currentUser.uid ||
           p.submittedBy?.uid === currentUser.uid ||
           (currentUser.rollNumber ? p.submittedBy?.rollNumber === currentUser.rollNumber : false) ||
           p.teamMembers.some(
             (m) =>
               m.name.toLowerCase() === currentUser.name.toLowerCase() ||
               (m.rollNumber && currentUser.rollNumber
                 ? m.rollNumber.toLowerCase() === currentUser.rollNumber.toLowerCase()
                 : false)
           ))
  ).length;

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNav = (page: string, filterParam?: string) => {
    setActivePage(page, filterParam);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <header ref={navRef} className="sticky top-0 z-50 w-full transition-all duration-200">
      {/* Main Navigation Bar */}
      <nav
        aria-label="Primary Navigation"
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-md border-b border-[#D5D5D5]'
            : 'bg-[#F6F6F7] border-b border-[#D5D5D5]'
        }`}
      >
        <div className="kits-container flex items-center justify-between h-[72px] sm:h-[80px] lg:h-[87px]">
          {/* Left: KITS Official University Logo */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNav('home')}
            title="Kamala Institute of Technology & Science - ProjectHub"
          >
            <div className="flex items-center gap-2.5">
              <KitsLogo variant="full" size="md" />
              <div className="hidden xl:flex flex-col border-l-2 border-[#0070C2]/30 pl-2.5 py-0.5">
                <div className="font-heading font-black text-sm text-[#19232B] tracking-tight leading-none">
                  <span className="text-[#CA0765]">Project</span>
                  <span className="text-[#0070C2]">Hub</span>
                </div>
                <div className="text-[9.5px] font-bold text-[#757F95] tracking-wider uppercase leading-tight mt-0.5">
                  Showcase
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink-0">
            <button
              onClick={() => handleNav('home')}
              className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-semibold rounded-[4px] transition-colors ${
                activePage === 'home'
                  ? 'text-[#CA0765] font-bold border-b-2 border-[#CA0765]'
                  : 'text-[#19232B] hover:text-[#CA0765]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNav('explore')}
              className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-semibold rounded-[4px] transition-colors ${
                activePage === 'explore'
                  ? 'text-[#CA0765] font-bold border-b-2 border-[#CA0765]'
                  : 'text-[#19232B] hover:text-[#CA0765]'
              }`}
            >
              Explore Projects
            </button>

            {/* Departments Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('departments')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                onClick={() => toggleDropdown('departments')}
                aria-expanded={openDropdown === 'departments'}
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-semibold text-[#19232B] hover:text-[#0070C2] flex items-center gap-1 rounded-[4px] transition-colors"
              >
                <span>Departments</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'departments' && (
                <div
                  className="absolute left-0 mt-1 w-[240px] bg-[#0070C2] text-white rounded-[4px] shadow-xl py-2 z-50 border border-blue-600 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-white/70 uppercase tracking-wider border-b border-blue-500/50">
                    B.Tech Disciplines
                  </div>
                  {(departments && departments.length > 0 ? departments : kitsCollegeConfig.departments).map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        if (!isAuthenticated) {
                          handleNav('signin');
                        } else {
                          handleNav('explore', dept.id);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-white hover:bg-white/15 flex items-center justify-between transition-colors"
                      role="menuitem"
                    >
                      <span className="truncate">{dept.code} - {dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Batches Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('batches')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                onClick={() => toggleDropdown('batches')}
                aria-expanded={openDropdown === 'batches'}
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-semibold text-[#19232B] hover:text-[#0070C2] flex items-center gap-1 rounded-[4px] transition-colors"
              >
                <span>Batches</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openDropdown === 'batches' && (
                <div
                  className="absolute left-0 mt-1 w-[200px] bg-[#0070C2] text-white rounded-[4px] shadow-xl py-2 z-50 border border-blue-600 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-white/70 uppercase tracking-wider border-b border-blue-500/50">
                    Graduation Batches
                  </div>
                  {kitsCollegeConfig.graduationYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleNav('explore', `year-${year}`)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-white hover:bg-white/15 flex items-center justify-between transition-colors"
                      role="menuitem"
                    >
                      <span>Batch of {year}</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                        Class of '{year.toString().slice(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* My Projects */}
            <button
              onClick={() => handleNav('my-group')}
              className={`px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-semibold rounded-[4px] transition-colors ${
                (activePage === 'my-group' || activePage === 'my-projects')
                  ? 'text-[#CA0765] font-bold border-b-2 border-[#CA0765]'
                  : 'text-[#19232B] hover:text-[#CA0765]'
              }`}
            >
              <span>My Projects</span>
            </button>

            {/* Create / Edit Project Action Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  handleNav('signin');
                } else {
                  handleNav('submit');
                }
              }}
              className="ml-1 xl:ml-2 inline-flex items-center gap-1 px-3 xl:px-3.5 py-2 rounded-[4px] bg-[#CA0765] hover:bg-[#A10550] text-white text-xs xl:text-[13.5px] font-semibold tracking-wide shadow-sm hover:shadow transition-all active:scale-98 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Create Project</span>
            </button>

            {/* Sign-In or User Profile Dropdown */}
            {!isAuthenticated ? (
              <button
                onClick={() => handleNav('signin')}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#0070C2] hover:bg-[#005696] text-white text-xs font-bold uppercase transition-colors shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <div
                className="relative ml-2"
                onMouseEnter={() => setOpenDropdown('profile')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  onClick={() => toggleDropdown('profile')}
                  aria-expanded={openDropdown === 'profile'}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-[#D5D5D5] bg-white text-[#19232B] hover:border-[#CA0765] text-xs font-semibold shadow-2xs transition-colors"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-500'
                        : currentUser.role === 'faculty'
                        ? 'bg-[#0070C2]'
                        : 'bg-[#CA0765]'
                    }`}
                  />
                  <span className="capitalize truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]} ({currentUser.role})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {openDropdown === 'profile' && (
                  <div
                    className="absolute right-0 mt-1 w-[260px] bg-[#0070C2] text-white rounded-[4px] shadow-xl py-2 z-50 border border-blue-600 animate-in fade-in zoom-in-95 duration-150"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-blue-500/50">
                      <div className="font-bold text-xs text-white truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-white/80 truncate">{currentUser.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold">
                          {currentUser.role}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${currentUser.membershipApproved ? 'bg-emerald-400 text-slate-900' : 'bg-amber-300 text-slate-900'}`}>
                          {currentUser.membershipApproved ? 'Approved Member' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleNav('my-group', 'tab:projects')}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-white hover:bg-white/15 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FolderGit2 className="w-3.5 h-3.5" />
                          My Projects
                        </span>
                        {myProjectsCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-white text-[#0070C2] font-bold rounded">
                            {myProjectsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleNav('my-group', 'tab:wishlist')}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-white hover:bg-white/15 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5" />
                          Personal Wishlist
                        </span>
                        {wishlistIds.length > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-pink-100 text-[#CA0765] font-bold rounded">
                            {wishlistIds.length}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="border-t border-blue-500/50 pt-1">
                      <button
                        onClick={() => {
                          signOut();
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/15 flex items-center gap-2 text-rose-200 hover:text-rose-100 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Actions & Hamburger Button */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isAuthenticated ? (
              <button
                onClick={() => handleNav('signin')}
                className="hidden xs:inline-flex px-2.5 py-1.5 rounded-[4px] bg-[#0070C2] text-white text-xs font-bold shrink-0"
              >
                Sign In
              </button>
            ) : null}

            <button
              onClick={() => handleNav('submit')}
              className="px-2.5 sm:px-3 py-1.5 rounded-[4px] bg-[#CA0765] text-white text-xs font-semibold shrink-0"
            >
              Submit
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-[4px] text-[#19232B] hover:bg-slate-200 transition-colors"
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#D5D5D5] bg-[#F6F6F7] px-4 py-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="pb-3 border-b border-[#D5D5D5] flex items-center justify-between">
              <KitsLogo size="sm" />
              <span className="text-[10px] font-bold text-[#757F95] uppercase tracking-wider">
                Estd 1997
              </span>
            </div>

            <button
              onClick={() => handleNav('home')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-[4px] transition-colors ${
                activePage === 'home' ? 'bg-[#CA0765] text-white' : 'text-[#19232B] hover:bg-slate-200'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNav('explore')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-[4px] transition-colors ${
                activePage === 'explore' ? 'bg-[#CA0765] text-white' : 'text-[#19232B] hover:bg-slate-200'
              }`}
            >
              Explore Projects
            </button>

            {/* Mobile Expandable Departments Accordion */}
            <div className="border border-slate-200 rounded-[4px] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileDeptsOpen(!mobileDeptsOpen)}
                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#19232B] flex items-center justify-between"
              >
                <span>Departments</span>
                <ChevronDown className={`w-4 h-4 text-[#757F95] transition-transform ${mobileDeptsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileDeptsOpen && (
                <div className="px-3 pb-2 pt-1 border-t border-slate-100 space-y-1">
                  {(departments && departments.length > 0 ? departments : kitsCollegeConfig.departments).map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleNav('explore', dept.id)}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:text-[#CA0765] flex items-center justify-between"
                    >
                      <span className="truncate">{dept.code} — {dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Expandable Batches Accordion */}
            <div className="border border-slate-200 rounded-[4px] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileBatchesOpen(!mobileBatchesOpen)}
                className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#19232B] flex items-center justify-between"
              >
                <span>Graduation Batches</span>
                <ChevronDown className={`w-4 h-4 text-[#757F95] transition-transform ${mobileBatchesOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileBatchesOpen && (
                <div className="px-3 pb-2 pt-1 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {kitsCollegeConfig.graduationYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleNav('explore', `year-${year}`)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-[#0070C2] hover:text-white rounded transition-colors text-slate-800"
                    >
                      Class of {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleNav('my-group', 'tab:projects')}
              className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-[4px] flex items-center justify-between transition-colors ${
                (activePage === 'my-group' || activePage === 'my-projects') ? 'bg-[#0070C2] text-white' : 'text-[#19232B] hover:bg-slate-200'
              }`}
            >
              <span>My Projects</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => handleNav('my-group', 'tab:wishlist')}
                className="w-full text-left px-3 py-2 text-sm font-semibold rounded-[4px] flex items-center justify-between text-[#CA0765] hover:bg-pink-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  <span>Personal Wishlist</span>
                </span>
                {wishlistIds.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-[#CA0765] text-white font-bold rounded-full">
                    {wishlistIds.length}
                  </span>
                )}
              </button>
            )}

            {/* Quick Informational Links in Mobile Drawer */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-xs text-[#757F95]">
              {onOpenGuidelines && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGuidelines();
                  }}
                  className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[#19232B] font-medium"
                >
                  Guidelines
                </button>
              )}
              {onOpenHelp && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenHelp();
                  }}
                  className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[#19232B] font-medium"
                >
                  Help
                </button>
              )}
            </div>

            {isAuthenticated ? (
              <div className="pt-2 border-t border-slate-300 space-y-2">
                <div className="text-xs text-[#757F95]">
                  Signed in as: <strong>{currentUser.name}</strong> ({currentUser.role})
                </div>
                <button
                  onClick={signOut}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNav('signin');
                }}
                className="w-full py-2.5 bg-[#0070C2] hover:bg-[#005696] text-white text-xs font-bold rounded transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};
