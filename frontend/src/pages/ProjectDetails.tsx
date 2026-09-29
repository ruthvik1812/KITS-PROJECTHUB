import React, { useState } from 'react';
import { useAuth } from '../context/AppContext';
import { kitsCollegeConfig } from '../config/collegeConfig';
import { RatingsAndComments } from '../components/RatingsAndComments';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Globe,
  Tag,
  Users,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  Share2,
  Check,
  Edit3,
  FileText,
  ShieldCheck,
  Award,
  Download,
  Video,
  Layers,
  Presentation
} from 'lucide-react';

interface ProjectDetailsProps {
  project: any;
  onBack: () => void;
  onSelectProject?: (p: any) => void;
  onEditProject?: (p: any) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onBack,
  onEditProject,
}) => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);

  const submissionType = project.submission_type || project.submissionType || (project.official_group_id ? 'group' : 'individual');
  const isIndividual = submissionType === 'individual';

  const authors = Array.isArray(project.original_authors)
    ? project.original_authors
    : Array.isArray(project.teamMembers)
    ? project.teamMembers
    : [];

  // Determine if the current user is a project owner/member (cannot rate)
  let isProjectMember = false;
  if (currentUser.role === 'admin') {
    isProjectMember = false; // admin can rate
  } else if (isIndividual) {
    isProjectMember = Boolean(
      (project.owner_user_id && project.owner_user_id === currentUser.uid) ||
      (project.ownerUid && project.ownerUid === currentUser.uid) ||
      (authors[0]?.rollNumber && authors[0]?.rollNumber?.toUpperCase() === (currentUser.studentRollNumber || currentUser.rollNumber)?.toUpperCase())
    );
  } else {
    isProjectMember = Boolean(
      (project.group && project.group.leader_id === currentUser.uid) ||
      (project.owner_user_id && project.owner_user_id === currentUser.uid) ||
      authors.some((a: any) => a.rollNumber?.toUpperCase() === (currentUser.studentRollNumber || currentUser.rollNumber)?.toUpperCase())
    );
  }

  // Strict Edit Permission Check:
  // Individual Project: Owner only
  // Group Project: Group leader only
  let canEdit = false;
  if (currentUser.role === 'admin') {
    canEdit = true;
  } else if (isIndividual) {
    canEdit = Boolean(
      (project.owner_user_id && project.owner_user_id === currentUser.uid) ||
      (project.ownerUid && project.ownerUid === currentUser.uid) ||
      (authors[0]?.rollNumber && authors[0]?.rollNumber?.toUpperCase() === (currentUser.studentRollNumber || currentUser.rollNumber)?.toUpperCase())
    );
  } else {
    canEdit = Boolean(
      (project.group && project.group.leader_id === currentUser.uid) ||
      (project.owner_user_id && project.owner_user_id === currentUser.uid) ||
      (authors[0]?.role?.toLowerCase().includes('leader') && authors[0]?.rollNumber?.toUpperCase() === (currentUser.studentRollNumber || currentUser.rollNumber)?.toUpperCase())
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tools = Array.isArray(project.tools)
    ? project.tools
    : Array.isArray(project.technologies)
    ? project.technologies
    : [];

  const liveDemo = project.live_demo_url || project.links?.website;
  const repo = project.repo_url || project.links?.repository;
  const documentation = project.documentation_url || project.links?.documentation;
  const video = project.video_url || project.links?.video;
  const presentation = project.presentation_url || project.presentationUrl || project.links?.presentation;
  const isUploadedDoc = Boolean(documentation && (documentation.startsWith('data:') || documentation.includes('/uploads/')));
  const isUploadedPpt = Boolean(presentation && (presentation.startsWith('data:') || presentation.includes('/uploads/')));

  const currentDept = kitsCollegeConfig.departments.find(
    (d) => d.id === project.department_id || d.code.toLowerCase() === (project.departmentCode || '').toLowerCase()
  );
  const hasFacultyMentor = !isIndividual && Boolean(project.faculty_mentor_name || project.mentor?.name);
  const mentorName = project.faculty_mentor_name || project.mentor?.name || (isIndividual ? '' : currentDept?.hodName || 'Dr. M. Ravindra Babu');
  const mentorRole = project.faculty_mentor_role || (project.mentor?.designation ? `${project.mentor.designation} · ${project.mentor.department || currentDept?.code || 'CSE'}` : (isIndividual ? '' : `Professor & HOD · ${currentDept?.code || (project.department_id || 'cse').toUpperCase()}`));
  const mentorInitials = mentorName ? (mentorName.trim().toLowerCase().startsWith('dr') ? 'DR' : (mentorName.slice(0, 2).toUpperCase() || 'DR')) : '';

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Hero Header */}
      <div className="bg-[#19232B] text-white border-b-4 border-[#CA0765] py-10 sm:py-12">
        <div className="kits-container space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed &amp; Published</span>
            </span>

            <span className={`px-3 py-1 rounded-[4px] text-xs font-bold flex items-center gap-1.5 ${
              isIndividual ? 'bg-[#0070C2] text-white border border-blue-400/40' : 'bg-purple-900/60 text-purple-200 border border-purple-400/30'
            }`}>
              {isIndividual ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              <span>{isIndividual ? 'Individual Project' : (project.project_type || project.projectType || 'Group Capstone Project')}</span>
            </span>

            <span className="px-3 py-1 rounded-[4px] bg-white/10 text-white text-xs font-medium border border-white/15">
              {project.department_id?.toUpperCase() || project.departmentCode || 'KITS B.TECH'}
            </span>

            <span className="px-3 py-1 rounded-[4px] bg-[#CA0765]/20 text-white text-xs font-semibold border border-[#CA0765]/40">
              {project.academic_year || `Batch of ${project.graduationYear || '2027'}`}
            </span>


          </div>

          <h1 className="font-heading font-bold text-2xl sm:text-4xl text-white tracking-tight leading-snug">
            {project.title}
          </h1>

          <p className="text-white/80 text-sm sm:text-base max-w-3xl leading-relaxed">
            {project.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#CA0765]" />
              <span className="text-white font-medium">
                {project.departmentName || 'Kamala Institute of Technology & Science'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0070C2]" />
              <span>Academic Year {project.academic_year || project.academicYear || '2026-2027'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {isIndividual ? <User className="w-4 h-4 text-[#0070C2]" /> : <Users className="w-4 h-4 text-emerald-400" />}
              <span>{isIndividual ? 'Single Student Owner' : `${authors.length} Confirmed Contributors`}</span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/15">
            {liveDemo && (
              <a
                href={liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>Open Live Project Demo</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}

            {repo && (
              <a
                href={repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase border border-white/20 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>Source Code</span>
              </a>
            )}

            {video && (
              <a
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Demo Video</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}

            {documentation && (
              <a
                href={documentation}
                target="_blank"
                rel="noopener noreferrer"
                download={isUploadedDoc ? `${project.title ? project.title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Project'}_Documentation.pdf` : undefined}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#0070C2] hover:bg-[#005696] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                {isUploadedDoc ? <Download className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                <span>{isUploadedDoc ? 'Download Documentation (PDF)' : 'Project Documentation'}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}

            {canEdit && onEditProject && (
              <button
                onClick={() => onEditProject(project)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-white text-[#19232B] hover:bg-slate-100 text-xs font-bold uppercase shadow-sm transition-colors"
              >
                <Edit3 className="w-4 h-4 text-[#CA0765]" />
                <span>Edit Project</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-colors ml-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Share Project'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="kits-container space-y-8">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#757F95] hover:text-[#CA0765] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Projects Catalogue</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview & Abstract */}
            <div className="kits-card p-6 sm:p-8 bg-white space-y-4">
              <span className="kits-cyan-corner-tl" />
              <span className="kits-cyan-corner-br" />

              <div className="flex items-center justify-between border-b border-[#D5D5D5] pb-2">
                <h2 className="font-heading font-bold text-lg sm:text-xl text-[#CA0765]">
                  Project Overview &amp; Technical Description
                </h2>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  isIndividual ? 'bg-blue-100 text-[#0070C2]' : 'bg-pink-100 text-[#CA0765]'
                }`}>
                  {isIndividual ? 'Individual Project' : 'Group Capstone'}
                </span>
              </div>

              <p className="text-sm text-[#19232B] leading-relaxed">
                {project.description || project.summary}
              </p>

              {(project.problemStatement || project.problem_statement || project.solution) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {(project.problemStatement || project.problem_statement) && (
                    <div className="p-4 bg-[#F6F6F7] border-l-4 border-[#CA0765] rounded-[4px] space-y-1">
                      <div className="font-bold text-xs text-[#CA0765] uppercase">
                        Problem Statement &amp; Motivation
                      </div>
                      <p className="text-xs text-[#19232B] leading-relaxed">
                        {project.problemStatement || project.problem_statement}
                      </p>
                    </div>
                  )}

                  {project.solution && (
                    <div className="p-4 bg-[#F6F6F7] border-l-4 border-[#0070C2] rounded-[4px] space-y-1">
                      <div className="font-bold text-xs text-[#0070C2] uppercase">
                        Engineering Solution
                      </div>
                      <p className="text-xs text-[#19232B] leading-relaxed">
                        {project.solution}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Author / Confirmed Student Team Members */}
            <div className="kits-card p-6 sm:p-8 bg-white space-y-4">
              <span className="kits-cyan-corner-tl" />
              <span className="kits-cyan-corner-br" />

              <div className="border-b border-[#D5D5D5] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-lg sm:text-xl text-[#19232B] flex items-center gap-2">
                    {isIndividual ? <User className="w-5 h-5 text-[#0070C2]" /> : <Users className="w-5 h-5 text-[#CA0765]" />}
                    <span>{isIndividual ? 'Project Author & Ownership' : `Confirmed Student Team (${authors.length} Members)`}</span>
                  </h2>
                  <p className="text-xs text-[#757F95] mt-0.5">
                    {isIndividual ? 'Single student author registered and credited in KITS repository' : 'Every member’s name, college roll number, and individual technical contribution'}
                  </p>
                </div>

                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded border border-emerald-200">
                  {isIndividual ? 'Verified Author' : 'Verified Team'}
                </span>
              </div>

              <div className={`grid gap-4 pt-2 ${isIndividual ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {authors.map((member: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border-2 border-[#D5D5D5] rounded-[4px] space-y-2 relative hover:border-[#0070C2] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-[#19232B]">
                        {member.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[#F6F6F7] border border-[#D5D5D5] px-2 py-0.5 rounded text-[#757F95]">
                        {isIndividual ? 'Author' : `#${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#0070C2]">
                        {member.rollNumber || member.student_roll_number || '23281A0579'}
                      </span>
                      <span className="text-[#757F95] font-semibold text-[11px]">
                        {member.role || (isIndividual ? 'Project Author & Developer' : 'Contributor')}
                      </span>
                    </div>

                    <div className="text-xs text-[#757F95] leading-relaxed pt-2 border-t border-slate-100">
                      <strong className="text-[#19232B]">Technical Contribution:</strong>{' '}
                      {member.contribution || 'Integrated system components, hardware verification, and documentation.'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Faculty Mentor Card (Group Capstone Projects Only) */}
              {hasFacultyMentor && (
                <div className="p-4 sm:p-5 bg-white border border-blue-200/90 rounded-[6px] shadow-2xs space-y-3 mt-6">
                  <div className="text-xs font-bold text-[#0070C2] uppercase tracking-wider">
                    ASSIGNED FACULTY MENTOR
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-[#0070C2] text-white rounded-[4px] font-bold text-sm flex items-center justify-center tracking-wide shrink-0 shadow-2xs">
                        {mentorInitials}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm sm:text-base text-[#19232B]">
                          {mentorName}
                        </div>
                        <div className="text-xs text-[#757F95] mt-0.5">
                          {mentorRole}
                        </div>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-[6px] flex items-center gap-2 text-xs font-bold text-emerald-800 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Certified Academic Project</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ratings & Comments */}
            <RatingsAndComments
              projectId={project.id}
              isProjectMember={isProjectMember}
            />
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            {/* Technologies Card */}
            {tools.length > 0 && (
              <div className="kits-card p-5 bg-white space-y-3">
                <span className="kits-cyan-corner-tl" />
                <span className="kits-cyan-corner-br" />

                <h3 className="font-bold text-xs text-[#19232B] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#CA0765]" />
                  <span>Technologies &amp; Tools Used</span>
                </h3>

                <div className="flex flex-wrap gap-2 pt-1">
                  {tools.map((tech: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[#F6F6F7] border border-[#D5D5D5] rounded-[4px] text-xs font-mono font-bold text-[#19232B]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deliverables Card */}
            <div className="kits-card p-5 bg-white space-y-3">
              <span className="kits-cyan-corner-tl" />
              <span className="kits-cyan-corner-br" />

              <h3 className="font-bold text-xs text-[#19232B] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0070C2]" />
                <span>Project Deliverables &amp; Links</span>
              </h3>

              <div className="space-y-2 pt-1">
                {liveDemo && (
                  <a
                    href={liveDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white border border-[#D5D5D5] hover:border-[#CA0765] rounded-[4px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#CA0765]" />
                      <span className="text-xs font-bold text-[#19232B] group-hover:text-[#CA0765]">
                        Live Prototype Demo
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#757F95]" />
                  </a>
                )}

                {repo && (
                  <a
                    href={repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white border border-[#D5D5D5] hover:border-[#19232B] rounded-[4px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-[#19232B]" />
                      <span className="text-xs font-bold text-[#19232B]">
                        Source Code Repository
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#757F95]" />
                  </a>
                )}

                {video && (
                  <a
                    href={video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white border border-[#D5D5D5] hover:border-purple-600 rounded-[4px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-[#19232B] group-hover:text-purple-600">
                        Demonstration Video
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#757F95]" />
                  </a>
                )}

                {presentation && (
                  <a
                    href={presentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={isUploadedPpt ? `${project.title ? project.title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Project'}_Presentation.pptx` : undefined}
                    className="p-3 bg-white border border-[#D5D5D5] hover:border-[#D83B01] rounded-[4px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-[#D83B01]" />
                      <span className="text-xs font-bold text-[#19232B] group-hover:text-[#D83B01]">
                        {isUploadedPpt ? 'PowerPoint Presentation (Download PPT)' : 'PowerPoint Presentation / Slides'}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#757F95]" />
                  </a>
                )}

                {documentation && (
                  <a
                    href={documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={isUploadedDoc ? `${project.title ? project.title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Project'}_Documentation.pdf` : undefined}
                    className="p-3 bg-white border border-[#D5D5D5] hover:border-[#0070C2] rounded-[4px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {isUploadedDoc ? <Download className="w-4 h-4 text-[#0070C2]" /> : <FileText className="w-4 h-4 text-[#0070C2]" />}
                      <span className="text-xs font-bold text-[#19232B] group-hover:text-[#0070C2]">
                        {isUploadedDoc ? 'Project Documentation (PDF Download)' : 'Documentation & Report Link'}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#757F95]" />
                  </a>
                )}
              </div>
            </div>

            {/* Institutional Certification Pill */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-[4px] space-y-1.5 text-xs text-[#19232B]">
              <div className="font-bold flex items-center gap-1.5 text-[#0070C2]">
                <ShieldCheck className="w-4 h-4 text-[#0070C2]" />
                <span>Verified KITS Repository Record</span>
              </div>
              <p className="text-[11px] text-[#757F95] leading-relaxed">
                Published in the official repository of Kamala Institute of Technology &amp; Science. Universal browsing access enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
