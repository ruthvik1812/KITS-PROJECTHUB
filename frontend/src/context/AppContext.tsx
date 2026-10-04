import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Project,
  UserProfile,
  UserRole,
  Department,
} from '../types';
import { kitsCollegeConfig, DEFAULT_DEPARTMENTS } from '../config/collegeConfig';
import {
  fetchAuthMe,
  logoutUser,
  loginUser,
  registerUser,
  setupUserPassword,
  fetchProjects as apiFetchProjects,
  fetchDepartments,
  recordProjectView,
  recordProjectShare,
  fetchWishlistIds,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  updateUserProfile as apiUpdateUserProfile,
} from '../services/apiClient';

export interface AuthContextType {
  currentUser: UserProfile;
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
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

export interface AppContextType extends AuthContextType {
  projects: Project[];
  refreshProjects: () => Promise<void>;
  wishlistIds: string[];
  isProjectSaved: (projectId: string) => boolean;
  saveToWishlist: (projectId: string) => Promise<{ success: boolean; alreadySaved?: boolean; message?: string }>;
  removeWishlist: (projectId: string) => Promise<{ success: boolean; message?: string }>;
  refreshWishlist: () => Promise<void>;
  pendingWishlistId: string | null;
  setPendingWishlistId: (id: string | null) => void;
  recordView: (projectId: string) => Promise<number | undefined>;
  recordShare: (projectId: string, shareType?: string) => Promise<number | undefined>;
  getProjectById?: (id: string) => Project | undefined;

  // Academic Departments
  departments: Department[];
  refreshDepartments: () => Promise<void>;
}

const defaultAnonymousUser: UserProfile = {
  uid: 'guest-visitor',
  name: 'Visitor',
  email: '',
  role: 'visitor',
  membershipApproved: false,
  createdAt: '',
  updatedAt: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultAnonymousUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);

  const refreshDepartments = async () => {
    try {
      const data = await fetchDepartments();
      if (Array.isArray(data) && data.length > 0) {
        const merged: Department[] = data.map((d: any) => {
          const fallback = DEFAULT_DEPARTMENTS.find(
            (def) => def.id.toLowerCase() === d.id.toLowerCase()
          );
          return {
            id: d.id,
            code: d.code || fallback?.code || d.id.toUpperCase(),
            name: d.name || fallback?.name || d.id,
            shortName: d.short_name || d.shortName || fallback?.shortName || d.code || d.id.toUpperCase(),
            icon: d.icon || fallback?.icon || 'Building2',
            description: d.description || fallback?.description || '',
            hodName: d.hod_name || d.hodName || fallback?.hodName || '',
            hodEmail: d.hod_email || d.hodEmail || fallback?.hodEmail || '',
            labsCount: typeof d.labs_count === 'number' ? d.labs_count : (d.labsCount || fallback?.labsCount || 0),
          };
        });

        DEFAULT_DEPARTMENTS.forEach((def) => {
          if (!merged.some((m) => m.id.toLowerCase() === def.id.toLowerCase())) {
            merged.push(def);
          }
        });

        setDepartments(merged);
        kitsCollegeConfig.departments = merged;
      }
    } catch (err) {
      console.warn('Failed to load departments from API, using defaults:', err);
      kitsCollegeConfig.departments = DEFAULT_DEPARTMENTS;
    }
  };

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
          departmentId: me.departmentId || '',
          departmentName: me.departmentName || '',
          rollNumber: me.studentRollNumber,
          studentRollNumber: me.studentRollNumber,
          section: me.section || '',
          yearSemester: me.yearSemester || '',
          mobile: me.mobile || '',
          fatherName: me.fatherName || '',
          fatherMobile: me.fatherMobile || '',
          parentEmail: me.parentEmail || '',
          presentAddress: me.presentAddress || '',
          dob: me.dob || '',
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
    kitsCollegeConfig.departments = DEFAULT_DEPARTMENTS;
    loadUserSession();
    refreshDepartments();
  }, []);

  // 2. Load and refresh projects from backend SQL repository (unlimited queries)
  const refreshProjects = async () => {
    try {
      const data = await apiFetchProjects({ unlimited: true });
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
            departmentId: p.department_id || p.departmentId || '',
            departmentName: p.department_name || p.departmentName || '',
            departmentCode: p.department_code || p.departmentCode || (p.department_id ? p.department_id.toUpperCase() : 'CSE'),
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
              name: p.faculty_mentor_name || '',
              designation: p.faculty_mentor_role || '',
              department: p.department_id || '',
            },
            faculty_mentor_name: p.faculty_mentor_name || undefined,
            faculty_mentor_role: p.faculty_mentor_role || undefined,
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
            viewsCount: typeof p.views_count === 'number' ? p.views_count : (p.viewsCount || 0),
            views_count: typeof p.views_count === 'number' ? p.views_count : (p.viewsCount || 0),
            sharesCount: typeof p.shares_count === 'number' ? p.shares_count : (p.sharesCount || 0),
            shares_count: typeof p.shares_count === 'number' ? p.shares_count : (p.sharesCount || 0),
            likesCount: p.likes_count || 0,
            averageRating: p.averageRating || 0,
            totalRatings: p.totalRatings || 0,
          };
        });
        setProjects(mapped);
      }
    } catch (err) {
      console.warn('Backend projects load notice:', err);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  // ─── Student Wishlist State & Methods ───
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [pendingWishlistId, setPendingWishlistIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('kits_pending_wishlist_id');
    } catch {
      return null;
    }
  });

  const setPendingWishlistId = (id: string | null) => {
    setPendingWishlistIdState(id);
    try {
      if (id) {
        sessionStorage.setItem('kits_pending_wishlist_id', id);
      } else {
        sessionStorage.removeItem('kits_pending_wishlist_id');
      }
    } catch {}
  };

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistIds([]);
      return;
    }
    try {
      const res = await fetchWishlistIds();
      if (res?.projectIds) {
        setWishlistIds(res.projectIds);
      }
    } catch (e) {
      console.warn('Failed to refresh wishlist IDs:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
      // Handle pending save on login
      if (pendingWishlistId) {
        const targetId = pendingWishlistId;
        setPendingWishlistId(null);
        apiAddToWishlist(targetId)
          .then(() => {
            refreshWishlist();
          })
          .catch((err) => console.warn('Failed to complete pending wishlist save:', err));
      }
    } else {
      setWishlistIds([]);
    }
  }, [isAuthenticated]);

  const isProjectSaved = (projectId: string) => {
    return wishlistIds.includes(projectId);
  };

  const saveToWishlist = async (projectId: string) => {
    if (!isAuthenticated) {
      setPendingWishlistId(projectId);
      return { success: false, message: 'Please sign in to save this project.' };
    }
    try {
      const res = await apiAddToWishlist(projectId);
      setWishlistIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]));
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const removeWishlist = async (projectId: string) => {
    if (!isAuthenticated) return { success: false };
    try {
      const res = await apiRemoveFromWishlist(projectId);
      setWishlistIds((prev) => prev.filter((id) => id !== projectId));
      return res;
    } catch (err: any) {
      throw err;
    }
  };

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

  // Sign out
  const signOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    setCurrentUser(defaultAnonymousUser);
    setIsAuthenticated(false);
    setWishlistIds([]);
  };

  // Refresh current user from backend
  const refreshCurrentUser = async () => {
    await loadUserSession();
  };

  // Self Profile Update (persisted to database)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const res = await apiUpdateUserProfile({
        fullName: updates.fullName || updates.name,
        yearSemester: updates.yearSemester,
        section: updates.section,
        mobile: updates.mobile,
        fatherName: updates.fatherName,
        fatherMobile: updates.fatherMobile,
        parentEmail: updates.parentEmail,
        presentAddress: updates.presentAddress,
        dob: updates.dob,
      });
      if (res?.user) {
        setCurrentUser((prev) => ({
          ...prev,
          ...updates,
          yearSemester: res.user.yearSemester ?? updates.yearSemester ?? prev.yearSemester,
          section: res.user.section ?? updates.section ?? prev.section,
        }));
      } else {
        setCurrentUser((prev) => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.warn('Profile update API error, applying local state update:', err);
      setCurrentUser((prev) => ({ ...prev, ...updates }));
      throw err;
    }
  };

  // Project view counter with backend synchronization (Strict 1 count per student)
  const recordView = async (projectId: string): Promise<number | undefined> => {
    try {
      const res = await recordProjectView(projectId);
      if (res && typeof res.views_count === 'number') {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, viewsCount: res.views_count, views_count: res.views_count }
              : p
          )
        );
        return res.views_count;
      }
    } catch (err) {
      console.warn('View record notice:', err);
    }
  };

  // Project share counter with backend synchronization (Strict 1 count per student)
  const recordShare = async (projectId: string, shareType: string = 'share'): Promise<number | undefined> => {
    try {
      const res = await recordProjectShare(projectId, shareType);
      if (res && typeof res.shares_count === 'number') {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, sharesCount: res.shares_count, shares_count: res.shares_count }
              : p
          )
        );
        return res.shares_count;
      }
    } catch (err) {
      console.warn('Share record notice:', err);
    }
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects.find((p) => p.id === id);
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
      signOut,
      updateProfile,
      refreshCurrentUser,

      // Projects & Data Store
      projects,
      refreshProjects,
      recordView,
      recordShare,
      getProjectById,

      // Wishlist System
      wishlistIds,
      isProjectSaved,
      saveToWishlist,
      removeWishlist,
      refreshWishlist,
      pendingWishlistId,
      setPendingWishlistId,

      // Departments
      departments,
      refreshDepartments,
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
      projects,
      departments,
      wishlistIds,
      pendingWishlistId,
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
    signOut: context.signOut,
    updateProfile: context.updateProfile,
    refreshCurrentUser: context.refreshCurrentUser,
  };
};
