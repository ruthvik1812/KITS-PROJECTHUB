import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
}

export const ExploreProjects: React.FC<ExploreProjectsProps> = ({
  initialDepartment = '',
  initialSearch = '',
  onSelectProject,
  onNavigateSubmit,
}) => {
  const { projects, refreshProjects } = useApp();

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

  // Filter Matching Catalogue
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Only showcase approved projects in public explore
        if (p.status !== 'approved') return false;

        // Ownership (Individual vs Group) Filter
        if (selectedOwnership) {
          const type = (p.submissionType || p.submission_type || 'group').toLowerCase();
          if (selectedOwnership === 'individual' && type !== 'individual') return false;
          if (selectedOwnership === 'group' && type !== 'group') return false;
        }

        // Title Prefix / Keyword Search across catalogue
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSummary = p.summary.toLowerCase().includes(q);
          const matchSubject = p.subject?.toLowerCase().includes(q);
          const matchTech = p.technologies.some((t) => t.toLowerCase().includes(q));
          const matchSkill = p.skills?.some((s) => s.toLowerCase().includes(q));
          const matchAuthor = p.teamMembers.some(
            (m) => m.name.toLowerCase().includes(q) || (m.rollNumber && m.rollNumber.toLowerCase().includes(q))
          );
          const matchMentor = p.mentor?.name ? p.mentor.name.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchSummary && !matchSubject && !matchTech && !matchSkill && !matchAuthor && !matchMentor) {
            return false;
          }
        }

        // Department
        if (selectedDept && p.departmentId !== selectedDept) return false;

        // Year
        if (selectedYear) {
          const yrNum = parseInt(selectedYear, 10);
          const matchesGrad = p.graduationYear === yrNum;
          const matchesAcademic =
            (typeof p.academic_year === 'string' && p.academic_year.includes(selectedYear)) ||
            (typeof p.academicYear === 'string' && p.academicYear.includes(selectedYear));
          if (!matchesGrad && !matchesAcademic) return false;
        }

        // Subject Filter
        if (selectedSubject && p.subject !== selectedSubject) return false;

        // Difficulty Filter
        if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;

        // Skill Filter
        if (
          selectedSkill &&
          !p.skills?.includes(selectedSkill) &&
          !p.technologies?.includes(selectedSkill)
        ) {
          return false;
        }

        // Technology
        if (selectedTech && !p.technologies.includes(selectedTech)) return false;

        // Project Classification / Type
        if (selectedType) {
          const pType = (p.projectType || (p as any).project_type || '').toLowerCase();
          const sType = selectedType.toLowerCase();
          if (pType !== sType && !pType.includes(sType) && !sType.includes(pType)) {
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
          return b.viewsCount + b.likesCount - (a.viewsCount + a.likesCount);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [projects, searchQuery, selectedDept, selectedYear, selectedTech, selectedType, selectedOwnership, sortBy]);

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
                Department ({kitsCollegeConfig.departments.length})
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Departments</option>
                {kitsCollegeConfig.departments.map((dept) => (
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
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Years</option>
                {kitsCollegeConfig.graduationYears.map((yr) => (
                  <option key={yr} value={yr.toString()}>
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
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Technologies</option>
                {kitsCollegeConfig.popularTechnologies.map((t) => (
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
                onChange={(e) => setSelectedOwnership(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">Individual & Group</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </div>

            {/* Classification */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-[#9FA6B3] uppercase tracking-widest">
                Classification
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E6ED] rounded-lg text-xs text-[#19232B] focus:outline-none focus:border-[#0070C2] focus:ring-1 focus:ring-[#0070C2]/20 transition appearance-none"
              >
                <option value="">All Classifications</option>
                {kitsCollegeConfig.projectTypes.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

          </aside>


          {/* MAIN CATALOGUE AREA (9 Cols) */}
          <main className="lg:col-span-9 space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="kits-card p-12 text-center space-y-4">
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
              /* Cards Grid (3 Columns on desktop, 2 on tablet, 1 on mobile) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={onSelectProject}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-[#D5D5D5] flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] border border-[#D5D5D5] bg-white text-[#19232B] hover:border-[#CA0765] disabled:opacity-40 text-xs font-bold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] border border-[#D5D5D5] bg-white text-[#19232B] hover:border-[#CA0765] disabled:opacity-40 text-xs font-bold transition-colors"
                >
                  <span>Next</span>
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
                  Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Departments</option>
                  {kitsCollegeConfig.departments.map((d) => (
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
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Batches</option>
                  {kitsCollegeConfig.graduationYears.map((yr) => (
                    <option key={yr} value={yr.toString()}>
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
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Technologies</option>
                  {kitsCollegeConfig.popularTechnologies.map((t) => (
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
                  onChange={(e) => setSelectedOwnership(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Projects (Individual & Group)</option>
                  <option value="individual">Individual Projects</option>
                  <option value="group">Group Projects</option>
                </select>
              </div>

              {/* Classification */}
              <div>
                <label className="block text-xs font-bold text-[#19232B] uppercase mb-1">
                  Project Classification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5D5D5] rounded-[4px] text-xs"
                >
                  <option value="">All Classifications</option>
                  {kitsCollegeConfig.projectTypes.map((pt) => (
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
