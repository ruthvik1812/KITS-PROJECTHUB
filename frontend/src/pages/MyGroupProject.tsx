import React, { useState, useEffect } from 'react';
import { useAuth, useApp } from '../context/AppContext';
import { fetchMyGroup, createOfficialGroup, fetchMyProjects, fetchPendingInvites, declineGroupInvitation, acceptGroupInvitation } from '../services/apiClient';
import { kitsCollegeConfig } from '../config/collegeConfig';
import { ProjectCard } from '../components/ProjectCard';
import {
  Users,
  User,
  FolderGit2,
  PlusCircle,
  Edit3,
  ExternalLink,
  Github,
  Globe,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Info,
  FileText,
  Download,
  Layers,
  Video,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  Eye,
  Lock,
  Presentation
} from 'lucide-react';

interface MyGroupProjectProps {
  onSelectProject: (project: any) => void;
  onNavigateSubmit: (editingProject?: any, group?: any) => void;
  onNavigateExplore: () => void;
  onNavigateSignIn?: () => void;
}

// ─── Inline Invite Member Form (leader only) ─────────────────────────────────
interface InviteMemberFormProps {
  groupId: string;
  onInvited: () => void;
}

const InviteMemberForm: React.FC<InviteMemberFormProps> = ({ groupId, onInvited }) => {
  const [roll, setRoll] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = roll.trim().toUpperCase();
    if (!cleanRoll) { setMsg({ type: 'err', text: 'Enter a roll number.' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const { inviteGroupMember } = await import('../services/apiClient');
      await inviteGroupMember(groupId, '', cleanRoll);
      setMsg({ type: 'ok', text: `Invitation sent to ${cleanRoll}. They must accept to join.` });
      setRoll('');
      onInvited();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Failed to invite.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
      <span className="text-xs font-bold text-[#19232B]">Invite Student:</span>
      <input
        type="text"
        value={roll}
        onChange={e => { setRoll(e.target.value); setMsg(null); }}
        placeholder="Roll No (e.g. 21B91A0501)"
        className="px-2.5 py-1.5 text-xs font-mono border border-[#D5D5D5] rounded-[4px] w-44"
      />
      <button
        type="submit"
        disabled={busy}
        className="px-3 py-1.5 bg-[#0070C2] hover:bg-[#005696] text-white text-xs font-bold rounded-[4px] disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Send Invite'}
      </button>
      {msg && (
        <span className={`text-xs ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{msg.text}</span>
      )}
    </form>
  );
};

export const MyGroupProject: React.FC<MyGroupProjectProps> = ({
  onSelectProject,
  onNavigateSubmit,
  onNavigateExplore,
  onNavigateSignIn,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { projects: _allContextProjects } = useApp(); // kept for type compat, not used for membership

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, individual: 0, group: 0 });
  const [projectFilter, setProjectFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [error, setError] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  // Group creation form state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || '');
  const [academicYear, setAcademicYear] = useState('');
  const [memberInputs, setMemberInputs] = useState<Array<{ fullName: string; studentRollNumber: string; role: string }>>([
    { fullName: currentUser.name || currentUser.fullName || '', studentRollNumber: currentUser.rollNumber || currentUser.studentRollNumber || '', role: 'Team Leader' },
    { fullName: '', studentRollNumber: '', role: '' },
    { fullName: '', studentRollNumber: '', role: '' },
    { fullName: '', studentRollNumber: '', role: '' },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser.uid, currentUser.rollNumber, currentUser.studentRollNumber]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated || currentUser.role === 'visitor' || currentUser.uid === 'guest-visitor') {
        setMyProjects([]);
        setGroup(null);
        setPendingInvites([]);
        setCounts({ all: 0, individual: 0, group: 0 });
        setLoading(false);
        return;
      }

      const userRoll = currentUser.rollNumber || currentUser.studentRollNumber || '';
      const userId = currentUser.uid || '';

      // Fetch group, projects, and pending invites in parallel.
      // IMPORTANT: Use ONLY the server-authoritative my-projects response.
      // Do NOT merge context projects — they bypass confirmed-membership checks.
      const [groupData, projectsData, invitesData] = await Promise.all([
        fetchMyGroup(userId, userRoll).catch(() => null),
        fetchMyProjects(userId, userRoll).catch(() => ({ projects: [], counts: { all: 0, individual: 0, group: 0 } })),
        fetchPendingInvites().catch(() => ({ invites: [] })),
      ]);

      setGroup(groupData);
      setPendingInvites(invitesData?.invites || []);

      // Use server response directly — membership is enforced server-side
      const serverProjects = (projectsData && Array.isArray(projectsData.projects)) ? projectsData.projects : [];
      const serverCounts = projectsData?.counts || { all: serverProjects.length, individual: 0, group: 0 };

      setMyProjects(serverProjects);
      setCounts(serverCounts);
    } catch (err: any) {
      console.warn('Failed to load dashboard data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberRow = () => {
    if (memberInputs.length >= 6) return;
    setMemberInputs([
      ...memberInputs,
      { fullName: '', studentRollNumber: '', role: '' },
    ]);
  };

  const handleRemoveMemberRow = (index: number) => {
    if (memberInputs.length <= 4) return;
    setMemberInputs(memberInputs.filter((_, idx) => idx !== index));
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...memberInputs];
    updated[index] = { ...updated[index], [field]: value };
    setMemberInputs(updated);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!groupName.trim()) {
      setFormError('Please enter a group name.');
      return;
    }

    if (memberInputs.length < 4 || memberInputs.length > 6) {
      setFormError('Each group must contain 4 to 6 confirmed students.');
      return;
    }

    for (let i = 0; i < memberInputs.length; i++) {
      const m = memberInputs[i];
      if (!m.fullName.trim()) {
        setFormError(`Please enter the full name for Student #${i + 1}.`);
        return;
      }
      if (!m.studentRollNumber.trim()) {
        setFormError(`Please enter the college roll number for Student #${i + 1}.`);
        return;
      }
    }

    // Check duplicate roll numbers in form
    const rolls = memberInputs.map((m) => m.studentRollNumber.trim().toUpperCase());
    const uniqueRolls = new Set(rolls);
    if (uniqueRolls.size !== rolls.length) {
      setFormError('Duplicate roll numbers detected in the roster. Each student must have a unique roll number.');
      return;
    }

    const finalDepartmentId = departmentId || currentUser.departmentId || 'cse';
    const finalAcademicYear = academicYear || '2026-2027';

    setFormSubmitting(true);
    try {
      const created = await createOfficialGroup({
        leaderId: currentUser.uid || 'usr-student-01',
        name: groupName.trim(),
        departmentId: finalDepartmentId,
        academicYear: finalAcademicYear,
        members: memberInputs.slice(1), // leader is index 0
      });
      setGroup(created);
      setIsCreatingGroup(false);
      await loadDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create group. Please check roll numbers.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter projects based on selected Bootstrap filter button
  const filteredProjects = myProjects.filter((p) => {
    const type = (p.submission_type || p.submissionType || 'group').toLowerCase();
    if (projectFilter === 'individual') return type === 'individual';
    if (projectFilter === 'group') return type === 'group';
    return true;
  });

  // Check if current user is leader of group
  const isLeader = group && (group.leader_id === currentUser.uid || currentUser.role === 'admin');

  if (!isAuthenticated && currentUser.role === 'visitor') {
    return (
      <div className="kits-container py-16 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-[#CA0765]/10 rounded-full flex items-center justify-center mx-auto text-[#CA0765]">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-bold text-2xl text-[#19232B]">
          Sign In to Access Your Student Dashboard
        </h2>
        <p className="text-sm text-[#757F95] leading-relaxed">
          Sign in with your official account to view your student profile, manage your individual projects, and collaborate on group capstone submissions.
        </p>
        <button
          onClick={() => {
            if (onNavigateSignIn) {
              onNavigateSignIn();
            } else {
              window.location.hash = '#/signin';
            }
          }}
          className="px-6 py-2.5 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold uppercase rounded-[4px] shadow-sm transition-all"
        >
          Sign In to Your Account
        </button>
      </div>
    );
  }

  // Student Profile Data
  const profileFullName = currentUser.fullName || currentUser.name || 'Student';
  const profileRollNo = currentUser.studentRollNumber || currentUser.rollNumber || '—';
  const profileBranch = currentUser.departmentName || (currentUser.departmentId ? currentUser.departmentId.toUpperCase() : 'Computer Science and Engineering');
  const profileEmail = currentUser.email || '—';
  const profileYearSem = currentUser.yearSemester || '';
  const profileSection = currentUser.section || '';

  return (
    <div className="space-y-8 pb-16 bg-[#F4F6F9] min-h-screen">
      {/* Hero Header */}
      <div className="bg-[#19232B] text-white border-b-4 border-[#CA0765] py-8">
        <div className="kits-container flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#CA0765]">
              <Layers className="w-4 h-4" />
              <span>Student Profile &amp; Project Repository</span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
              My Projects &amp; Profile
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              View your student academic profile, manage independent individual projects, and coordinate your official group capstone submission.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateSubmit()}
              className="px-5 py-2.5 bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase rounded-[4px] shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      </div>

      <div className="kits-container space-y-8">
        {/* ========================================================================= */}
        {/* SECTION 1: PROFILE DETAILS CARD                                            */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-[8px] shadow-xs border border-slate-200/90 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            {/* Left/Main Column: Title & Key-Value Grid */}
            <div className="flex-1 w-full space-y-6">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0B2545] tracking-tight border-b border-slate-100 pb-3">
                Profile Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="w-36 text-[#4A6B82] font-medium shrink-0">Full Name</span>
                  <span className="font-bold text-[#19232B] uppercase tracking-wide">{profileFullName}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="w-36 text-[#4A6B82] font-medium shrink-0">Roll No</span>
                  <span className="font-mono font-bold text-[#0070C2]">{profileRollNo}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="w-36 text-[#4A6B82] font-medium shrink-0">Email</span>
                  <span className="text-[#19232B] break-all">{profileEmail}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="w-36 text-[#4A6B82] font-medium shrink-0">Branch</span>
                  <span className="font-semibold text-[#19232B]">{profileBranch}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="w-36 text-[#4A6B82] font-medium shrink-0">Year &amp; Semester</span>
                  <span className="font-semibold text-[#19232B]">{profileYearSem}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="w-36 text-[#4A6B82] font-medium shrink-0">Section</span>
                  <span className="font-semibold text-[#19232B]">{profileSection}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Student Illustrated Avatar */}
            <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-[8px] border border-slate-200/60 self-center lg:self-start">
              <div className="w-28 h-32 relative flex items-center justify-center">
                <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-md">
                  {/* Head & Neck */}
                  <path d="M40 30 C40 10, 80 10, 80 30 C80 50, 75 70, 60 70 C45 70, 40 50, 40 30 Z" fill="#E8B896" />
                  {/* Hair */}
                  <path d="M38 32 C38 12, 50 2, 60 2 C75 2, 85 10, 84 26 C80 20, 70 18, 62 20 C54 22, 45 28, 38 32 Z" fill="#6B4226" />
                  <path d="M36 28 C34 38, 42 42, 44 42 C40 36, 40 30, 36 28 Z" fill="#6B4226" />
                  {/* Neck */}
                  <path d="M52 65 L68 65 L68 80 L52 80 Z" fill="#DBA07C" />
                  {/* Collar */}
                  <path d="M48 80 L60 92 L54 80 Z" fill="#FFFFFF" />
                  <path d="M72 80 L60 92 L66 80 Z" fill="#FFFFFF" />
                  {/* Torso / Shirt */}
                  <path d="M20 135 L30 84 C38 80, 52 80, 60 80 C68 80, 82 80, 90 84 L100 135 Z" fill="#0070C2" />
                  <path d="M50 82 L60 95 L70 82 L66 80 L60 88 L54 80 Z" fill="#FFFFFF" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-[#0070C2] mt-2 font-mono">{profileRollNo}</span>
              <span className="text-[10px] text-[#757F95] font-semibold">Verified Student</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: "MY PROJECTS" WITH BOOTSTRAP FILTER BUTTONS                    */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[#CA0765]" />
                <h2 className="font-heading font-extrabold text-2xl text-[#19232B] tracking-tight">
                  My Projects
                </h2>
              </div>
              <p className="text-xs text-[#757F95] mt-1">
                Showing individual projects owned by you and group projects where you are a confirmed member
              </p>
            </div>

            {/* Bootstrap Filter Buttons: All, Individual, Group with Accurate Counts */}
            <div className="btn-group inline-flex rounded-[4px] p-1 bg-white border border-slate-300 shadow-2xs" role="group" aria-label="Project Type Filters">
              <button
                type="button"
                onClick={() => setProjectFilter('all')}
                className={`px-4 py-2 text-xs font-bold rounded-[3px] transition-all flex items-center gap-1.5 ${
                  projectFilter === 'all'
                    ? 'bg-[#19232B] text-white shadow-xs'
                    : 'text-[#757F95] hover:text-[#19232B] hover:bg-slate-50'
                }`}
              >
                <span>All Projects</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  projectFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#757F95]'
                }`}>
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProjectFilter('individual')}
                className={`px-4 py-2 text-xs font-bold rounded-[3px] transition-all flex items-center gap-1.5 ${
                  projectFilter === 'individual'
                    ? 'bg-[#0070C2] text-white shadow-xs'
                    : 'text-[#757F95] hover:text-[#0070C2] hover:bg-slate-50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Individual</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  projectFilter === 'individual' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#0070C2]'
                }`}>
                  {counts.individual}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProjectFilter('group')}
                className={`px-4 py-2 text-xs font-bold rounded-[3px] transition-all flex items-center gap-1.5 ${
                  projectFilter === 'group'
                    ? 'bg-[#CA0765] text-white shadow-xs'
                    : 'text-[#757F95] hover:text-[#CA0765] hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Group</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  projectFilter === 'group' ? 'bg-white/20 text-white' : 'bg-pink-50 text-[#CA0765]'
                }`}>
                  {counts.group}
                </span>
              </button>
            </div>
          </div>

          {/* Projects Display Grid */}
          {loading ? (
            <div className="bg-white rounded-[8px] border border-slate-200 p-12 text-center text-xs text-[#757F95] space-y-2 shadow-2xs">
              <div className="w-6 h-6 border-2 border-[#CA0765] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading your project records from SQL database...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((proj) => {
                const isGroup = proj.submission_type === 'group';
                const canEdit = isGroup
                  ? (isLeader || currentUser.role === 'admin')
                  : (proj.owner_user_id === currentUser.uid || currentUser.role === 'admin');

                const statusBadge = proj.status === 'approved'
                  ? { label: 'Published', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
                  : proj.status === 'submitted' || proj.status === 'under_review'
                  ? { label: 'Under Review', cls: 'bg-amber-100 text-amber-800 border-amber-300' }
                  : { label: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-300' };

                const submissionDate = (proj.created_at || proj.createdAt)
                  ? new Date(proj.created_at || proj.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Recent';

                const uploaderDisplayName = proj.uploader_display_name || proj.uploader_name || proj.content_owner || (isGroup ? 'Group Leader' : currentUser.name);
                const leaderName = proj.leader_name || proj.group?.leader_name || (isGroup ? (isLeader ? currentUser.name : 'Team Leader') : null);
                const confirmedTeam = proj.confirmed_members || proj.group?.confirmed_members || (group?.members || []);

                return (
                  <div key={proj.id} className="flex flex-col bg-white rounded-[6px] border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                    <ProjectCard
                      project={proj}
                      onSelect={onSelectProject}
                    />

                    {/* Shared Project Details & Permissions Panel */}
                    <div className="bg-slate-50/90 border-t border-slate-200 p-3.5 space-y-2.5 text-xs">
                      {/* Status Badge & Submission Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusBadge.cls}`}>
                          ● {statusBadge.label}
                        </span>
                        <span className="text-[11px] text-[#757F95] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Submitted: {submissionDate}</span>
                        </span>
                      </div>

                      {/* Uploader & Team Information */}
                      <div className="space-y-1 pt-1 border-t border-slate-200/80 text-[11.5px]">
                        <div className="flex items-center gap-1.5 text-[#19232B]">
                          <span className="text-[#757F95] font-medium shrink-0">Uploader:</span>
                          <span className="font-bold truncate text-[#19232B]">{uploaderDisplayName}</span>
                        </div>

                        {isGroup && (
                          <>
                            <div className="flex items-center gap-1.5 text-[#19232B]">
                              <span className="text-[#757F95] font-medium shrink-0">Team Leader:</span>
                              <span className="font-semibold truncate text-[#CA0765]">{leaderName}</span>
                            </div>

                            {confirmedTeam.length > 0 && (
                              <div className="text-[#757F95]">
                                <span className="font-medium text-[#19232B]">Confirmed Members ({confirmedTeam.length}): </span>
                                <span className="line-clamp-1 text-[11px]">
                                  {confirmedTeam.map((m: any) => m.fullName || m.full_name || m.name).filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {(proj.presentation_url || proj.presentationUrl || proj.links?.presentation) && (
                          <div className="flex items-center gap-1.5 text-xs text-[#D83B01] font-semibold pt-1 border-t border-slate-100">
                            <Presentation className="w-3.5 h-3.5 text-[#D83B01]" />
                            <a
                              href={proj.presentation_url || proj.presentationUrl || proj.links?.presentation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>PowerPoint Presentation Attached</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Actions: View Project (all) and Edit Project (leader/owner only) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => onSelectProject(proj)}
                          className="px-3.5 py-1.5 bg-[#0070C2] hover:bg-[#005696] text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Project</span>
                        </button>

                        {canEdit ? (
                          <button
                            onClick={() => onNavigateSubmit(proj, group)}
                            className="px-3 py-1.5 bg-white hover:bg-[#CA0765] hover:text-white text-[#19232B] border border-slate-300 font-bold text-xs rounded transition-colors flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Project</span>
                          </button>
                        ) : isGroup ? (
                          <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-1 rounded flex items-center gap-1" title="Only the team leader can edit the shared project">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Leader editing only</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State for Filter */
            <div className="bg-white rounded-[8px] border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
              <div className="w-14 h-14 bg-slate-100 text-[#757F95] rounded-full flex items-center justify-center mx-auto">
                {projectFilter === 'individual' ? <User className="w-7 h-7 text-[#0070C2]" /> : <Users className="w-7 h-7 text-[#CA0765]" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-[#19232B]">
                  No {projectFilter === 'all' ? '' : projectFilter === 'individual' ? 'Individual' : 'Group'} Projects Found
                </h3>
                <p className="text-xs text-[#757F95] leading-relaxed">
                  {projectFilter === 'individual'
                    ? 'You have not uploaded any individual engineering projects yet. You can submit distinct individual projects at any time.'
                    : projectFilter === 'group'
                    ? 'No group project submitted for your official group yet. Group leaders can submit the shared capstone project.'
                    : 'You do not have any projects registered in the repository yet.'}
                </p>
              </div>

              <button
                onClick={() => onNavigateSubmit()}
                className="px-6 py-2.5 bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase rounded-[4px] shadow-sm transition-all inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit {projectFilter === 'individual' ? 'Individual' : 'New'} Project</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2.5: PENDING GROUP INVITATIONS BANNER                             */}
        {/* ========================================================================= */}
        {pendingInvites.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-[8px] p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>You have {pendingInvites.length} pending group invitation{pendingInvites.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {pendingInvites.map((inv: any) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-[6px] border border-amber-200 p-3">
                  <div>
                    <div className="font-bold text-sm text-[#19232B]">{inv.group_name}</div>
                    <div className="text-xs text-[#757F95]">
                      Invited by {inv.leader_name} · {inv.academic_year}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      Accept to join the group and gain access to the shared project.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await acceptGroupInvitation(inv.group_id, currentUser.uid);
                          await loadDashboardData();
                        } catch (e: any) { alert(e.message); }
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[4px] flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />Accept
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Decline this invitation?')) return;
                        try {
                          await declineGroupInvitation(inv.group_id);
                          await loadDashboardData();
                        } catch (e: any) { alert(e.message); }
                      }}
                      className="px-4 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 text-xs font-bold rounded-[4px]"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: OFFICIAL GROUP ROSTER & STATUS                                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-[8px] shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D5D5D5] pb-4">
            <div>
              <div className="text-[11px] font-bold text-[#757F95] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#CA0765]" />
                <span>Official Capstone Submission Group (4–6 Students)</span>
              </div>
              <h3 className="font-heading font-bold text-xl text-[#19232B] mt-0.5">
                {group ? group.name : 'No Submission Group Registered Yet'}
              </h3>
            </div>

            {group ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed ({group.confirmedCount || group.members?.length || 4} Students)</span>
                </span>
                <span className="px-3 py-1 bg-blue-50 text-[#0070C2] text-xs font-bold rounded border border-blue-200">
                  {group.academic_year || 'Batch 2026-2027'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingGroup(true)}
                className="px-4 py-2 bg-[#0070C2] hover:bg-[#005696] text-white text-xs font-bold uppercase rounded-[4px] flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Group (4–6 Students)</span>
              </button>
            )}
          </div>

          {group ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#19232B] uppercase tracking-wider">
                  Group Members Roster
                </span>
                <span className="text-[11px] text-[#757F95]">
                  {group.confirmedCount} confirmed · Rule: 1 official group per student
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {group.members?.map((m: any, idx: number) => (
                  <div
                    key={m.id || idx}
                    className={`p-3 border rounded-[4px] space-y-1 ${
                      m.invite_status === 'accepted'
                        ? 'bg-[#F6F6F7] border-[#D5D5D5]'
                        : m.invite_status === 'pending'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#19232B] truncate">
                        {m.full_name || `Member #${idx + 1}`}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        m.invite_status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                        m.invite_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {m.invite_status === 'accepted' ? 'Confirmed' : m.invite_status === 'pending' ? 'Pending' : 'Declined'}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#0070C2] font-semibold">
                      {m.student_roll_number}
                    </div>
                    <div className="text-[11px] text-[#757F95]">
                      {m.user_id === group.leader_id ? 'Team Leader' : 'Team Member'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leader: Invite more members if group < 6 */}
              {isLeader && group.members?.length < 6 && (
                <InviteMemberForm groupId={group.id} onInvited={loadDashboardData} />
              )}
            </div>
          ) : isCreatingGroup ? (
            /* Group Creation Form */
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-bold text-sm text-[#19232B]">
                  Register Group Roster (4 to 6 Students)
                </h4>
                <p className="text-xs text-[#757F95]">
                  Leader + 3 to 5 confirmed team members
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-[#19232B] uppercase">Group Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Autonomous Agriculture Robotics Cohort"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#19232B] uppercase">Batch *</label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded bg-white"
                    >
                      <option value="2026-2027">Batch of 2027 (2026-2027)</option>
                      <option value="2027-2028">Batch of 2028 (2027-2028)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19232B] uppercase">Members ({memberInputs.length}/6)</span>
                    {memberInputs.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddMemberRow}
                        className="text-xs font-bold text-[#0070C2] hover:underline"
                      >
                        + Add Student
                      </button>
                    )}
                  </div>

                  {memberInputs.map((mem, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 border border-slate-200 rounded">
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={mem.fullName}
                        onChange={(e) => handleMemberChange(idx, 'fullName', e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Roll No (e.g. 21B91A0501) *"
                        value={mem.studentRollNumber}
                        onChange={(e) => handleMemberChange(idx, 'studentRollNumber', e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-mono border rounded"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Role"
                          value={mem.role}
                          onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                          className="px-2.5 py-1.5 text-xs border rounded flex-1"
                        />
                        {idx >= 4 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberRow(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-4 py-2 text-xs font-bold border rounded bg-white hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#CA0765] hover:bg-[#A10550] rounded shadow-xs"
                  >
                    {formSubmitting ? 'Registering...' : 'Confirm Group'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <p className="text-xs text-[#757F95] leading-relaxed">
              You are currently not registered in a group. You can submit independent <strong>Individual Projects</strong>, or register an official group of 4 to 6 confirmed students to upload a shared group capstone.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
