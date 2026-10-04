import React, { useState, useMemo, useEffect } from 'react';
import { useApp, useAuth } from '../context/AppContext';
import { kitsCollegeConfig } from '../config/collegeConfig';
import { ProjectCard } from '../components/ProjectCard';
import { Project } from '../types';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  PlusCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface ExploreProjectsProps {
  initialDepartment?: string;
  initialSearch?: string;
  onSelectProject: (project: Project) => void;
  onNavigateSubmit: () => void;
  onNavigateSignIn?: () => void;
  onNavigateWishlist?: (highlightProjectId?: string) => void;
}

export const ExploreProjects: React.FC<ExploreProjectsProps> = ({
  initialDepartment = '',
  initialSearch = '',
  onSelectProject,
  onNavigateSubmit,
  onNavigateSignIn,
  onNavigateWishlist,
}) => {
  const { projects, refreshProjects, departments } = useApp();
  const { isAuthenticated } = useAuth();

  const handleCardSelect = (project: Project) => {
    if (!isAuthenticated) {
      if (onNavigateSignIn) {
        onNavigateSignIn();
      }
      return;
    }
    onSelectProject(project);
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const computeInitialSearch = () => {
    if (initialSearch) return initialSearch;
    if (initialDepartment.startsWith('search:')) {
      return decodeURIComponent(initialDepartment.replace('search:', ''));
    }
    return '';
  };

  const computeInitialDept = () => {
    if (!initialDepartment) return '';
    if (initialDepartment.startsWith('search:') || initialDepartment.startsWith('year-') || initialDepartment === 'featured') {
      return '';
    }
    return initialDepartment;
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(computeInitialSearch);
  const [selectedDept, setSelectedDept] = useState(computeInitialDept);
  const [selectedYear, setSelectedYear] = useState(
    initialDepartment && initialDepartment.startsWith('year-')
      ? initialDepartment.replace('year-', '')
      : ''
  );
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState<'' | 'individual' | 'group'>('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'title'>('newest');

  // Derive distinct subjects and skills from catalogue
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.subject) set.add(p.subject);
    });
    return Array.from(set).sort();
  }, [projects]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.skills) p.skills.forEach((s) => set.add(s));
      if (p.technologies) p.technologies.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [projects]);

  // Dynamic available filter options derived from AppContext departments, database, and active project records
  const availableDepartments = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();

    // 1. From AppContext departments (official database records)
    (departments || []).forEach((d) => {
      if (d && d.id) {
        map.set(d.id.toLowerCase().trim(), {
          id: d.id,
          code: d.code || d.id.toUpperCase(),
          name: d.name || d.id,
        });
      }
    });

    // 2. From actual project records
    projects.forEach((p) => {
      const dId = (p.departmentId || (p as any).department_id || '').toLowerCase().trim();
      const dCode = p.departmentCode || (p as any).department_code || dId.toUpperCase();
      const dName = p.departmentName || (p as any).department_name || dCode;
      if (dId && !map.has(dId)) {
        map.set(dId, { id: dId, code: dCode, name: dName });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, projects]);

  const availableTechnologies = useMemo(() => {
    const map = new Map<string, string>(); // lowerKey -> displayName

    // Start with popular technology presets
    kitsCollegeConfig.popularTechnologies.forEach((tech) => {
      if (tech && tech.trim()) {
        map.set(tech.toLowerCase().trim(), tech.trim());
      }
    });

    // Aggregate from loaded project records (technologies and tools arrays)
    projects.forEach((p) => {
      const list = [
        ...(Array.isArray(p.technologies) ? p.technologies : []),
        ...(Array.isArray(p.tools) ? p.tools : []),
      ];
      list.forEach((t) => {
        if (t && typeof t === 'string' && t.trim()) {
          const key = t.toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, t.trim());
          }
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();

    // Config defaults
    kitsCollegeConfig.graduationYears.forEach((yr) => set.add(String(yr)));

    // Project records
    projects.forEach((p) => {
      if (p.graduationYear) set.add(String(p.graduationYear));
      const acad = p.academicYear || p.academic_year;
      if (acad) {
        const matches = acad.match(/\d{4}/g);
        if (matches) matches.forEach((m) => set.add(m));
        set.add(acad);
      }
    });

    // Sort 4-digit years descending
    const numericYears = Array.from(set)
      .filter((s) => /^\d{4}$/.test(s))
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

    return numericYears.length > 0 ? numericYears : ['2031', '2030', '2029', '2028', '2027'];
  }, [projects]);

  const availableTypes = useMemo(() => {
    const map = new Map<string, string>();

    // Default types
    kitsCollegeConfig.projectTypes.forEach((pt) => {
      if (pt && pt.trim()) map.set(pt.toLowerCase().trim(), pt.trim());
    });

    // Ensure standard institutional types are always selectable
    map.set('individual project', 'Individual Project');
    map.set('major capstone project', 'Major Capstone Project');

    // Add any custom types from projects
    projects.forEach((p) => {
      const t = p.projectType || (p as any).project_type;
      if (t && typeof t === 'string' && t.trim()) {
        const key = t.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, t.trim());
        }
      }
    });

    return Array.from(map.values());
  }, [projects]);

  const getSelectedDeptLabel = (idOrCode: string) => {
    const found = availableDepartments.find(
      (d) => d.id.toLowerCase() === idOrCode.toLowerCase() || d.code.toLowerCase() === idOrCode.toLowerCase()
    );
    return found ? found.code : idOrCode.toUpperCase();
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Loading & Error Simulation for robust UX
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // React to prop changes (e.g. clicking department in navbar or search from hero)
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setSelectedDept('');
      setSelectedYear('');
    } else if (initialDepartment.startsWith('search:')) {
      const q = decodeURIComponent(initialDepartment.replace('search:', ''));
      setSearchQuery(q);
      setSelectedDept('');
      setSelectedYear('');
    } else if (initialDepartment.startsWith('year-')) {
      setSelectedYear(initialDepartment.replace('year-', ''));
      setSelectedDept('');
    } else if (initialDepartment) {
      setSelectedDept(initialDepartment);
      setSelectedYear('');
    }
    setCurrentPage(1);
  }, [initialDepartment, initialSearch]);

  // Robust, Case-Insensitive Filter Matching Catalogue
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Only showcase approved projects in public explore
        if (p.status && p.status !== 'approved') return false;

        // 1. Ownership (Individual vs Group) Filter
        if (selectedOwnership) {
          const subType = (p.submissionType || (p as any).submission_type || (p.official_group_id ? 'group' : 'individual')).toLowerCase();
          const pType = (p.projectType || (p as any).project_type || '').toLowerCase();
          const isInd = subType === 'individual' || pType.includes('individual');
          if (selectedOwnership === 'individual' && !isInd) return false;
          if (selectedOwnership === 'group' && isInd) return false;
        }

        // 2. Title Prefix / Keyword Search across catalogue
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (p.title || '').toLowerCase().includes(q);
          const matchSummary = (p.summary || '').toLowerCase().includes(q);
          const matchSubject = (p.subject || '').toLowerCase().includes(q);
          const matchProblem = (p.problemStatement || (p as any).problem_statement || '').toLowerCase().includes(q);
          const matchDept =
            (p.departmentName || (p as any).department_name || '').toLowerCase().includes(q) ||
            (p.departmentCode || (p as any).department_code || '').toLowerCase().includes(q) ||
            (p.departmentId || (p as any).department_id || '').toLowerCase().includes(q);
          const matchTech = [
            ...(Array.isArray(p.technologies) ? p.technologies : []),
            ...(Array.isArray(p.tools) ? p.tools : [])
          ].some((t) => String(t).toLowerCase().includes(q));
          const matchSkill = (Array.isArray(p.skills) ? p.skills : []).some((s) => String(s).toLowerCase().includes(q));
          const matchAuthor = (Array.isArray(p.teamMembers) ? p.teamMembers : []).some(
            (m) => (m.name && m.name.toLowerCase().includes(q)) || (m.rollNumber && m.rollNumber.toLowerCase().includes(q))
          ) || (Array.isArray(p.original_authors) ? p.original_authors : []).some(
            (a: any) => (a.name && a.name.toLowerCase().includes(q)) || (a.rollNumber && a.rollNumber.toLowerCase().includes(q))
          );
          const matchMentor = p.mentor?.name
            ? p.mentor.name.toLowerCase().includes(q)
            : (p.faculty_mentor_name ? p.faculty_mentor_name.toLowerCase().includes(q) : false);

          if (!matchTitle && !matchSummary && !matchSubject && !matchProblem && !matchDept && !matchTech && !matchSkill && !matchAuthor && !matchMentor) {
            return false;
          }
        }

        // 3. Department Filter (Matches departmentId, code, or name)
        if (selectedDept) {
          const sDept = selectedDept.toLowerCase().trim();
          const dId = (p.departmentId || (p as any).department_id || '').toLowerCase().trim();
          const dCode = (p.departmentCode || (p as any).department_code || '').toLowerCase().trim();
          const dName = (p.departmentName || (p as any).department_name || '').toLowerCase().trim();
          const matchesDept =
            dId === sDept ||
            dCode === sDept ||
            dName === sDept ||
            dName.includes(sDept) ||
            sDept.includes(dId) ||
            sDept.includes(dCode);
          if (!matchesDept) return false;
        }

        // 4. Graduation Year / Academic Year Filter
        if (selectedYear) {
          const sYearClean = selectedYear.replace(/[^\d-]/g, '').trim();
          const yrNum = parseInt(sYearClean.split('-')[0], 10);
          const gradYearStr = String(p.graduationYear || '');
          const acadYearStr = String(p.academicYear || p.academic_year || '');
          const matchesGrad = gradYearStr.includes(sYearClean) || (Boolean(yrNum) && p.graduationYear === yrNum);
          const matchesAcademic =
            acadYearStr.toLowerCase().includes(selectedYear.toLowerCase()) ||
            (sYearClean.length >= 4 && acadYearStr.includes(sYearClean));
          if (!matchesGrad && !matchesAcademic) return false;
        }

        // 5. Technology Filter (Case-insensitive check across technologies & tools)
        if (selectedTech) {
          const sTech = selectedTech.toLowerCase().trim();
          const techs = [
            ...(Array.isArray(p.technologies) ? p.technologies : []),
            ...(Array.isArray(p.tools) ? p.tools : [])
          ].map((t) => String(t).toLowerCase().trim());
          const matchesTech = techs.some((t) => t === sTech || t.includes(sTech) || sTech.includes(t));
          if (!matchesTech) return false;
        }

        // 6. Project Classification / Type Filter
        if (selectedType) {
          const sType = selectedType.toLowerCase().trim();
          const pType = (p.projectType || (p as any).project_type || '').toLowerCase().trim();
          const subType = (p.submissionType || (p as any).submission_type || '').toLowerCase().trim();
          const matchesType =
            pType === sType ||
            pType.includes(sType) ||
            sType.includes(pType) ||
            (sType.includes('individual') && (subType === 'individual' || pType.includes('individual'))) ||
            (sType.includes('capstone') && (subType === 'group' || pType.includes('capstone') || pType.includes('major')));
          if (!matchesType) return false;
        }

        // 7. Subject Filter
        if (selectedSubject && p.subject !== selectedSubject) return false;

        // 8. Difficulty Filter
        if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;

        // 9. Skill Filter
        if (selectedSkill) {
          const sSkill = selectedSkill.toLowerCase().trim();
          const skillsList = [
            ...(Array.isArray(p.skills) ? p.skills : []),
            ...(Array.isArray(p.technologies) ? p.technologies : []),
            ...(Array.isArray(p.tools) ? p.tools : [])
          ].map((s) => String(s).toLowerCase().trim());
          if (!skillsList.some((s) => s === sSkill || s.includes(sSkill))) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (sortBy === 'popular') {
          return (b.viewsCount + b.likesCount) - (a.viewsCount + a.likesCount);
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [projects, searchQuery, selectedDept, selectedYear, selectedTech, selectedType, selectedOwnership, selectedSubject, selectedDifficulty, selectedSkill, sortBy]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const activeFiltersCount = [
    selectedDept,
    selectedYear,
    selectedTech,
    selectedType,
    selectedOwnership,
    searchQuery,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDept('');
    setSelectedYear('');
    setSelectedTech('');
    setSelectedType('');
    setSelectedOwnership('');
    setSelectedSubject('');
    setSelectedDifficulty('');
    setSelectedSkill('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Banner Title Header (Inner-page banner title 45px/700) */}
      <div className="bg-[#19232B] text-white py-10 border-b-4 border-[#CA0765] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#19232B] via-[#19232B]/90 to-[#0070C2]/30 pointer-events-none" />
        <div className="kits-container relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-[#03A9F5] uppercase tracking-wider mb-1">
              Official Project Repository
            </div>
            <h1 className="font-heading font-bold text-banner-title text-white tracking-tight">
              Explore Projects
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
              Browse approved capstones, research publications, and prototypes across all 8 Kamala Institute departments.
            </p>
          </div>

          <button
            onClick={onNavigateSubmit}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[4px] bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Project</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Filter Sidebar on Desktop, Catalogue on Right */}
      <div className="kits-container">
        {/* Mobile Filter Toggle & Quick Search Row */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#757F95] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, student roll number..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#D5D5D5] rounded-[4px] text-xs text-[#19232B] focus:outline-none focus:border-[#CA0765]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#757F95]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] bg-white border border-[#D5D5D5] text-[#19232B] text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#0070C2]" />
            <span>Filters ({activeFiltersCount})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-3 kits-card sticky top-28 !p-5 space-y-5">
            <span className="kits-cyan-corner-tl" />
            <span className="kits-cyan-corner-br" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#19232B]">
                <Filter className="w-4 h-4 text-[#CA0765]" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-[#757F95] uppercase tracking-wide hover:text-[#CA0765] transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#B0B8C8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. IoT, Drone, Rover..."
                  className="w-full pl-8 pr-7 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] placeholder-[#B0B8C8] focus:outline-none focus:border-[#CA0765] focus:ring-1 focus:ring-[#CA0765]/20 transition"
                  aria-label="Filter by keyword"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B0B8C8] hover:text-[#757F95]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Department ({availableDepartments.length})
              </label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} – {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Graduation Year */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Graduation Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Batch of {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Technology */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Technology
              </label>
              <select
                value={selectedTech}
                onChange={(e) => {
                  setSelectedTech(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Technologies</option>
                {availableTechnologies.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Ownership */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Project Ownership
              </label>
              <select
                value={selectedOwnership}
                onChange={(e) => {
                  setSelectedOwnership(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">Individual & Group</option>
                <option value="individual">Individual Projects</option>
                <option value="group">Group Capstone Projects</option>
              </select>
            </div>

            {/* Classification */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Classification
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Classifications</option>
                {availableTypes.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

          </aside>


          {/* MAIN CATALOGUE AREA (9 Cols) */}
          <main className="lg:col-span-9 space-y-6">
            {/* Active Filters Pill Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-[#E2E6ED] rounded-[4px] shadow-xs">
                <span className="text-[11px] font-bold text-[#757F95] uppercase tracking-wider mr-1">
                  Active Filters:
                </span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0070C2] text-xs font-semibold">
                    <span>Search: "{searchQuery}"</span>
                    <button
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                      className="hover:text-red-600 transition-colors"
                      aria-label="Remove search filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedDept && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#CA0765] text-xs font-semibold">
                    <span>Dept: {getSelectedDeptLabel(selectedDept)}</span>
                    <button
                      onClick={() => { setSelectedDept(''); setCurrentPage(1); }}
                      className="hover:text-red-600 transition-colors"
                      aria-label="Remove department filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedYear && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <span>Batch: {selectedYear}</span>
                    <button
                      onClick={() => { setSelectedYear(''); setCurrentPage(1); }}
                      className="hover:text-red-600 transition-colors"
                      aria-label="Remove year filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedTech && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
                    <span>Tech: {selectedTech}</span>
                    <button
                      onClick={() => { setSelectedTech(''); setCurrentPage(1); }}
                      className="hover:text-red-600 transition-colors"
                      aria-label="Remove technology filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedOwnership && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    <span>{selectedOwnership === 'individual' ? 'Individual' : 'Group Capstone'}</span>
                    <button
                      onClick={() => { setSelectedOwnership(''); setCurrentPage(1); }}
                      className="hover:text-red-600 transition-colors"
                      aria-label="Remove ownership filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedType && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
                    <span>Type: {selectedType}</span>
                    <button
                      onClick={() => { setSelectedType(''); setCurrentPage(1); }}
                      className="hover:text-red-600 transition-colors"
                      aria-label="Remove type filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-[#CA0765] hover:underline ml-auto"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Toolbar: Result Count & Sort Order */}
            <div className="bg-[#F6F6F7] border border-[#D5D5D5] rounded-[4px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-[#19232B] font-semibold">
                Showing{' '}
                <span className="font-bold text-[#CA0765]">
                  {filteredProjects.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-[#CA0765]">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)}
                </span>{' '}
                of <span className="font-bold text-[#0070C2]">{filteredProjects.length}</span> verified projects
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[#757F95] font-semibold">Sort Order:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-[#D5D5D5] rounded-[4px] px-3 py-1.5 text-xs text-[#19232B] font-bold focus:outline-none focus:border-[#CA0765]"
                  aria-label="Sort projects"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular (Views & Likes)</option>
                  <option value="title">Title (A - Z)</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Error State with Retry Button */}
            {hasError ? (
              <div className="kits-card p-10 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                <h3 className="font-heading font-bold text-xl text-[#19232B]">
                  Unable to Load Projects Catalogue
                </h3>
                <p className="text-xs text-[#757F95] max-w-md mx-auto">
                  A transient network error occurred while querying the project collection.
                </p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#0070C2] text-white text-xs font-bold uppercase tracking-wider"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Catalogue Query</span>
                </button>
              </div>
            ) : isLoading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="kits-card animate-pulse space-y-4">
                    <div className="aspect-16/9 bg-slate-200 rounded-[2px]" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              /* Helpful No-Results State */
              <div className="kits-card p-8 sm:p-12 text-center space-y-4">
                <span className="kits-cyan-corner-tl" />
                <span className="kits-cyan-corner-br" />
                <div className="w-12 h-12 rounded-[4px] bg-slate-100 text-[#757F95] flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-[#19232B]">
                  No Matching Projects Found
                </h3>
                <p className="text-xs text-[#757F95] max-w-md mx-auto">
                  No verified projects matched your active search query or department filters. Try broadening your terms or reset the filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            ) : (
              /* Cards Grid (3 Columns on wide desktop, 2 on laptop/tablet, 1 on mobile) */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={handleCardSelect}
                    onNavigateSignIn={onNavigateSignIn}
                    onNavigateWishlist={onNavigateWishlist}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-[#D5D5D5] flex items-center justify-between gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-[4px] border border-[#D5D5D5] bg-white text-[#19232B] hover:border-[#CA0765] disabled:opacity-40 text-xs font-bold transition-colors shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">Previous</span>
                </button>

                {/* Mobile page indicator */}
                <div className="sm:hidden text-xs font-semibold text-[#757F95]">
                  Page <span className="font-bold text-[#19232B]">{currentPage}</span> of {totalPages}
                </div>

                {/* Tablet / Desktop page numbered buttons with windowing */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // For more than 7 pages, only show first, last, and window around current
                    if (
                      totalPages > 7 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - currentPage) > 1
                    ) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return <span key={pageNum} className="text-[#757F95] px-1">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-[4px] transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#CA0765] text-white font-bold'
                            : 'bg-white border border-[#D5D5D5] text-[#19232B] hover:border-[#CA0765]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-[4px] border border-[#D5D5D5] bg-white text-[#19232B] hover:border-[#CA0765] disabled:opacity-40 text-xs font-bold transition-colors shrink-0"
                >
                  <span className="hidden xs:inline sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Accessible Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
        >
          <div className="bg-white w-full max-w-sm h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#D5D5D5] pb-3">
                <h3 className="font-heading font-bold text-lg text-[#19232B]">
                  Filter Catalogue
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded text-[#757F95]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-[#19232B] uppercase mb-1">
                  Department ({availableDepartments.length})
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-[#19232B] uppercase mb-1">
                  Graduation Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Batches</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Batch of {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technology */}
              <div>
                <label className="block text-xs font-bold text-[#19232B] uppercase mb-1">
                  Technology Stack
                </label>
                <select
                  value={selectedTech}
                  onChange={(e) => {
                    setSelectedTech(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Technologies</option>
                  {availableTechnologies.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Ownership Type */}
              <div>
                <label className="block text-xs font-bold text-[#19232B] uppercase mb-1">
                  Project Ownership
                </label>
                <select
                  value={selectedOwnership}
                  onChange={(e) => {
                    setSelectedOwnership(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Projects (Individual & Group)</option>
                  <option value="individual">Individual Projects</option>
                  <option value="group">Group Capstone Projects</option>
                </select>
              </div>

              {/* Classification */}
              <div>
                <label className="block text-xs font-bold text-[#19232B] uppercase mb-1">
                  Project Classification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Classifications</option>
                  {availableTypes.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-[#D5D5D5] space-y-2">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-[4px] bg-[#CA0765] text-white text-xs font-bold uppercase"
              >
                Apply Filters ({filteredProjects.length} Results)
              </button>
              <button
                onClick={() => {
                  handleClearFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-2 rounded-[4px] bg-[#F6F6F7] text-[#19232B] text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
