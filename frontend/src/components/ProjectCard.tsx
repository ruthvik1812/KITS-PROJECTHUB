import React, { useState } from 'react';
import { kitsCollegeConfig } from '../config/collegeConfig';
import { useApp, useAuth } from '../context/AppContext';
import { ShareModal } from './ShareModal';
import { recordProjectShare } from '../services/apiClient';
import {
  Users,
  User,
  ExternalLink,
  Globe,
  Tag,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Github,
  FileText,
  Video,
  Star,
  Presentation,
  Eye,
  Share2,
  Bookmark
} from 'lucide-react';

interface ProjectCardProps {
  project: any;
  onSelect: (project: any) => void;
  compact?: boolean;
  onNavigateSignIn?: () => void;
  onNavigateWishlist?: (highlightProjectId?: string) => void;
  isHighlighted?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onNavigateSignIn,
  onNavigateWishlist,
  isHighlighted = false,
}) => {
  const { isProjectSaved, saveToWishlist } = useApp();
  const { isAuthenticated } = useAuth();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharesCount, setSharesCount] = useState<number>(project.shares_count || project.sharesCount || 0);
  const viewsCount = project.views_count || project.viewsCount || 0;
  const isSaved = isProjectSaved(project.id);
  const [isSaving, setIsSaving] = useState(false);

  const handleCardClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      if (onNavigateSignIn) {
        onNavigateSignIn();
        return;
      }
    }
    onSelect(project);
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      saveToWishlist(project.id); // preserves pending wishlist ID in storage
      if (onNavigateSignIn) {
        onNavigateSignIn();
      }
      return;
    }

    if (isSaved) {
      if (onNavigateWishlist) {
        onNavigateWishlist(project.id);
      }
      return;
    }

    setIsSaving(true);
    try {
      await saveToWishlist(project.id);
      if (onNavigateWishlist) {
        onNavigateWishlist(project.id);
      }
    } catch (err: any) {
      console.warn('Failed to save to wishlist:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?project=${encodeURIComponent(project.id)}`
      : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.summary || 'Check out this engineering capstone on KITS ProjectHub!',
          url: shareUrl,
        });
        recordProjectShare(project.id, 'native')
          .then((res) => {
            if (typeof res?.shares_count === 'number') {
              setSharesCount(res.shares_count);
            }
          })
          .catch(() => {});
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        recordProjectShare(project.id, 'copy_link')
          .then((res) => {
            if (typeof res?.shares_count === 'number') {
              setSharesCount(res.shares_count);
            }
          })
          .catch(() => {});
        setIsShareModalOpen(true);
        return;
      }
    } catch {}

    setIsShareModalOpen(true);
  };

  const authors = Array.isArray(project.original_authors)
    ? project.original_authors
    : Array.isArray(project.teamMembers)
      ? project.teamMembers
      : [];

  const tools = Array.isArray(project.tools)
    ? project.tools
    : Array.isArray(project.technologies)
      ? project.technologies
      : [];

  const submissionType = project.submission_type || project.submissionType || (project.official_group_id ? 'group' : 'individual');
  const isIndividual = submissionType === 'individual';

  const liveDemo = project.live_demo_url || project.links?.website;
  const repo = project.repo_url || project.links?.repository;
  const documentation = project.documentation_url || project.links?.documentation;
  const video = project.video_url || project.links?.video;
  const presentation = project.presentation_url || project.presentationUrl || project.links?.presentation;
  // Resolve clean branch/department code (e.g. 'CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'AI & ML', 'IT')
  // Eliminates the generic fallback word "Engineering"
  const resolveDeptBadge = () => {
    const rawId = (project.department_id || project.departmentId || '').toLowerCase();
    const rawCode = (project.departmentCode || project.department_code || '').trim();
    const rawName = (project.departmentName || project.department_name || '').trim();

    // 1. If project has a specific department code that is not generic "engineering"
    if (rawCode && rawCode.toLowerCase() !== 'engineering') {
      return rawCode.toUpperCase();
    }

    // 2. Match department_id against kitsCollegeConfig departments
    if (rawId && rawId !== 'engineering') {
      const match = kitsCollegeConfig.departments.find(
        d => d.id.toLowerCase() === rawId || d.code.toLowerCase() === rawId
      );
      if (match) return match.code;
      return rawId.toUpperCase();
    }

    // 3. Match departmentName against kitsCollegeConfig departments
    if (rawName && rawName.toLowerCase() !== 'engineering') {
      const match = kitsCollegeConfig.departments.find(
        d => d.name.toLowerCase() === rawName.toLowerCase() || d.shortName.toLowerCase() === rawName.toLowerCase()
      );
      if (match) return match.code;
      // If no match found, strip "Engineering" out to ensure the word is never displayed
      const cleaned = rawName.replace(/\bEngineering\b/gi, '').trim();
      if (cleaned) return cleaned;
    }

    return '';
  };

  const deptBadge = resolveDeptBadge();
  const batchYear = project.academic_year || (project.graduationYear ? `Batch of ${project.graduationYear}` : 'Batch of 2027');
  const projectType = project.projectType || project.project_type || (isIndividual ? 'Individual Project' : 'Major Capstone Project');

  const rawThumb = project.thumbnail || (project.images && project.images[0]) || (project.screenshots && project.screenshots[0]) || '';
  const hasCustomImage = rawThumb && !rawThumb.includes('photo-1581092160607') && !rawThumb.includes('photo-1518770660439');

  const getClassificationBadgeStyle = () => {
    if (isIndividual) {
      return 'bg-[#0070C2] text-white border-blue-400';
    }
    if (projectType.includes('RTRP')) return 'bg-purple-600 text-white border-purple-400';
    if (projectType.includes('Hackathon')) return 'bg-amber-600 text-white border-amber-400';
    if (projectType.includes('Mini')) return 'bg-sky-600 text-white border-sky-400';
    return 'bg-[#CA0765] text-white border-pink-400';
  };

  return (
    <div
      onClick={() => handleCardClick()}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className={`kits-card group flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-[#CA0765] bg-white transition-all hover:shadow-md relative ${
        isHighlighted ? 'ring-3 ring-[#CA0765] shadow-xl scale-[1.01]' : ''
      }`}
    >
      {/* Signature Cyan Corner Accents */}
      <span className="kits-cyan-corner-tl" />
      <span className="kits-cyan-corner-br" />

      <div>
        {/* Card Thumbnail / Tech Banner */}
        <div className="relative aspect-16/9 overflow-hidden rounded-[2px] bg-slate-900 mb-3 select-none">
          {/* Save to Wishlist Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmarkClick}
            disabled={isSaving}
            aria-label={isSaved ? `Saved in Wishlist: ${project.title}` : `Save ${project.title} to Wishlist`}
            title={isSaved ? "Saved in your Wishlist - Click to view" : "Save to Wishlist"}
            className={`absolute top-2 right-2 z-20 px-2 py-1 rounded-[4px] backdrop-blur-xs transition-all flex items-center gap-1 text-[10.5px] font-bold shadow-md cursor-pointer ${
              isSaved
                ? 'bg-[#CA0765] text-white border border-[#CA0765]'
                : 'bg-black/60 hover:bg-black/85 text-white border border-white/20'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Wishlist'}</span>
          </button>

          {hasCustomImage ? (
            <img
              src={rawThumb}
              alt={project.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#19232B] via-[#0B2545] to-[#0070C2]/80 flex flex-col justify-between p-3.5 relative overflow-hidden group-hover:brightness-105 transition-all">
              {/* Subtle Tech Grid / Circuit Watermark Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #03A9F5 1px, transparent 0)`,
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#CA0765]/20 rounded-full blur-xl pointer-events-none" />

              {/* Top Row: Batch Year Badge */}
              <div className="flex items-center justify-end z-10">
                <span className="text-[10px] font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs border border-white/10">
                  {batchYear}
                </span>
              </div>

              {/* Center Engineering Graphic & Snippet */}
              <div className="my-auto z-10 text-center px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-[#0070C2]/30 border border-[#03A9F5]/40 flex items-center justify-center mx-auto mb-1 text-[#03A9F5] shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white/95 line-clamp-1 tracking-tight">
                  {project.title}
                </div>
              </div>

              {/* Bottom Row: Project Category Indicator */}
              <div className="flex items-center justify-between z-10 text-[9.5px] text-white/70 font-semibold border-t border-white/10 pt-1.5">
                <span className="truncate">{tools.slice(0, 2).join(' · ') || 'Capstone Project'}</span>
                <span className="text-[#03A9F5] font-mono">KITS</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Hover Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 kits-hover-overlay">
            <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-[4px] backdrop-blur-xs flex items-center gap-1.5 shadow-sm border border-white/20">
              <span>View Project Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Top Project Type Badge */}
          {hasCustomImage && (
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[3px] shadow-xs flex items-center gap-1 truncate max-w-[150px] ${getClassificationBadgeStyle()}`}>
                {isIndividual ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                <span>{isIndividual ? 'Individual Project' : (projectType.includes('RTRP') ? 'RTRP Group' : 'Group Project')}</span>
              </span>

              <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-[2px] backdrop-blur-xs shrink-0">
                {batchYear}
              </span>
            </div>
          )}
        </div>

        {/* Department & Batch Metadata */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#757F95] mb-1.5">
          {deptBadge && (
            <>
              <span className="text-[#0070C2] font-bold truncate max-w-[180px]">{deptBadge}</span>
              <span aria-hidden="true" className="text-[#D5D5D5]">·</span>
            </>
          )}
          <span className="text-[#CA0765] font-semibold">{batchYear}</span>
        </div>

        {/* Rating, View Count & Shares Row */}
        <div className="flex items-center justify-between text-xs text-[#757F95] mb-2 pt-0.5">
          {/* Average Rating Badge */}
          <div className="flex items-center gap-1">
            {project.averageRating && project.averageRating > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="text-xs font-bold text-[#19232B]">{Number(project.averageRating).toFixed(1)}</span>
                <span className="text-[11px] text-[#757F95]">({project.totalRatings})</span>
              </>
            ) : (
              <span className="text-[11px] text-[#757F95] italic">No ratings yet</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Count */}
            <div
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"
              title="Project views (deduplicated per viewer within 24h)"
            >
              <Eye className="w-3.5 h-3.5 text-[#0070C2]" />
              <span>{viewsCount}</span>
            </div>

            {/* Share Button & Count */}
            <button
              type="button"
              onClick={handleShareClick}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#CA0765] transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
              title="Shares: Share actions and copied links; recipient delivery is not verified."
              aria-label={`Share ${project.title} (${sharesCount} shares)`}
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{sharesCount}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-heading font-semibold text-[18px] sm:text-[20px] text-[#19232B] group-hover:text-[#CA0765] transition-colors line-clamp-2 leading-snug mb-2">
          {project.title}
        </h3>

        {/* Summary */}
        <p className="text-[13px] text-[#757F95] line-clamp-2 leading-relaxed mb-3">
          {project.summary}
        </p>

        {/* Technologies Tags */}
        {tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tools.slice(0, 4).map((tech: string, i: number) => (
              <span
                key={i}
                className="text-[11px] font-mono font-medium text-[#19232B] bg-[#F6F6F7] border border-[#D5D5D5] px-2 py-0.5 rounded-[2px]"
              >
                {tech}
              </span>
            ))}
            {tools.length > 4 && (
              <span className="text-[11px] font-mono text-[#757F95] px-1 py-0.5">
                +{tools.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Area: Author/Team members & resource links */}
      <div className="border-t border-[#D5D5D5] pt-3 mt-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#19232B]">
          {isIndividual ? (
            <div className="flex items-center gap-1.5 truncate max-w-[75%]" title={`Author: ${authors[0]?.name || 'Student Author'}`}>
              <User className="w-3.5 h-3.5 text-[#0070C2] shrink-0" />
              <span className="font-semibold truncate text-[#19232B]">
                {authors[0]?.name || project.contentOwner || 'Individual Student'}
              </span>
              {authors[0]?.rollNumber && (
                <span className="text-[10px] font-mono text-[#0070C2] font-semibold">
                  ({authors[0].rollNumber})
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 truncate max-w-[70%]" title={authors.map((m: any) => `${m.name} (${m.rollNumber || m.role || 'Member'})`).join(', ')}>
              <Users className="w-3.5 h-3.5 text-[#CA0765] shrink-0" />
              <span className="font-semibold truncate">
                {project.group?.name || authors[0]?.name || 'Student Team'}
                {authors.length > 1 && ` +${authors.length - 1} members`}
              </span>
            </div>
          )}

          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 bg-slate-100 text-[#757F95]">
            {isIndividual ? 'Solo Owner' : `${authors.length} Students`}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            {liveDemo && (
              <a
                href={liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0070C2] hover:text-[#005696] hover:underline"
                title="Open Live Prototype Demo"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Demo</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}

            {documentation && (
              <a
                href={documentation}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0070C2] hover:text-[#005696] hover:underline"
                title="View Technical Documentation / Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Docs</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}

            {video && (
              <a
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 hover:underline"
                title="Watch Demonstration Video"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video</span>
              </a>
            )}

            {presentation && (
              <a
                href={presentation}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#D83B01] hover:text-[#B33000] hover:underline"
                title="View PowerPoint Presentation / Slides"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>PPT</span>
              </a>
            )}

            {!liveDemo && !documentation && !video && !presentation && repo && (
              <a
                href={repo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#19232B] hover:text-[#CA0765] hover:underline"
                title="View GitHub Source Code"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Code</span>
              </a>
            )}

            {!liveDemo && !documentation && !video && !presentation && !repo && (
              <span className="text-[11px] text-[#757F95] italic">Institutional Repository</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCardClick}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#CA0765] hover:text-[#A10550] group-hover:underline ml-auto cursor-pointer"
          >
            <span>View Project</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        onShareRecorded={(newCount) => setSharesCount(newCount)}
      />
    </div>
  );
};
