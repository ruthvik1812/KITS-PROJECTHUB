import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Project,
  UserProfile,
  UserRole,
  ReviewRubric,
  ReviewFeedback,
  ProjectPrivateData,
  LearnerPracticeRecord,
  ProjectDiscussionPost,
} from '../types';
import {
  fetchAuthMe,
  logoutUser,
  loginUser,
  registerUser,
  setupUserPassword,
  quickLogin,
  verifyStudentRollNumber as apiVerifyRoll,
  fetchProjects as apiFetchProjects,
} from '../services/apiClient';

export interface AuthContextType {
  currentUser: UserProfile;
  firebaseUser: any | null; // Safe user profile compatibility
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isFaculty: boolean;
  isAdmin: boolean;
  isVisitor: boolean;
  isMembershipApproved: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  registerAccount: (params: {
    email: string;
    fullName: string;
    branch: string;
    rollNumber: string;
    password: string;
  }) => Promise<void>;
  setupPassword?: (identifier: string, newPassword: string) => Promise<void>;
  quickSignIn: (preset: string) => Promise<void>;
  devQuickSignIn?: (preset: 'leader' | 'student' | 'faculty' | 'admin') => Promise<void>;
  signInGoogle: (returnTo?: string) => void;
  signInGoogleRedirect?: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  verifyStudentRoll: (rollNumber: string, departmentId?: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  setCurrentUserRole: (role: UserRole) => void;
  promoteUserRole: (targetUid: string, role: UserRole, membershipApproved: boolean) => Promise<void>;
  allUsers: UserProfile[];
  refreshUsers: () => Promise<void>;
}

export interface AppContextType extends AuthContextType {
  projects: Project[];
  refreshProjects: () => Promise<void>;
  isFirestoreConnected: boolean;
  addProject: (
    newProj: Omit<Project, 'id' | 'submittedAt' | 'updatedAt' | 'viewsCount' | 'likesCount'>,
    privateData: {
      studentEmail: string;
      studentRollNumber: string;
      mentorEmail?: string;
      teamRoster: {
        name: string;
        rollNumber: string;
        email?: string;
        role: string;
        contribution: string;
      }[];
      academicIntegrityCertified: boolean;
    }
  ) => Promise<string>;
  submitFacultyReview: (
    projectId: string,
    decision: 'approved' | 'needs_revision' | 'rejected',
    comments: string,
    rubric?: ReviewRubric
  ) => Promise<void>;
  toggleLike: (projectId: string) => void;
  recordView: (projectId: string) => void;
  fetchPrivateProjectData: (projectId: string) => Promise<ProjectPrivateData | null>;
  getProjectById: (id: string) => Project | undefined;

  // Project-based Learning & Practice System
  learnerPractices: Record<string, LearnerPracticeRecord>;
  enrolInProject: (projectId: string) => void;
  toggleMilestoneCompletion: (projectId: string, milestoneId: string) => void;
  updatePracticeNotes: (projectId: string, notes: string, repoUrl?: string) => void;
  addDiscussionPost: (projectId: string, content: string, replyToId?: string) => void;
  upvoteDiscussionPost: (projectId: string, postId: string) => void;
  pathProgress: Record<string, { completedStageNumbers: number[]; diagnosticDone?: boolean }>;
  togglePathStageCompletion: (pathId: string, stageNumber: number) => void;

  isBackendReportOpen: boolean;
  setIsBackendReportOpen: (open: boolean) => void;
  isDemoBannerVisible: boolean;
  dismissDemoBanner: () => void;
  resetDemoData: () => void;
}

const defaultAnonymousUser: UserProfile = {
  uid: 'guest-visitor',
  name: 'Visitor / Prospective Evaluator',
  email: '',
  role: 'visitor',
  membershipApproved: false,
  departmentId: 'cse',
  departmentName: 'Computer Science and Engineering',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const BANNER_STORAGE_KEY = 'kits_demo_banner_dismissed_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultAnonymousUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isBackendReportOpen, setIsBackendReportOpen] = useState<boolean>(false);
  const [isDemoBannerVisible, setIsDemoBannerVisible] = useState<boolean>(() => {
    return localStorage.getItem(BANNER_STORAGE_KEY) !== 'true';
  });

  // 1. Load active session on boot from /api/auth/me
  const loadUserSession = async () => {
    setIsLoadingAuth(true);
    try {
      const me = await fetchAuthMe();
      if (me && me.id) {
        const userProf: UserProfile = {
          uid: me.id,
          name: me.fullName || me.name || 'KITS Member',
          fullName: me.fullName,
          email: me.email || '',
          photoURL: me.photoUrl || me.photoURL || undefined,
          photoUrl: me.photoUrl || me.photoURL || undefined,
          role: (me.role as UserRole) || 'student',
          membershipApproved: Boolean(me.isVerified || me.role === 'admin'),
          departmentId: me.departmentId || 'cse',
          departmentName: me.departmentName || 'Computer Science and Engineering',
          rollNumber: me.studentRollNumber,
          studentRollNumber: me.studentRollNumber,
          section: me.section || 'A1',
          yearSemester: me.yearSemester || 'II Year I Semester',
          mobile: me.mobile || '  8019191292',
          fatherName: me.fatherName || '',
          fatherMobile: me.fatherMobile || '',
          parentEmail: me.parentEmail || '',
          presentAddress: me.presentAddress || '#17-3/1,mamindlawada,huzurabad',
          dob: me.dob || '0000-00-00',
          isVerified: Boolean(me.isVerified),
          group: me.group || null,
          createdAt: me.createdAt || new Date().toISOString(),
          updatedAt: me.updatedAt || new Date().toISOString(),
        };
        setCurrentUser(userProf);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(defaultAnonymousUser);
        setIsAuthenticated(false);
      }
    } catch (err) {
      // Unauthenticated visitor
      setCurrentUser(defaultAnonymousUser);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadUserSession();
  }, []);

  // 2. Load and refresh projects from backend SQL repository
  const refreshProjects = async () => {
    try {
      const data = await apiFetchProjects({ limit: 200 });
      if (data && Array.isArray(data.projects)) {
        const mapped: Project[] = data.projects.map((p: any) => {
          const submissionType = p.submission_type || p.submissionType || (p.official_group_id ? 'group' : 'individual');
          return {
            id: p.id,
            submissionType,
            submission_type: submissionType,
            ownerUserId: p.owner_user_id,
            owner_user_id: p.owner_user_id,
            official_group_id: p.official_group_id,
            group: p.group,
            title: p.title,
            summary: p.summary,
            description: p.summary,
            problemStatement: p.problem_statement || p.problemStatement,
            problem_statement: p.problem_statement || p.problemStatement,
            departmentId: p.department_id || 'cse',
            departmentName: p.department_name || 'Engineering',
            graduationYear: parseInt((p.academic_year || '2027').split('-')[0], 10) + 1,
            academicYear: p.academic_year || '2026-2027',
            academic_year: p.academic_year || '2026-2027',
            projectType: p.project_type || p.projectType || (submissionType === 'individual' ? 'Individual Project' : 'Major Capstone Project'),
            project_type: p.project_type || p.projectType || (submissionType === 'individual' ? 'Individual Project' : 'Major Capstone Project'),
            technologies: Array.isArray(p.tools) ? p.tools : (typeof p.tools === 'string' ? JSON.parse(p.tools || '[]') : []),
            tools: Array.isArray(p.tools) ? p.tools : (typeof p.tools === 'string' ? JSON.parse(p.tools || '[]') : []),
            teamMembers: (p.original_authors || []).map((a: any, idx: number) => ({
              id: `mem-${idx}`,
              name: a.name || 'Student Author',
              role: a.role || 'Contributor',
              contribution: a.contribution || '',
              rollNumber: a.rollNumber,
            })),
            original_authors: p.original_authors || [],
            mentor: {
              name: p.faculty_mentor_name || (submissionType === 'individual' ? '' : 'Dr. M. Ravindra Babu'),
              designation: p.faculty_mentor_role || (submissionType === 'individual' ? '' : 'Professor & HOD'),
              department: p.department_id || (submissionType === 'individual' ? '' : 'CSE'),
            },
            faculty_mentor_name: p.faculty_mentor_name || (submissionType === 'individual' ? undefined : 'Dr. M. Ravindra Babu'),
            faculty_mentor_role: p.faculty_mentor_role || (submissionType === 'individual' ? undefined : 'Professor & HOD · CSE'),
            thumbnail: p.thumbnail || (p.screenshots && p.screenshots[0]) || '',
            links: {
              website: p.live_demo_url,
              repository: p.repo_url,
              documentation: p.documentation_url,
              video: p.video_url,
              presentation: p.presentation_url,
            },
            live_demo_url: p.live_demo_url,
            repo_url: p.repo_url,
            documentation_url: p.documentation_url,
            video_url: p.video_url,
            presentation_url: p.presentation_url,
            presentationUrl: p.presentation_url,
            screenshots: p.screenshots || [],
            status: p.status || 'approved',
            submittedAt: p.created_at || new Date().toISOString(),
            updatedAt: p.updated_at || new Date().toISOString(),
            viewsCount: p.views_count || 120,
            likesCount: p.likes_count || 24,
            averageRating: p.averageRating || 0,
            totalRatings: p.totalRatings || 0,
          };
        });
        setProjects(mapped);
        setIsFirestoreConnected(true);
      }
    } catch (err) {
      console.warn('Backend projects load notice:', err);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  // Sign In with Email and Password
  const signIn = async (email: string, password: string) => {
    setIsLoadingAuth(true);
    try {
      await loginUser(email, password);
      await loadUserSession();
    } catch (err) {
      setIsLoadingAuth(false);
      throw err;
    }
  };

  // Register New Student Account
  const registerAccount = async (params: {
    email: string;
    fullName: string;
    branch: string;
    rollNumber: string;
    password: string;
  }) => {
    setIsLoadingAuth(true);
    try {
      await registerUser(params);
      await loadUserSession();
    } catch (err) {
      setIsLoadingAuth(false);
      throw err;
    }
  };

  // Setup Password for Existing Account
  const setupPassword = async (identifier: string, newPassword: string) => {
    setIsLoadingAuth(true);
    try {
      await setupUserPassword(identifier, newPassword);
      await loadUserSession();
    } catch (err) {
      setIsLoadingAuth(false);
      throw err;
    }
  };

  // Quick 1-Click Sign-in for Presets
  const quickSignIn = async (preset: string) => {
    setIsLoadingAuth(true);
    try {
      await quickLogin(preset);
      await loadUserSession();
    } catch (err) {
      console.error('quickSignIn failed:', err);
      setIsLoadingAuth(false);
      throw err;
    }
  };

  const devQuickSignIn = async (preset: 'leader' | 'student' | 'faculty' | 'admin') => {
    await quickSignIn(preset);
  };

  const signInGoogle = (_returnTo?: string) => {
    quickSignIn('leader');
  };

  const signInGoogleRedirect = (_returnTo?: string) => {
    quickSignIn('leader');
  };

  // Sign out
  const signOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    setCurrentUser(defaultAnonymousUser);
    setIsAuthenticated(false);
  };

  // Refresh current user from backend
  const refreshCurrentUser = async () => {
    await loadUserSession();
  };

  // Verify and link official college student roll number
  const verifyStudentRoll = async (rollNumber: string, departmentId?: string) => {
    await apiVerifyRoll(rollNumber, departmentId);
    await refreshCurrentUser();
  };

  // Self Profile Update
  const updateProfile = async (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  // Perspective simulation or active role override
  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      membershipApproved: role === 'admin' ? true : prev.membershipApproved,
    }));
  };

  // Promote user role (Admin capability)
  const promoteUserRole = async (_targetUid: string, role: UserRole, membershipApproved: boolean) => {
    setCurrentUser((prev) => ({ ...prev, role, membershipApproved }));
  };

  const refreshUsers = async () => {
    // Admin user refresh hook
  };

  // Add project to SQL repository
  const addProject = async (
    newProj: Omit<Project, 'id' | 'submittedAt' | 'updatedAt' | 'viewsCount' | 'likesCount'>,
    _privateData: any
  ): Promise<string> => {
    const fallbackId = `kits-proj-${Date.now()}`;
    const now = new Date().toISOString();
    const created: Project = {
      ...newProj,
      id: fallbackId,
      submittedAt: now,
      updatedAt: now,
      viewsCount: 1,
      likesCount: 0,
      isLiked: false,
    };
    setProjects((prev) => [created, ...prev]);
    return fallbackId;
  };

  // Submit faculty review and rubric evaluation
  const submitFacultyReview = async (
    projectId: string,
    decision: 'approved' | 'needs_revision' | 'rejected',
    comments: string,
    rubric?: ReviewRubric
  ) => {
    const now = new Date().toISOString();
    const feedback: ReviewFeedback = {
      id: `rev-${Date.now()}`,
      reviewerId: currentUser.uid,
      reviewerName: currentUser.name,
      reviewerDepartment: currentUser.departmentName || 'Department Committee',
      decision,
      comments,
      rubric,
      reviewedAt: now,
    };
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            status: decision,
            reviews: [feedback, ...(p.reviews || [])],
            updatedAt: now,
          };
        }
        return p;
      })
    );
  };

  const fetchPrivateProjectData = async (_projectId: string) => {
    return null;
  };

  // Project like toggle
  const toggleLike = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );
  };

  // Project view counter
  const recordView = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return { ...p, viewsCount: p.viewsCount + 1 };
        }
        return p;
      })
    );
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects.find((p) => p.id === id);
  };

  const dismissDemoBanner = () => {
    setIsDemoBannerVisible(false);
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
  };

  const resetDemoData = () => {
    setProjects([]);
  };

  // Local/Session Persistence for Learner Practice Records & Path Progress
  const [learnerPractices, setLearnerPractices] = useState<Record<string, LearnerPracticeRecord>>(() => {
    try {
      const stored = localStorage.getItem('kits_learner_practices_v2');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [pathProgress, setPathProgress] = useState<Record<string, { completedStageNumbers: number[]; diagnosticDone?: boolean }>>(() => {
    try {
      const stored = localStorage.getItem('kits_learning_path_progress_v2');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const enrolInProject = (projectId: string) => {
    setLearnerPractices((prev) => {
      if (prev[projectId]) return prev;
      const newRecord: LearnerPracticeRecord = {
        id: `prac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId,
        userId: currentUser.uid,
        userName: currentUser.name || 'Learner',
        userRole: currentUser.role,
        enrolledAt: new Date().toISOString(),
        completedMilestoneIds: [],
        notes: '',
        status: 'in-progress',
        lastUpdated: new Date().toISOString(),
      };
      const updated = { ...prev, [projectId]: newRecord };
      try {
        localStorage.setItem('kits_learner_practices_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleMilestoneCompletion = (projectId: string, milestoneId: string) => {
    setLearnerPractices((prev) => {
      const existing = prev[projectId] || {
        id: `prac-${Date.now()}`,
        projectId,
        userId: currentUser.uid,
        userName: currentUser.name || 'Learner',
        userRole: currentUser.role,
        enrolledAt: new Date().toISOString(),
        completedMilestoneIds: [],
        notes: '',
        status: 'in-progress',
        lastUpdated: new Date().toISOString(),
      };

      const completed = existing.completedMilestoneIds.includes(milestoneId)
        ? existing.completedMilestoneIds.filter((id) => id !== milestoneId)
        : [...existing.completedMilestoneIds, milestoneId];

      const updated = {
        ...prev,
        [projectId]: {
          ...existing,
          completedMilestoneIds: completed,
          lastUpdated: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem('kits_learner_practices_v2', JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  const updatePracticeNotes = (projectId: string, notes: string, repoUrl?: string) => {
    setLearnerPractices((prev) => {
      const existing = prev[projectId] || {
        id: `prac-${Date.now()}`,
        projectId,
        userId: currentUser.uid,
        userName: currentUser.name || 'Learner',
        enrolledAt: new Date().toISOString(),
        completedMilestoneIds: [],
        notes: '',
        status: 'in-progress',
        lastUpdated: new Date().toISOString(),
      };

      const updated = {
        ...prev,
        [projectId]: {
          ...existing,
          notes,
          ...(repoUrl !== undefined ? { repoUrl } : {}),
          lastUpdated: new Date().toISOString(),
        },
      };

      try {
        localStorage.setItem('kits_learner_practices_v2', JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  const addDiscussionPost = (projectId: string, content: string, replyToId?: string) => {
    const newPost: ProjectDiscussionPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      authorUid: currentUser.uid,
      authorName: currentUser.name || 'KITS Learner',
      authorRole: (currentUser.role === 'admin' ? 'faculty' : currentUser.role === 'visitor' ? 'guest' : currentUser.role) as any,
      avatar: currentUser.photoURL,
      content,
      timestamp: new Date().toISOString(),
      isOriginalAuthor: false,
      upvotes: 0,
      replyToId,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentPosts = p.discussionPosts || [];
          return {
            ...p,
            discussionPosts: [newPost, ...currentPosts],
          };
        }
        return p;
      })
    );
  };

  const upvoteDiscussionPost = (projectId: string, postId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId && p.discussionPosts) {
          return {
            ...p,
            discussionPosts: p.discussionPosts.map((post) => {
              if (post.id === postId) {
                const hasUpvoted = post.hasUpvoted;
                return {
                  ...post,
                  hasUpvoted: !hasUpvoted,
                  upvotes: hasUpvoted ? Math.max(0, post.upvotes - 1) : post.upvotes + 1,
                };
              }
              return post;
            }),
          };
        }
        return p;
      })
    );
  };

  const togglePathStageCompletion = (pathId: string, stageNumber: number) => {
    setPathProgress((prev) => {
      const existing = prev[pathId] || { completedStageNumbers: [] };
      const completed = existing.completedStageNumbers.includes(stageNumber)
        ? existing.completedStageNumbers.filter((n) => n !== stageNumber)
        : [...existing.completedStageNumbers, stageNumber];

      const updated = {
        ...prev,
        [pathId]: {
          ...existing,
          completedStageNumbers: completed,
        },
      };

      try {
        localStorage.setItem('kits_learning_path_progress_v2', JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  // Role booleans computed for convenience
  const isStudent = currentUser.role === 'student';
  const isFaculty = currentUser.role === 'faculty';
  const isAdmin = currentUser.role === 'admin';
  const isVisitor = currentUser.role === 'visitor' || !isAuthenticated;
  const isMembershipApproved = Boolean(currentUser.membershipApproved || isAdmin);

  const contextValue: AppContextType = useMemo(
    () => ({
      // Auth & User Profile
      currentUser,
      firebaseUser: isAuthenticated ? { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.name } : null,
      isLoadingAuth,
      isAuthenticated,
      isStudent,
      isFaculty,
      isAdmin,
      isVisitor,
      isMembershipApproved,
      signIn,
      registerAccount,
      setupPassword,
      quickSignIn,
      devQuickSignIn,
      signInGoogle,
      signInGoogleRedirect,
      signOut,
      updateProfile,
      verifyStudentRoll,
      refreshCurrentUser,
      setCurrentUserRole,
      promoteUserRole,
      allUsers,
      refreshUsers,

      // Projects & Data Store
      projects,
      refreshProjects,
      isFirestoreConnected,
      addProject,
      submitFacultyReview,
      toggleLike,
      recordView,
      fetchPrivateProjectData,
      getProjectById,

      // Project-based Learning & Practice System
      learnerPractices,
      enrolInProject,
      toggleMilestoneCompletion,
      updatePracticeNotes,
      addDiscussionPost,
      upvoteDiscussionPost,
      pathProgress,
      togglePathStageCompletion,

      // Modals & UI Controls
      isBackendReportOpen,
      setIsBackendReportOpen,
      isDemoBannerVisible,
      dismissDemoBanner,
      resetDemoData,
    }),
    [
      currentUser,
      isAuthenticated,
      isLoadingAuth,
      isStudent,
      isFaculty,
      isAdmin,
      isVisitor,
      isMembershipApproved,
      allUsers,
      projects,
      isFirestoreConnected,
      learnerPractices,
      pathProgress,
      isBackendReportOpen,
      isDemoBannerVisible,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAuth must be used within an AppProvider');
  }
  return {
    currentUser: context.currentUser,
    firebaseUser: context.firebaseUser,
    isLoadingAuth: context.isLoadingAuth,
    isAuthenticated: context.isAuthenticated,
    isStudent: context.isStudent,
    isFaculty: context.isFaculty,
    isAdmin: context.isAdmin,
    isVisitor: context.isVisitor,
    isMembershipApproved: context.isMembershipApproved,
    signIn: context.signIn,
    registerAccount: context.registerAccount,
    setupPassword: context.setupPassword,
    quickSignIn: context.quickSignIn,
    signInGoogle: context.signInGoogle,
    signInGoogleRedirect: context.signInGoogleRedirect,
    devQuickSignIn: context.devQuickSignIn,
    signOut: context.signOut,
    updateProfile: context.updateProfile,
    verifyStudentRoll: context.verifyStudentRoll,
    refreshCurrentUser: context.refreshCurrentUser,
    setCurrentUserRole: context.setCurrentUserRole,
    promoteUserRole: context.promoteUserRole,
    allUsers: context.allUsers,
    refreshUsers: context.refreshUsers,
  };
};
