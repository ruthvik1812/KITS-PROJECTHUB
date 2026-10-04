import React, { useState, useEffect } from 'react';
import { useAuth, useApp } from '../context/AppContext';
import { kitsCollegeConfig } from '../config/collegeConfig';
import { ProjectCard } from '../components/ProjectCard';
import {
  fetchMyGroup,
  submitOfficialProject,
  updateOfficialProject,
  uploadProjectDocument
} from '../services/apiClient';
import { validateGitHubRepoUrl } from '../utils/githubValidator';
import {
  FileText,
  Users,
  User,
  Link2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Globe,
  Github,
  LogIn,
  Save,
  Send,
  Info,
  UploadCloud,
  Video,
  Layers,
  Lock,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Presentation
} from 'lucide-react';

interface SubmitProjectProps {
  editingProject?: any;
  defaultGroup?: any;
  onSuccess: (project: any) => void;
  onCancel: () => void;
  onNavigateSignIn?: () => void;
}

interface MemberFormItem {
  name: string;
  rollNumber: string;
  role: string;
  contribution: string;
}

export const SubmitProject: React.FC<SubmitProjectProps> = ({
  editingProject,
  defaultGroup,
  onSuccess,
  onCancel,
  onNavigateSignIn,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { departments } = useApp();

  const isEditing = Boolean(editingProject?.id);

  // Project Type Selection: 'individual' | 'group'
  const initialSubmissionType: 'individual' | 'group' = editingProject
    ? (editingProject.submission_type || editingProject.submissionType || (editingProject.official_group_id ? 'group' : 'individual'))
    : 'individual';

  const [submissionType, setSubmissionType] = useState<'individual' | 'group'>(initialSubmissionType);

  // Form fields
  const [title, setTitle] = useState(editingProject?.title || '');
  const [summary, setSummary] = useState(editingProject?.summary || '');
  const [problemStatement, setProblemStatement] = useState(
    editingProject?.problem_statement || editingProject?.problemStatement || ''
  );
  const [subject, setSubject] = useState(editingProject?.subject || '');
  const [departmentId, setDepartmentId] = useState(
    editingProject?.department_id || defaultGroup?.department_id || currentUser.departmentId || ''
  );
  const [projectClassification, setProjectClassification] = useState<string>(
    editingProject?.project_type || editingProject?.projectType || (initialSubmissionType === 'individual' ? 'Individual Project' : 'Major Capstone Project')
  );
  const [academicYear, setAcademicYear] = useState(
    editingProject?.academic_year || defaultGroup?.academic_year || '2026-2027'
  );
  const [liveDemoUrl, setLiveDemoUrl] = useState(
    editingProject?.live_demo_url || editingProject?.links?.website || ''
  );
  const [repoUrl, setRepoUrl] = useState(
    editingProject?.repo_url || editingProject?.links?.repository || ''
  );
  const gitHubCheck = repoUrl.trim() ? validateGitHubRepoUrl(repoUrl) : null;
  const [videoUrl, setVideoUrl] = useState(
    editingProject?.video_url || editingProject?.links?.video || ''
  );

  // Project Card Photo / Poster / Banner State
  const initialThumb = editingProject?.thumbnail || (editingProject?.screenshots && editingProject?.screenshots[0]) || '';
  const [projectCardImage, setProjectCardImage] = useState<string>(
    initialThumb && !initialThumb.includes('photo-1581092160607') && !initialThumb.includes('photo-1518770660439') ? initialThumb : ''
  );
  const [cardImageMode, setCardImageMode] = useState<'plain' | 'upload' | 'url'>(
    initialThumb ? 'upload' : 'plain'
  );
  const [cardPreviewTab, setCardPreviewTab] = useState<'full' | 'banner'>('full');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState<string | null>(null);

  const initialDoc = editingProject?.documentation_url || editingProject?.links?.documentation || '';
  const [documentationUrl, setDocumentationUrl] = useState(initialDoc);
  const [docInputMode, setDocInputMode] = useState<'upload' | 'url'>(
    initialDoc && !initialDoc.startsWith('data:') && !initialDoc.includes('/uploads/') ? 'url' : 'upload'
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    initialDoc
      ? (initialDoc.startsWith('data:')
        ? 'Attached_Project_Report.pdf'
        : (initialDoc.split('/').pop() || 'Project_Document.pdf'))
      : ''
  );
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);

  const initialPresentation = editingProject?.presentation_url || editingProject?.presentationUrl || editingProject?.links?.presentation || '';
  const [presentationUrl, setPresentationUrl] = useState(initialPresentation);
  const [presentationInputMode, setPresentationInputMode] = useState<'upload' | 'url'>(
    initialPresentation && (initialPresentation.startsWith('data:') || initialPresentation.includes('/uploads/')) ? 'upload' : 'url'
  );
  const [uploadedPptFileName, setUploadedPptFileName] = useState<string>(
    initialPresentation
      ? (initialPresentation.startsWith('data:')
        ? 'Project_Presentation.pptx'
        : (initialPresentation.split('/').pop() || 'Project_Presentation.pptx'))
      : ''
  );
  const [uploadedPptFileSize, setUploadedPptFileSize] = useState<string>('');
  const [isUploadingPpt, setIsUploadingPpt] = useState(false);
  const [uploadPptError, setUploadPptError] = useState<string | null>(null);

  const [toolsText, setToolsText] = useState(
    Array.isArray(editingProject?.tools)
      ? editingProject.tools.join(', ')
      : (Array.isArray(editingProject?.technologies) ? editingProject.technologies.join(', ') : '')
  );

  const currentDept = (departments && departments.length > 0 ? departments : kitsCollegeConfig.departments).find((d) => d.id === departmentId);
  const [facultyMentorName, setFacultyMentorName] = useState(
    editingProject?.faculty_mentor_name || ''
  );
  const [facultyMentorRole, setFacultyMentorRole] = useState(
    editingProject?.faculty_mentor_role || ''
  );

  // Group and members state for Group Projects
  const [group, setGroup] = useState<any>(defaultGroup || null);
  const [loadingGroup, setLoadingGroup] = useState(!defaultGroup && !isEditing);

  const initialMembers: MemberFormItem[] = editingProject?.original_authors?.length
    ? editingProject.original_authors.map((a: any) => ({
      name: a.name || '',
      rollNumber: a.rollNumber || '',
      role: a.role || 'Contributor',
      contribution: a.contribution || '',
    }))
    : [
      {
        name: currentUser.name || '',
        rollNumber: currentUser.rollNumber || currentUser.studentRollNumber || '',
        role: 'Team Leader',
        contribution: '',
      },
      {
        name: '',
        rollNumber: '',
        role: 'Team Member',
        contribution: '',
      },
      {
        name: '',
        rollNumber: '',
        role: 'Team Member',
        contribution: '',
      },
      {
        name: '',
        rollNumber: '',
        role: 'Team Member',
        contribution: '',
      },
    ];

  const [members, setMembers] = useState<MemberFormItem[]>(initialMembers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!defaultGroup && !isEditing && submissionType === 'group' && isAuthenticated && currentUser.role !== 'visitor' && currentUser.uid !== 'guest-visitor') {
      setLoadingGroup(true);
      fetchMyGroup(currentUser.uid, currentUser.rollNumber)
        .then((grp) => {
          if (grp) {
            setGroup(grp);
            if (grp.department_id) setDepartmentId(grp.department_id);
            if (grp.academic_year) setAcademicYear(grp.academic_year);
            if (grp.members && grp.members.length >= 4) {
              setMembers(
                grp.members.map((m: any) => ({
                  name: m.full_name || 'Group Member',
                  rollNumber: m.student_roll_number || '',
                  role: m.user_id === grp.leader_id ? 'Team Leader' : 'Team Member',
                  contribution: 'Contributed to engineering design and technical implementation.',
                }))
              );
            }
          }
        })
        .catch((err) => console.warn('Fetch group error:', err))
        .finally(() => setLoadingGroup(false));
    }
  }, [currentUser.uid, currentUser.rollNumber, isEditing, defaultGroup, submissionType]);

  const handleMemberChange = (index: number, field: keyof MemberFormItem, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleAddMember = () => {
    if (members.length >= 6) return;
    setMembers([
      ...members,
      {
        name: '',
        rollNumber: '',
        role: 'Technical Contributor',
        contribution: '',
      },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length <= 4) return;
    setMembers(members.filter((_, idx) => idx !== index));
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setUploadDocError('File is too large. Maximum allowed file size is 20MB.');
      return;
    }

    setUploadDocError(null);
    setIsUploadingDoc(true);
    setUploadedFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedFileSize(`${sizeInMB} MB`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const uploadRes = await uploadProjectDocument(file.name, base64Data);
          if (uploadRes && uploadRes.url) {
            setDocumentationUrl(uploadRes.url);
          } else {
            setDocumentationUrl(base64Data);
          }
        } catch (uploadErr) {
          console.warn('Backend file save failed, falling back to base64 data URL:', uploadErr);
          setDocumentationUrl(base64Data);
        } finally {
          setIsUploadingDoc(false);
        }
      };
      reader.onerror = () => {
        setUploadDocError('Failed to read file from disk.');
        setIsUploadingDoc(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadDocError(err.message || 'File processing failed.');
      setIsUploadingDoc(false);
    }
  };

  const handleRemoveDocFile = () => {
    setDocumentationUrl('');
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadDocError(null);
  };

  const handlePptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadPptError('Presentation file is too large. Maximum allowed file size is 50MB.');
      return;
    }

    setUploadPptError(null);
    setIsUploadingPpt(true);
    setUploadedPptFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedPptFileSize(`${sizeInMB} MB`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const uploadRes = await uploadProjectDocument(file.name, base64Data);
          if (uploadRes && uploadRes.url) {
            setPresentationUrl(uploadRes.url);
          } else {
            setPresentationUrl(base64Data);
          }
        } catch (uploadErr) {
          console.warn('Backend presentation file save failed, falling back to base64 data URL:', uploadErr);
          setPresentationUrl(base64Data);
        } finally {
          setIsUploadingPpt(false);
        }
      };
      reader.onerror = () => {
        setUploadPptError('Failed to read presentation file from disk.');
        setIsUploadingPpt(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadPptError(err.message || 'Presentation file processing failed.');
      setIsUploadingPpt(false);
    }
  };

  const handleRemovePptFile = () => {
    setPresentationUrl('');
    setUploadedPptFileName('');
    setUploadedPptFileSize('');
    setUploadPptError(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadImageError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadImageError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingImage(true);
    setUploadImageError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setProjectCardImage(reader.result as string);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setUploadImageError('Failed to read image file.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCardImage = () => {
    setProjectCardImage('');
    setUploadImageError(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Project title is required.';
    if (!summary.trim()) newErrors.summary = 'Project description / abstract is required.';
    if (!departmentId) newErrors.departmentId = 'Department selection is required.';
    if (!academicYear) newErrors.academicYear = 'Academic year / batch is required.';

    // GitHub repository link validation
    const gitHubValidation = validateGitHubRepoUrl(repoUrl);
    if (!gitHubValidation.valid) {
      newErrors.repoUrl = gitHubValidation.error || 'Please enter a valid GitHub repository link (e.g. https://github.com/username/repository).';
    }

    if (submissionType === 'group') {
      if (members.length < 4 || members.length > 6) {
        newErrors.members = `Each group project must contain 4 to 6 confirmed students. Current count: ${members.length}.`;
      }

      const rolls = new Set<string>();
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m.name.trim()) newErrors[`memberName_${i}`] = `Member #${i + 1} name is required.`;
        if (!m.rollNumber.trim()) newErrors[`memberRoll_${i}`] = `Member #${i + 1} roll number is required.`;
        if (!m.contribution.trim()) newErrors[`memberCont_${i}`] = `Member #${i + 1} contribution is required.`;

        const upperRoll = m.rollNumber.trim().toUpperCase();
        if (upperRoll) {
          if (rolls.has(upperRoll)) {
            newErrors[`memberRoll_${i}`] = `Duplicate roll number ${upperRoll} detected in team roster.`;
          }
          rolls.add(upperRoll);
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      setGlobalError('Please fix the validation errors before publishing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedTools = toolsText
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);

      const gitHubCheck = validateGitHubRepoUrl(repoUrl);
      const cleanRepo = gitHubCheck.valid && gitHubCheck.normalized ? gitHubCheck.normalized : repoUrl.trim();

      if (isEditing) {
        // Edit project - RETAINS EXISTING CANONICAL ID!
        const result = await updateOfficialProject(editingProject.id, {
          title: title.trim(),
          summary: summary.trim(),
          problemStatement: problemStatement.trim() || undefined,
          subject: subject.trim(),
          departmentId,
          academicYear,
          projectType: projectClassification,
          liveDemoUrl: liveDemoUrl.trim() || undefined,
          repoUrl: cleanRepo || undefined,
          documentationUrl: documentationUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          presentationUrl: presentationUrl.trim() || undefined,
          thumbnail: projectCardImage.trim() || undefined,
          screenshots: projectCardImage.trim() ? [projectCardImage.trim()] : [],
          facultyMentorName: submissionType === 'individual' ? undefined : (facultyMentorName.trim() || undefined),
          facultyMentorRole: submissionType === 'individual' ? undefined : (facultyMentorRole.trim() || undefined),
          tools: parsedTools,
          members: submissionType === 'group' ? members.map((m) => ({
            name: m.name.trim(),
            rollNumber: m.rollNumber.trim().toUpperCase(),
            role: m.role.trim() || 'Contributor',
            contribution: m.contribution.trim(),
          })) : undefined,
        });

        onSuccess(result.project || {
          ...editingProject,
          id: editingProject.id,
          title,
          summary,
          problem_statement: problemStatement,
          subject,
          project_type: projectClassification,
          projectType: projectClassification,
          submission_type: submissionType,
          submissionType,
          tools: parsedTools,
          thumbnail: projectCardImage.trim() || '',
          screenshots: projectCardImage.trim() ? [projectCardImage.trim()] : [],
          documentation_url: documentationUrl,
          video_url: videoUrl,
          presentation_url: presentationUrl,
          presentationUrl: presentationUrl,
          links: {
            website: liveDemoUrl.trim() || undefined,
            repository: cleanRepo || undefined,
            documentation: documentationUrl.trim() || undefined,
            video: videoUrl.trim() || undefined,
            presentation: presentationUrl.trim() || undefined,
          },
          faculty_mentor_name: submissionType === 'individual' ? undefined : facultyMentorName,
          faculty_mentor_role: submissionType === 'individual' ? undefined : facultyMentorRole
        });
      } else {
        // Create new project (Individual or Group)
        const targetGroupId = submissionType === 'group' ? (group?.id || defaultGroup?.id || `grp-${Date.now()}`) : undefined;

        const result = await submitOfficialProject({
          submissionType,
          groupId: targetGroupId,
          title: title.trim(),
          summary: summary.trim(),
          problemStatement: problemStatement.trim() || undefined,
          subject: subject.trim(),
          departmentId,
          academicYear,
          projectType: projectClassification,
          liveDemoUrl: liveDemoUrl.trim() || undefined,
          repoUrl: cleanRepo || undefined,
          documentationUrl: documentationUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          presentationUrl: presentationUrl.trim() || undefined,
          thumbnail: projectCardImage.trim() || undefined,
          screenshots: projectCardImage.trim() ? [projectCardImage.trim()] : [],
          facultyMentorName: submissionType === 'individual' ? undefined : (facultyMentorName.trim() || undefined),
          facultyMentorRole: submissionType === 'individual' ? undefined : (facultyMentorRole.trim() || undefined),
          tools: parsedTools,
          members: submissionType === 'group' ? members.map((m) => ({
            name: m.name.trim(),
            rollNumber: m.rollNumber.trim().toUpperCase(),
            role: m.role.trim() || 'Contributor',
            contribution: m.contribution.trim(),
          })) : undefined,
        });

        onSuccess(result.project || {
          id: result.projectId,
          title,
          summary,
          problem_statement: problemStatement,
          subject,
          project_type: projectClassification,
          projectType: projectClassification,
          submission_type: submissionType,
          submissionType,
          tools: parsedTools,
          thumbnail: projectCardImage.trim() || '',
          screenshots: projectCardImage.trim() ? [projectCardImage.trim()] : [],
          documentation_url: documentationUrl,
          video_url: videoUrl,
          presentation_url: presentationUrl,
          presentationUrl: presentationUrl,
          links: {
            website: liveDemoUrl.trim() || undefined,
            repository: cleanRepo || undefined,
            documentation: documentationUrl.trim() || undefined,
            video: videoUrl.trim() || undefined,
            presentation: presentationUrl.trim() || undefined,
          },
          faculty_mentor_name: submissionType === 'individual' ? undefined : facultyMentorName,
          faculty_mentor_role: submissionType === 'individual' ? undefined : facultyMentorRole
        });
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to publish project. Please verify inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated && currentUser.role === 'visitor') {
    return (
      <div className="py-16 bg-[#FAFBFC]">
        <div className="kits-container max-w-2xl">
          <div className="kits-card text-center space-y-6 py-12">
            <span className="kits-cyan-corner-tl" />
            <span className="kits-cyan-corner-br" />
            <div className="w-16 h-16 rounded-full bg-[#CA0765]/10 text-[#CA0765] flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-2xl text-[#19232B]">
                Authentication Required
              </h2>
              <p className="text-xs sm:text-sm text-[#757F95] max-w-md mx-auto leading-relaxed">
                Please sign in with your official account to create or modify student projects. Project browsing remains publicly open.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateSignIn) {
                    onNavigateSignIn();
                  } else {
                    onCancel();
                  }
                }}
                className="px-6 py-3 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold text-xs uppercase tracking-wider rounded-[4px] shadow-sm inline-flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Your Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-[#19232B] text-white border-b-4 border-[#CA0765] py-10">
        <div className="kits-container space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#CA0765]">
            <FileText className="w-4 h-4" />
            <span>{isEditing ? 'Project Modification' : 'Repository Submission'}</span>
          </div>

          <h1 className="font-heading font-bold text-2xl sm:text-4xl text-white tracking-tight">
            {isEditing ? 'Edit Project' : 'Submit Engineering Project'}
          </h1>

          <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
            {isEditing ? (
              <span>
                Modifying existing project. <strong>Retains canonical ID: {editingProject.id}</strong>. Updates take effect immediately in the repository.
              </span>
            ) : (
              <span>
                Support for <strong>Individual Projects</strong> (single student owner) and <strong>Group Projects</strong> (4–6 confirmed students). Published immediately after validation.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="kits-container max-w-4xl">
        {globalError && (
          <div className="p-4 mb-6 bg-rose-50 border-l-4 border-rose-600 rounded-[4px] text-xs text-rose-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Validation / Duplicate Check Notice</div>
              <p className="mt-0.5">{globalError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="kits-card p-6 sm:p-8 bg-white space-y-8">
          <span className="kits-cyan-corner-tl" />
          <span className="kits-cyan-corner-br" />

          {/* Section 1: Required Project Type Selection */}
          <div className="space-y-4">
            <div className="border-b border-[#D5D5D5] pb-3">
              <h2 className="font-heading font-bold text-lg text-[#19232B] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#CA0765]" />
                <span>1. Project Type &amp; Ownership *</span>
              </h2>
              <p className="text-xs text-[#757F95] mt-0.5">
                Select whether this is an Individual Project or a Group Project
              </p>
            </div>

            {/* Project Type Selectable Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Individual Project Option */}
              <label
                className={`relative flex flex-col p-4 rounded-[6px] border-2 cursor-pointer transition-all ${submissionType === 'individual'
                  ? 'border-[#0070C2] bg-blue-50/50 shadow-sm'
                  : 'border-[#D5D5D5] bg-white hover:border-slate-400'
                  } ${isEditing ? 'opacity-90 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="projectTypeSelection"
                      value="individual"
                      checked={submissionType === 'individual'}
                      disabled={isEditing}
                      onChange={() => {
                        if (!isEditing) {
                          setSubmissionType('individual');
                          setProjectClassification('Individual Project');
                        }
                      }}
                      className="mt-0.5 text-[#0070C2] focus:ring-[#0070C2]"
                    />
                    <div>
                      <div className="text-sm font-bold text-[#19232B] flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#0070C2]" />
                        <span>Individual Project</span>
                      </div>
                      <p className="text-xs text-[#757F95] mt-1 leading-relaxed">
                        Single student author and owner. You can submit distinct individual projects alongside your group project. No team members required.
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <span title="Project type locked on edit" className="text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </label>

              {/* Group Project Option */}
              <label
                className={`relative flex flex-col p-4 rounded-[6px] border-2 cursor-pointer transition-all ${submissionType === 'group'
                  ? 'border-[#CA0765] bg-pink-50/30 shadow-sm'
                  : 'border-[#D5D5D5] bg-white hover:border-slate-400'
                  } ${isEditing ? 'opacity-90 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="projectTypeSelection"
                      value="group"
                      checked={submissionType === 'group'}
                      disabled={isEditing}
                      onChange={() => {
                        if (!isEditing) {
                          setSubmissionType('group');
                          setProjectClassification('Major Capstone Project');
                        }
                      }}
                      className="mt-0.5 text-[#CA0765] focus:ring-[#CA0765]"
                    />
                    <div>
                      <div className="text-sm font-bold text-[#19232B] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#CA0765]" />
                        <span>Group Project</span>
                      </div>
                      <p className="text-xs text-[#757F95] mt-1 leading-relaxed">
                        4–6 confirmed students per group. One group per student, and one shared project per group submitted by the group leader.
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <span title="Project type locked on edit" className="text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </label>
            </div>

            {isEditing && (
              <p className="text-[11px] text-[#757F95] flex items-center gap-1 italic">
                <Lock className="w-3 h-3 text-[#0070C2]" />
                <span>Project ownership model is locked in edit mode to preserve submission limits.</span>
              </p>
            )}
          </div>

          {/* Section 2: Core Details & Metadata */}
          <div className="space-y-4 pt-4 border-t border-[#D5D5D5]">
            <div className="border-b border-[#D5D5D5] pb-3">
              <h2 className="font-heading font-bold text-lg text-[#19232B] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#CA0765]" />
                <span>2. Project Information &amp; Abstract</span>
              </h2>
              <p className="text-xs text-[#757F95] mt-0.5">
                Descriptive information and problem statement
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19232B] uppercase">
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder=""
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs font-medium border rounded-[4px] focus:outline-none focus:border-[#CA0765] ${errors.title ? 'border-rose-500' : 'border-[#D5D5D5]'
                  }`}
              />
              {errors.title && <p className="text-[11px] text-rose-600">{errors.title}</p>}
            </div>

            {/* Subject/Category, Department, Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#19232B] uppercase">
                  Subject / Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] bg-white focus:outline-none focus:border-[#CA0765]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#19232B] uppercase">
                  B.Tech Department *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] bg-white focus:outline-none focus:border-[#CA0765]"
                >
                  {(departments && departments.length > 0 ? departments : kitsCollegeConfig.departments).map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} — {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#19232B] uppercase">
                  Academic Year / Batch *
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] bg-white focus:outline-none focus:border-[#CA0765]"
                >
                  <option value="2026-2027">Batch of 2027 (2026-2027)</option>
                  <option value="2027-2028">Batch of 2028 (2027-2028)</option>
                  <option value="2028-2029">Batch of 2029 (2028-2029)</option>
                  <option value="2029-2030">Batch of 2030 (2029-2030)</option>
                  <option value="2030-2031">Batch of 2031 (2030-2031)</option>
                </select>
              </div>
            </div>

            {/* Description / Summary */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19232B] uppercase">
                Project Abstract &amp; Solution Summary *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide a comprehensive summary of the engineering solution, methodology, and key outcomes..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs font-normal border rounded-[4px] focus:outline-none focus:border-[#CA0765] leading-relaxed ${errors.summary ? 'border-rose-500' : 'border-[#D5D5D5]'
                  }`}
              />
              {errors.summary && <p className="text-[11px] text-rose-600">{errors.summary}</p>}
            </div>

            {/* Problem Statement */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19232B] uppercase">
                Problem Statement &amp; Motivation
              </label>
              <textarea
                rows={2}
                placeholder="What real-world engineering challenge or research gap does this project solve?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-normal border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#CA0765] leading-relaxed"
              />
            </div>

            {/* Technologies */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#0070C2]" />
                <span>Technologies &amp; Tools Used (comma-separated) *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. PyTorch, React, ESP32, OpenCV, TypeScript, PostgreSQL"
                value={toolsText}
                onChange={(e) => setToolsText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#CA0765]"
              />
            </div>
          </div>

          {/* Section 3: Deliverables, Media & Links */}
          <div className="space-y-5 pt-4 border-t border-[#D5D5D5]">
            <div className="border-b border-[#D5D5D5] pb-3">
              <h2 className="font-heading font-bold text-lg text-[#19232B] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#CA0765]" />
                <span>3. Project Card Cover, Deliverables &amp; Links</span>
              </h2>
              <p className="text-xs text-[#757F95] mt-0.5">
                Upload your project card cover photo, demo links, repository, and technical report
              </p>
            </div>

            {/* Project Card Cover / Photo Upload Section */}
            <div className="p-4 sm:p-5 bg-slate-50/70 border border-[#D5D5D5] rounded-[6px] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                <div>
                  <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#CA0765]" />
                    <span>Project Card Presentation &amp; Cover</span>
                  </label>
                  <p className="text-[11px] text-[#757F95] mt-0.5">
                    Select a Plain Card format (no image required) or upload a custom prototype photo/poster
                  </p>
                </div>

                <div className="inline-flex rounded-[4px] border border-[#D5D5D5] bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCardImageMode('plain');
                      setProjectCardImage('');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${cardImageMode === 'plain'
                      ? 'bg-[#19232B] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Plain Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardImageMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${cardImageMode === 'upload'
                      ? 'bg-[#CA0765] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardImageMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${cardImageMode === 'url'
                      ? 'bg-[#0070C2] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Image URL</span>
                  </button>
                </div>
              </div>

              {/* Upload, URL, or Plain Card Controls & Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-1">
                {/* Left Column: Mode-specific input controls */}
                <div className="lg:col-span-6 space-y-3">
                  {cardImageMode === 'plain' ? (
                    <div className="p-4 bg-white border border-slate-200 rounded-[6px] space-y-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0070C2] flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-[#0070C2]" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-[#19232B]">
                            Plain Institutional Card Active
                          </div>
                          <p className="text-[11px] text-[#757F95] leading-relaxed">
                            No photo or image upload is needed. Your project card will display the clean, standardized KITS College institutional presentation with your department badge, academic year, project category, and technologies.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">Want to add a custom prototype photo?</span>
                        <button
                          type="button"
                          onClick={() => setCardImageMode('upload')}
                          className="px-2.5 py-1 text-xs font-bold text-[#CA0765] hover:bg-pink-50 rounded transition-colors"
                        >
                          Switch to Photo Upload →
                        </button>
                      </div>
                    </div>
                  ) : cardImageMode === 'upload' ? (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-[#D5D5D5] hover:border-[#CA0765] rounded-[6px] p-4 bg-white text-center transition-colors">
                        <input
                          type="file"
                          id="card-photo-input"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="card-photo-input"
                          className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#CA0765]">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-[#19232B] hover:text-[#CA0765]">
                            {isUploadingImage ? 'Reading image...' : 'Click to select project photo / poster / screenshot'}
                          </span>
                          <span className="text-[10px] text-[#757F95]">
                            Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                          </span>
                        </label>
                      </div>

                      {uploadImageError && (
                        <p className="text-[11px] text-rose-600 font-semibold">{uploadImageError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#757F95] uppercase">
                        Image Web Address (Direct Link)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or hosted image URL"
                        value={projectCardImage}
                        onChange={(e) => setProjectCardImage(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#CA0765] bg-white font-mono"
                      />
                    </div>
                  )}

                  {projectCardImage && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Custom card image loaded
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCardImage}
                        className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove photo (switch to plain card)
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column: Live Card Preview with Toggle */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center bg-white p-4 rounded-[6px] border border-slate-200 shadow-2xs">
                  <div className="w-full flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-[#19232B] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#CA0765]" />
                      <span>{cardImageMode === 'plain' ? 'Plain Card Preview' : 'Card Live Preview'}</span>
                    </span>

                    <div className="inline-flex rounded-[3px] border border-slate-200 bg-slate-50 p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCardPreviewTab('full')}
                        className={`px-2 py-0.5 font-bold rounded-[2px] transition-all ${cardPreviewTab === 'full' ? 'bg-white text-[#19232B] shadow-2xs' : 'text-[#757F95]'
                          }`}
                      >
                        Full Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardPreviewTab('banner')}
                        className={`px-2 py-0.5 font-bold rounded-[2px] transition-all ${cardPreviewTab === 'banner' ? 'bg-white text-[#19232B] shadow-2xs' : 'text-[#757F95]'
                          }`}
                      >
                        Banner Only
                      </button>
                    </div>
                  </div>

                  {cardPreviewTab === 'full' ? (
                    <div className="w-full max-w-[320px] mx-auto pointer-events-none select-none">
                      <ProjectCard
                        project={{
                          id: editingProject?.id || 'preview-project',
                          title: title.trim() || '',
                          summary: summary.trim() || '',
                          submission_type: submissionType,
                          submissionType: submissionType,
                          department_id: departmentId,
                          departmentName: currentDept?.name || '',
                          academic_year: academicYear,
                          project_type: projectClassification,
                          projectType: projectClassification,
                          tools: toolsText.trim()
                            ? toolsText.split(',').map((t: string) => t.trim()).filter(Boolean)
                            : ['Embedded C', 'IoT', 'FreeRTOS'],
                          thumbnail: cardImageMode === 'plain' ? '' : (projectCardImage.trim() || ''),
                          screenshots: cardImageMode !== 'plain' && projectCardImage.trim() ? [projectCardImage.trim()] : [],
                          original_authors: submissionType === 'individual'
                            ? [{ name: currentUser.name || 'Student Author', rollNumber: currentUser.studentRollNumber || currentUser.rollNumber || '21B91A0501' }]
                            : members.filter((m: MemberFormItem) => m.name.trim()).map((m: MemberFormItem) => ({ name: m.name.trim(), rollNumber: m.rollNumber.trim() })),
                          teamMembers: submissionType === 'individual'
                            ? [{ name: currentUser.name || 'Student Author', rollNumber: currentUser.studentRollNumber || currentUser.rollNumber || '21B91A0501' }]
                            : members.filter((m: MemberFormItem) => m.name.trim()).map((m: MemberFormItem) => ({ name: m.name.trim(), rollNumber: m.rollNumber.trim() })),
                          live_demo_url: liveDemoUrl.trim() || undefined,
                          repo_url: repoUrl.trim() || undefined,
                          documentation_url: documentationUrl.trim() || undefined,
                          presentation_url: presentationUrl.trim() || undefined,
                          averageRating: 0,
                          totalRatings: 0,
                        }}
                        onSelect={() => { }}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[260px] aspect-16/9 rounded-[4px] overflow-hidden border border-[#D5D5D5] shadow-xs relative bg-slate-900 mx-auto">
                      {projectCardImage ? (
                        <img
                          src={projectCardImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#19232B] via-[#0B2545] to-[#0070C2]/80 flex flex-col justify-between p-2.5 relative overflow-hidden">
                          <div
                            className="absolute inset-0 opacity-15 pointer-events-none"
                            style={{
                              backgroundImage: `radial-gradient(circle at 1px 1px, #03A9F5 1px, transparent 0)`,
                              backgroundSize: '12px 12px',
                            }}
                          />
                          <div className="flex items-center justify-between z-10 text-[9px] font-bold text-white/90">
                            <span className="bg-white/15 px-1.5 py-0.5 rounded border border-white/20">
                              {currentDept?.code || 'KITS'}
                            </span>
                            <span className="bg-black/40 px-1.5 py-0.5 rounded">
                              {academicYear}
                            </span>
                          </div>
                          <div className="my-auto z-10 text-center px-1">
                            <div className="text-[10.5px] font-bold text-white line-clamp-2 tracking-tight">
                              {title || 'Project Title Preview'}
                            </div>
                          </div>
                          <div className="text-[8.5px] text-white/70 font-semibold border-t border-white/10 pt-1 z-10 truncate">
                            Plain Institutional Banner
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.2 rounded backdrop-blur-xs">
                        Banner Preview
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-[#757F95] mt-2 font-semibold">
                    {cardPreviewTab === 'full' ? 'Interactive Real-Time Card Preview' : '16:9 Cover Banner Preview'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#CA0765]" />
                  <span>Website / Live Demo URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://my-app.web.app"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#CA0765]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-[#19232B]" />
                    <span>GitHub Repo URL *</span>
                  </label>
                  {gitHubCheck && gitHubCheck.valid && (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Valid Repo</span>
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/project-repo"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (errors.repoUrl) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.repoUrl;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => {
                    if (repoUrl.trim()) {
                      const check = validateGitHubRepoUrl(repoUrl);
                      if (check.valid && check.normalized) {
                        setRepoUrl(check.normalized);
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-[4px] focus:outline-none transition-colors font-mono ${errors.repoUrl
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : gitHubCheck && gitHubCheck.valid
                      ? 'border-emerald-500 bg-emerald-50/10 focus:border-emerald-600'
                      : 'border-[#D5D5D5] focus:border-[#CA0765]'
                    }`}
                />
                {errors.repoUrl ? (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.repoUrl}</span>
                  </p>
                ) : repoUrl.trim() && gitHubCheck && !gitHubCheck.valid ? (
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                    <Info className="w-3 h-3 shrink-0 text-amber-600" />
                    <span>{gitHubCheck.error}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-600" />
                  <span>Demo Video URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#CA0765]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                  <Presentation className="w-3.5 h-3.5 text-[#D83B01]" />
                  <span>PowerPoint Link</span>
                  {submissionType === 'group' ? (
                    <span className="text-[10px] text-[#D83B01] font-bold">★ Group</span>
                  ) : (
                    <span className="text-[10px] text-[#757F95] font-normal normal-case">(Optional)</span>
                  )}
                </label>
                <input
                  type="url"
                  placeholder={submissionType === 'individual' ? "Optional: https://..." : "https://..."}
                  value={presentationUrl}
                  onChange={(e) => setPresentationUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#D83B01]"
                />
              </div>
            </div>

            {/* PowerPoint Presentation Upload / Web Link Section */}
            <div className={`p-4 rounded-[6px] space-y-3 border transition-colors ${submissionType === 'group'
              ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
              : 'bg-slate-50/70 border-[#D5D5D5]'
              }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                      <Presentation className="w-4 h-4 text-[#D83B01]" />
                      <span>PowerPoint Presentation / Slides Link</span>
                    </label>
                    {submissionType === 'group' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wide">
                        Group Viva &amp; Review Presentation
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 uppercase tracking-wide">
                        Optional for Individual
                      </span>
                    )}
                  </div>
                </div>

                <div className="inline-flex rounded-[4px] border border-[#D5D5D5] bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPresentationInputMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${presentationInputMode === 'url'
                      ? 'bg-[#D83B01] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Web URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresentationInputMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${presentationInputMode === 'upload'
                      ? 'bg-[#CA0765] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload PPT / PPTX</span>
                  </button>
                </div>
              </div>

              {presentationInputMode === 'upload' ? (
                <div className="space-y-2 pt-1">
                  {presentationUrl ? (
                    <div className="p-3.5 bg-white border-2 border-emerald-500/40 rounded-[4px] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[4px] bg-orange-100 text-[#D83B01] flex items-center justify-center shrink-0">
                          <Presentation className="w-5 h-5 text-[#D83B01]" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#19232B] flex items-center gap-2">
                            <span className="truncate max-w-[240px] sm:max-w-md">
                              {uploadedPptFileName || 'Project_Presentation.pptx'}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold uppercase tracking-wide">
                              ✓ Attached
                            </span>
                          </div>
                          <div className="text-[11px] text-[#757F95] flex items-center gap-2 mt-0.5">
                            {uploadedPptFileSize && <span className="font-mono">{uploadedPptFileSize}</span>}
                            <span className="text-emerald-700 font-semibold">
                              Ready for submission
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#19232B] rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#D83B01]" />
                          <span>Preview / Download</span>
                        </a>
                        <button
                          type="button"
                          onClick={handleRemovePptFile}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#B0BEC5] hover:border-[#D83B01] rounded-[4px] bg-white cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept=".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        onChange={handlePptFileUpload}
                        disabled={isUploadingPpt}
                        className="sr-only"
                      />
                      <div className="w-12 h-12 rounded-full bg-[#F6F6F7] group-hover:bg-orange-50 text-[#757F95] group-hover:text-[#D83B01] flex items-center justify-center transition-colors mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-[#19232B] group-hover:text-[#D83B01] transition-colors flex items-center gap-1.5">
                        <span>{isUploadingPpt ? 'Uploading presentation file...' : 'Click to Browse Presentation File or Drag & Drop'}</span>
                      </div>
                      <p className="text-[11px] text-[#757F95] mt-1">
                        Supported formats: PPT, PPTX, PDF (Max size: 50MB) {submissionType === 'individual' && '— Optional'}
                      </p>
                    </label>
                  )}

                  {uploadPptError && (
                    <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadPptError}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder={submissionType === 'individual'
                        ? "Optional: https://... (leave blank if none)"
                        : "https://..."}
                      value={presentationUrl}
                      onChange={(e) => {
                        setPresentationUrl(e.target.value);
                        setUploadedPptFileName('');
                        setUploadedPptFileSize('');
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#D83B01]"
                    />
                    <Presentation className="w-4 h-4 text-[#D83B01] absolute left-3 top-3 pointer-events-none" />
                  </div>
                  {presentationUrl && (
                    <div className="flex justify-end text-[11px] text-[#757F95]">
                      <a
                        href={presentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0070C2] hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Link</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Documentation Report Upload/URL */}
            <div className="p-4 bg-slate-50/70 border border-[#D5D5D5] rounded-[4px] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#19232B] uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#0070C2]" />
                      <span>Project Documentation / Technical Report</span>
                    </label>
                    {submissionType === 'individual' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 uppercase tracking-wide">
                        Optional for Individual
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 uppercase tracking-wide">
                        Recommended for Group
                      </span>
                    )}
                  </div>
                 
                </div>

                <div className="inline-flex rounded-[4px] border border-[#D5D5D5] bg-white p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDocInputMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${docInputMode === 'upload'
                      ? 'bg-[#CA0765] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocInputMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all ${docInputMode === 'url'
                      ? 'bg-[#0070C2] text-white shadow-xs'
                      : 'text-[#757F95] hover:text-[#19232B]'
                      }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Web URL</span>
                  </button>
                </div>
              </div>

              {docInputMode === 'upload' ? (
                <div className="space-y-2 pt-1">
                  {documentationUrl ? (
                    <div className="p-3.5 bg-white border-2 border-emerald-500/40 rounded-[4px] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[4px] bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#19232B] flex items-center gap-2">
                            <span className="truncate max-w-[240px] sm:max-w-md">
                              {uploadedFileName || 'Project_Report.pdf'}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold uppercase tracking-wide">
                              ✓ Attached
                            </span>
                          </div>
                          <div className="text-[11px] text-[#757F95] flex items-center gap-2 mt-0.5">
                            {uploadedFileSize && <span className="font-mono">{uploadedFileSize}</span>}
                            <span className="text-emerald-700 font-semibold">
                              Ready for submission
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#19232B] rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#0070C2]" />
                          <span>Preview</span>
                        </a>
                        <button
                          type="button"
                          onClick={handleRemoveDocFile}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#B0BEC5] hover:border-[#CA0765] rounded-[4px] bg-white cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,application/pdf"
                        onChange={handleDocFileUpload}
                        disabled={isUploadingDoc}
                        className="sr-only"
                      />
                      <div className="w-12 h-12 rounded-full bg-[#F6F6F7] group-hover:bg-[#CA0765]/10 text-[#757F95] group-hover:text-[#CA0765] flex items-center justify-center transition-colors mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-[#19232B] group-hover:text-[#CA0765] transition-colors flex items-center gap-1.5">
                        <span>{isUploadingDoc ? 'Uploading document...' : 'Click to Browse File or Drag & Drop'}</span>
                      </div>
                      <p className="text-[11px] text-[#757F95] mt-1">
                        Supported formats: PDF, DOC, DOCX (Max size: 20MB) {submissionType === 'individual' && '— Optional'}
                      </p>
                    </label>
                  )}

                  {uploadDocError && (
                    <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadDocError}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <input
                    type="url"
                    placeholder={submissionType === 'individual'
                      ? "Optional: e.g. https://drive.google.com/file/d/... or https://kitsts.ac.in/report.pdf (leave blank if none)"
                      : "e.g. https://drive.google.com/file/d/... or https://kitsts.ac.in/report.pdf"}
                    value={documentationUrl}
                    onChange={(e) => {
                      setDocumentationUrl(e.target.value);
                      setUploadedFileName('');
                      setUploadedFileSize('');
                    }}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#0070C2]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Author / Team Roster based on Project Type */}
          {submissionType === 'individual' ? (
            <div className="space-y-4 pt-4 border-t border-[#D5D5D5]">
              <div className="border-b border-[#D5D5D5] pb-3">
                <h2 className="font-heading font-bold text-lg text-[#19232B] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0070C2]" />
                  <span>4. Project Author (Individual Project)</span>
                </h2>
                <p className="text-xs text-[#757F95] mt-0.5">
                  Automatically associated with your verified student account
                </p>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-[6px] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0070C2] text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AR'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#19232B]">
                      {currentUser.name || currentUser.fullName || 'A. Rahul'}
                    </div>
                    <div className="text-xs text-[#757F95] flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[#0070C2] font-semibold">
                        {currentUser.studentRollNumber || currentUser.rollNumber || ''}
                      </span>
                      <span>•</span>
                      <span>{currentUser.departmentName || 'Computer Science and Engineering'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verify user signed in as '{currentUser.name || currentUser.fullName || 'A. Rahul'}' with student roll number '{currentUser.studentRollNumber || currentUser.rollNumber || '21B91A0501'}'.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t border-[#D5D5D5]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5D5D5] pb-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-[#19232B] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#CA0765]" />
                    <span>4. Confirmed Student Team ({members.length} of 4–6 Students) *</span>
                  </h2>
                  <p className="text-xs text-[#757F95] mt-0.5">
                    Group projects require 4 to 6 confirmed students.
                  </p>
                </div>

                {members.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0070C2] rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Member ({members.length + 1}/6)</span>
                  </button>
                )}
              </div>

              {errors.members && (
                <p className="text-xs text-rose-600 font-semibold">{errors.members}</p>
              )}

              <div className="space-y-4">
                {members.map((mem, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F6F6F7] border border-[#D5D5D5] rounded-[4px] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#19232B] uppercase">
                        Student #{idx + 1} {idx === 0 ? '(Team Leader)' : ''}
                      </span>

                      {members.length > 4 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#757F95] uppercase">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={mem.name}
                          onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs border rounded bg-white ${errors[`memberName_${idx}`] ? 'border-rose-500' : 'border-[#D5D5D5]'
                            }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#757F95] uppercase">
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 21B91A0501"
                          value={mem.rollNumber}
                          onChange={(e) => handleMemberChange(idx, 'rollNumber', e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs font-mono border rounded bg-white ${errors[`memberRoll_${idx}`] ? 'border-rose-500' : 'border-[#D5D5D5]'
                            }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#757F95] uppercase">
                          Team Role
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Firmware Engineer"
                          value={mem.role}
                          onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-[#D5D5D5] rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#757F95] uppercase">
                        Specific Technical Contribution *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Detail the individual research and technical contribution of this student..."
                        value={mem.contribution}
                        onChange={(e) => handleMemberChange(idx, 'contribution', e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-xs border rounded bg-white ${errors[`memberCont_${idx}`] ? 'border-rose-500' : 'border-[#D5D5D5]'
                          }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Faculty Mentor (Group Capstone Projects Only) */}
          {submissionType === 'group' && (
            <div className="p-4 sm:p-5 bg-white border border-blue-200 rounded-[6px] shadow-2xs space-y-4 pt-4 border-t border-[#D5D5D5]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                <div>
                  <label className="text-xs font-bold text-[#0070C2] uppercase tracking-wider flex items-center gap-1.5">
                    <span>ASSIGNED FACULTY MENTOR *</span>
                  </label>
                  <p className="text-[11px] text-[#757F95] mt-0.5">
                    Specify the supervising faculty member / HOD for this group capstone project
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#19232B] uppercase">
                    Faculty Mentor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Faculty mentor full name"
                    value={facultyMentorName}
                    onChange={(e) => setFacultyMentorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#0070C2] font-semibold text-[#19232B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#19232B] uppercase">
                    Designation &amp; Department *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Designation & department"
                    value={facultyMentorRole}
                    onChange={(e) => setFacultyMentorRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#0070C2] text-[#19232B]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Validation Notice & Actions */}
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-[4px] space-y-1 text-xs text-emerald-900">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Immediate Publication &amp; Duplicate Prevention</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Upon clicking Publish, automatic permission, project-type, URL duplicate, and required-field checks are evaluated. If valid, the project is published immediately to the public repository.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#D5D5D5]">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-[#D5D5D5] text-[#19232B] hover:bg-slate-50 text-xs font-bold uppercase rounded-[4px] transition-colors text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold uppercase tracking-wider rounded-[4px] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying &amp; Publishing...</span>
                </>
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Project Changes</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Project Immediately</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
