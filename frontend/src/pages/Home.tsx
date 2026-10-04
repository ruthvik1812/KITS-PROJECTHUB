import React, { useState, useMemo, useEffect } from 'react';
import { useApp, useAuth } from '../context/AppContext';
import { kitsCollegeConfig } from '../config/collegeConfig';
import {
  Search,
  ArrowRight,
  PlusCircle,
  Layers,
  Users,
  Building2,
  Cpu,
  Brain,
  Zap,
  Radio,
  Cog,
  BarChart3,
  ChevronRight,
  Globe,
  FileCheck,
} from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string, filterParam?: string) => void;
  onOpenGuidelines?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  onOpenGuidelines,
}) => {
  const { projects, refreshProjects, departments } = useApp();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    refreshProjects();
  }, []);

  // Search input state
  const [heroSearch, setHeroSearch] = useState('');

  // Compute 4 Dynamic Metric Values from Approved Records
  const approvedProjects = useMemo(
    () => projects.filter((p) => p.status === 'approved'),
    [projects]
  );

  const totalApprovedCount = approvedProjects.length;

  const totalTeamsCount = useMemo(() => {
    // Count actual student contributors from original_authors (the persisted source)
    // For individual projects this is 1; for group projects it's 4-6.
    // Fall back to teamMembers for legacy records.
    const allMembers = approvedProjects.flatMap(
      (p) => (p as any).original_authors?.length
        ? (p as any).original_authors
        : p.teamMembers || []
    );
    return allMembers.length;
  }, [approvedProjects]);

  const departmentsRepresentedCount = useMemo(() => {
    const deptIds = new Set(approvedProjects.map((p) => p.departmentId));
    return deptIds.size;
  }, [approvedProjects]);

  const liveDemosCount = useMemo(() => {
    return approvedProjects.filter(
      (p) => (p.links?.website && p.links.website.trim().length > 0) || ((p as any).live_demo_url && (p as any).live_demo_url.trim().length > 0)
    ).length;
  }, [approvedProjects]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onNavigate('signin');
      return;
    }
    const query = heroSearch.trim();
    if (!query) return;
    onNavigate('explore', `search:${encodeURIComponent(query)}`);
  };

  const getDepartmentIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-[#CA0765]" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-[#CA0765]" />;
      case 'Radio':
        return <Radio className="w-5 h-5 text-[#CA0765]" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#CA0765]" />;
      case 'Cog':
        return <Cog className="w-5 h-5 text-[#CA0765]" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-[#CA0765]" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-[#CA0765]" />;
      default:
        return <Layers className="w-5 h-5 text-[#CA0765]" />;
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Campus-Media Hero Section */}
      <section className="relative overflow-hidden bg-[#19232B] text-white min-h-[480px] sm:min-h-[530px] flex items-center border-b-4 border-[#CA0765]">
        {/* Background Image of KITS ProjectHub Innovation Center */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/kits-hero-bg.jpg"
            alt="KITS ProjectHub Engineering & Innovation Center"
            className="w-full h-full object-cover object-right md:object-center transform scale-[1.02] transition-transform duration-1000 ease-out"
            loading="eager"
          />
          {/* Executive Multi-Layer Dark Gradient Wash for Superb Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#19232B] via-[#19232B]/85 to-[#19232B]/40 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#19232B] via-transparent to-[#19232B]/50" />
        </div>

        {/* Hero Content */}
        <div className="kits-container relative z-10 py-12 sm:py-16 w-full">
          <div className="max-w-3xl space-y-6">
            {/* KITS ProjectHub Title */}
            <h1 className="font-heading font-bold text-banner-title tracking-tight text-white leading-tight">
              KITS <span className="text-[#CA0765]">Project</span>
              <span className="text-[#03A9F5]">Hub</span>
            </h1>

            {/* Short Explanation */}
            <p className="text-[16px] sm:text-[18px] text-white/90 leading-[1.8] font-light max-w-2xl">
              The official engineering innovation portal of Kamala Institute of Technology and Science. Explore accredited capstones, edge AI prototypes, IoT systems, and live student demos.
            </p>

            {/* Project Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative max-w-xl flex items-center bg-white rounded-[4px] p-1 sm:p-1.5 shadow-xl border border-white/20"
            >
              <div className="pl-2 sm:pl-3 pr-1.5 sm:pr-2 text-[#757F95]">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search capstone title, student, tech..."
                className="w-full py-2 text-xs sm:text-sm text-[#19232B] placeholder-[#757F95] focus:outline-none min-w-0"
                aria-label="Search college projects"
              />
              {heroSearch && (
                <button
                  type="button"
                  onClick={() => setHeroSearch('')}
                  className="px-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    onNavigate('signin');
                  }
                }}
                disabled={isAuthenticated && !heroSearch.trim()}
                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all shrink-0 shadow-sm ${
                  isAuthenticated && !heroSearch.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
                    : 'bg-[#CA0765] hover:bg-[#A10550] text-white cursor-pointer hover:shadow'
                }`}
              >
                Search
              </button>
            </form>

            {/* Hero Main Project Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[4px] bg-[#0070C2] hover:bg-[#005696] text-white text-[15px] font-semibold tracking-wide transition-all shadow-md focus-visible:ring-2 focus-visible:ring-white w-full sm:w-auto"
              >
                <span>Explore Projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onNavigate('signin');
                  } else {
                    onNavigate('submit');
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[4px] bg-white hover:bg-slate-100 text-[#19232B] border-2 border-white text-[15px] font-semibold tracking-wide transition-all shadow-md w-full sm:w-auto"
              >
                <PlusCircle className="w-4 h-4 text-[#CA0765]" />
                <span>Submit Project</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Bordered Metric Cards */}
      <section className="kits-container" aria-label="College Project Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1: Approved Projects */}
          <div className="kits-card">
            <span className="kits-cyan-corner-tl" />
            <span className="kits-cyan-corner-br" />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] font-bold text-[#757F95] uppercase tracking-wider">
                  Approved Projects
                </div>
                <div className="text-3xl sm:text-4xl font-black font-heading text-[#CA0765] mt-1">
                  {totalApprovedCount}
                </div>
                <div className="text-xs text-[#757F95] mt-1">
                  Certified by faculty review committee
                </div>
              </div>
              <div className="w-10 h-10 rounded-[4px] bg-[#CA0765]/10 text-[#CA0765] flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Metric 2: Project Teams */}
          <div className="kits-card">
            <span className="kits-cyan-corner-tl" />
            <span className="kits-cyan-corner-br" />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] font-bold text-[#757F95] uppercase tracking-wider">
                  Project Teams
                </div>
                <div className="text-3xl sm:text-4xl font-black font-heading text-[#0070C2] mt-1">
                  {totalTeamsCount}+
                </div>
                <div className="text-xs text-[#757F95] mt-1">
                  Active undergraduate researchers
                </div>
              </div>
              <div className="w-10 h-10 rounded-[4px] bg-[#0070C2]/10 text-[#0070C2] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Metric 3: Departments Represented */}
          <div className="kits-card">
            <span className="kits-cyan-corner-tl" />
            <span className="kits-cyan-corner-br" />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] font-bold text-[#757F95] uppercase tracking-wider">
                  Departments Represented
                </div>
                <div className="text-3xl sm:text-4xl font-black font-heading text-[#19232B] mt-1">
                  {departmentsRepresentedCount} of 8
                </div>
                <div className="text-xs text-[#757F95] mt-1">
                  Active engineering branches
                </div>
              </div>
              <div className="w-10 h-10 rounded-[4px] bg-slate-100 text-[#19232B] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Metric 4: Live Demos */}
          <div className="kits-card">
            <span className="kits-cyan-corner-tl" />
            <span className="kits-cyan-corner-br" />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] font-bold text-[#757F95] uppercase tracking-wider">
                  Live Demos
                </div>
                <div className="text-3xl sm:text-4xl font-black font-heading text-emerald-600 mt-1">
                  {liveDemosCount}
                </div>
                <div className="text-xs text-[#757F95] mt-1">
                  Hosted web &amp; cloud prototypes
                </div>
              </div>
              <div className="w-10 h-10 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Engineering Department Cards */}
      <section className="kits-container" aria-label="Academic Departments">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 pb-3 border-b border-[#D5D5D5]">
          <div>
            <div className="text-xs font-bold text-[#0070C2] uppercase tracking-wider mb-1">
              Academic Divisions
            </div>
            <h2 className="font-heading font-semibold text-section-heading text-[#19232B]">
              Engineering Departments
            </h2>
            <p className="text-xs text-[#757F95] mt-1">
              Select a specialized engineering division to browse verified undergraduate capstones
            </p>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onNavigate('signin');
              } else {
                onNavigate('explore');
              }
            }}
            className="text-xs font-bold text-[#0070C2] hover:text-[#005696] hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(departments && departments.length > 0 ? departments : kitsCollegeConfig.departments).map((dept) => {
            const count = approvedProjects.filter(
              (p) =>
                (p.departmentId && p.departmentId.toLowerCase() === dept.id.toLowerCase()) ||
                (p.departmentCode && p.departmentCode.toLowerCase() === dept.code.toLowerCase())
            ).length;
            return (
              <div
                key={dept.id}
                onClick={() => {
                  if (!isAuthenticated) {
                    onNavigate('signin');
                  } else {
                    onNavigate('explore', dept.id);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!isAuthenticated) {
                      onNavigate('signin');
                    } else {
                      onNavigate('explore', dept.id);
                    }
                  }
                }}
                className="kits-card group cursor-pointer flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[#CA0765]"
              >
                <span className="kits-cyan-corner-tl" />
                <span className="kits-cyan-corner-br" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-[4px] bg-[#F6F6F7] group-hover:bg-[#CA0765]/10 flex items-center justify-center transition-colors">
                      {getDepartmentIcon(dept.icon)}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#0070C2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {dept.code}
                    </span>
                  </div>

                  <h3 className="font-heading font-semibold text-[20px] text-[#19232B] group-hover:text-[#CA0765] transition-colors leading-snug mb-3">
                    {dept.name}
                  </h3>
                </div>

                <div className="border-t border-[#D5D5D5] pt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#19232B]">
                    {count} Approved {count === 1 ? 'Project' : 'Projects'}
                  </span>
                  <span className="font-bold text-[#0070C2] group-hover:text-[#CA0765] flex items-center gap-1 group-hover:translate-x-1 transition-all">
                    <span>Browse Projects</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Compact How to Submit Section */}
      <section className="kits-container" aria-label="How to Submit Guidelines">
        <div className="bg-[#F6F6F7] border-2 border-[#D5D5D5] rounded-[4px] p-5 sm:p-8 lg:p-10 relative">
          <span className="kits-cyan-corner-tl" />
          <span className="kits-cyan-corner-br" />

          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold text-[#0070C2] uppercase tracking-wider">
              Student Capstone Workflow
            </span>
            <h2 className="font-heading font-semibold text-section-heading text-[#19232B] mt-1">
              How to Submit Your Project
            </h2>
            <p className="text-xs sm:text-sm text-[#757F95] mt-2">
              Follow these simple steps to register, document, and certify your undergraduate capstone
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 bg-white border border-[#D5D5D5] rounded-[4px] relative">
              <div className="w-8 h-8 rounded-[4px] bg-[#CA0765] text-white font-bold text-xs flex items-center justify-center mb-3">
                01
              </div>
              <h3 className="font-heading font-bold text-base text-[#19232B] mb-1">
                Team &amp; Abstract
              </h3>
              <p className="text-xs text-[#757F95] leading-relaxed">
                Enter your title, problem statement, JNTU roll numbers, and assign specific team member engineering contributions.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#D5D5D5] rounded-[4px] relative">
              <div className="w-8 h-8 rounded-[4px] bg-[#0070C2] text-white font-bold text-xs flex items-center justify-center mb-3">
                02
              </div>
              <h3 className="font-heading font-bold text-base text-[#19232B] mb-1">
                Repository &amp; Links
              </h3>
              <p className="text-xs text-[#757F95] leading-relaxed">
                Connect your active GitHub repository, live web demo URL, and YouTube demonstration video.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#D5D5D5] rounded-[4px] relative">
              <div className="w-8 h-8 rounded-[4px] bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                03
              </div>
              <h3 className="font-heading font-bold text-base text-[#19232B] mb-1">
                Faculty Scrutiny
              </h3>
              <p className="text-xs text-[#757F95] leading-relaxed">
                Assigned faculty mentors evaluate the system architecture, rubric scoring, and calibrate technical depth.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#D5D5D5] rounded-[4px] relative">
              <div className="w-8 h-8 rounded-[4px] bg-[#03A9F5] text-white font-bold text-xs flex items-center justify-center mb-3">
                04
              </div>
              <h3 className="font-heading font-bold text-base text-[#19232B] mb-1">
                Public Showcase
              </h3>
              <p className="text-xs text-[#757F95] leading-relaxed">
                Approved projects are permanently catalogued in the college showcase for prospective recruiters and alumni.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onNavigate('signin');
                } else {
                  onNavigate('submit');
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[4px] bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md focus-visible:ring-2 focus-visible:ring-[#0070C2] w-full sm:w-auto"
            >
              <span>Submit Project Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenGuidelines && (
              <button
                onClick={onOpenGuidelines}
                className="inline-flex items-center justify-center px-5 py-3 rounded-[4px] bg-white border border-[#D5D5D5] text-[#19232B] hover:border-[#CA0765] text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto"
              >
                View Detailed Guidelines
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
