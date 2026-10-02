const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensures opaque HttpOnly kits_session cookie is sent
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const err: any = new Error(errBody.error || `Request failed with status ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as T;
  } catch (error: any) {
    if (!(endpoint === '/auth/me' && error?.status === 401)) {
      console.warn(`[SQL API] ${options.method || 'GET'} ${endpoint} failed:`, error.message);
    }
    throw error;
  }
}

// ─── Direct Institutional Authentication API ────────────────────────────────

export interface AuthMeResponse {
  uid: string;
  id: string;
  email: string;
  fullName: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  studentRollNumber?: string;
  section?: string;
  yearSemester?: string;
  mobile?: string;
  fatherName?: string;
  fatherMobile?: string;
  parentEmail?: string;
  presentAddress?: string;
  dob?: string;
  isVerified: boolean;
  photoUrl?: string;
  photoURL?: string;
  group?: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch current authenticated user session via HttpOnly cookie
 */
export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return request<AuthMeResponse>('/auth/me');
}

/**
 * Sign in with Email and Password
 */
export async function loginUser(email: string, password: string): Promise<{ message: string; user: AuthMeResponse }> {
  return request<{ message: string; user: AuthMeResponse }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Register a new Student Account
 */
export async function registerUser(params: {
  email: string;
  fullName: string;
  branch: string;
  rollNumber: string;
  password: string;
}): Promise<{ message: string; user: AuthMeResponse }> {
  return request<{ message: string; user: AuthMeResponse }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Setup password for existing accounts
 */
export async function setupUserPassword(identifier: string, newPassword: string): Promise<{ message: string; user: AuthMeResponse }> {
  return request<{ message: string; user: AuthMeResponse }>('/auth/setup-password', {
    method: 'POST',
    body: JSON.stringify({ identifier, newPassword }),
  });
}

/**
 * Fast 1-Click login for presets (leader, member1, member2, member3, faculty, admin)
 */
export async function quickLogin(preset: string): Promise<{ message: string; user: AuthMeResponse }> {
  return request<{ message: string; user: AuthMeResponse }>('/auth/quick-login', {
    method: 'POST',
    body: JSON.stringify({ preset }),
  });
}

/**
 * Terminates the application session on backend and clears HttpOnly session cookie
 */
export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Verify and link official college student roll number
 */
export async function verifyStudentRollNumber(studentRollNumber: string, departmentId?: string) {
  return request<{ message: string; user: any }>('/auth/verify-roll', {
    method: 'POST',
    body: JSON.stringify({ studentRollNumber, departmentId }),
  });
}

// ─── Projects Repository API ──────────────────────────────────────────────────

export interface ProjectSearchParams {
  search?: string;
  department?: string;
  year?: string;
  academicYear?: string;
  technology?: string;
  difficulty?: string;
  projectType?: string;
  submissionType?: string;
  language?: string;
  equipment?: string;
  freeTools?: boolean;
  groupId?: string;
  ownerUserId?: string;
  page?: number;
  limit?: number;
}

export async function fetchProjects(params?: ProjectSearchParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.department && params.department !== 'all') query.set('department', params.department);
  if (params?.year && params.year !== 'all') query.set('year', params.year);
  if (params?.academicYear && params.academicYear !== 'all') query.set('academicYear', params.academicYear);
  if (params?.technology && params.technology !== 'all') query.set('technology', params.technology);
  if (params?.difficulty && params.difficulty !== 'all') query.set('difficulty', params.difficulty);
  if (params?.projectType && params.projectType !== 'all') query.set('projectType', params.projectType);
  if (params?.submissionType && params.submissionType !== 'all') query.set('submissionType', params.submissionType);
  if (params?.groupId) query.set('groupId', params.groupId);
  if (params?.ownerUserId) query.set('ownerUserId', params.ownerUserId);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const qs = query.toString();
  return request<{ projects: any[]; pagination: any }>(`/projects${qs ? `?${qs}` : ''}`);
}

export async function fetchMyProjects(userId?: string, rollNumber?: string) {
  const query = new URLSearchParams();
  if (userId) query.set('userId', userId);
  if (rollNumber) query.set('rollNumber', rollNumber);
  const qs = query.toString();
  return request<{
    projects: any[];
    counts: { all: number; individual: number; group: number };
  }>(`/projects/my-projects${qs ? `?${qs}` : ''}`);
}

export async function fetchProjectDetails(id: string) {
  return request<any>(`/projects/${id}`);
}

export async function fetchProjectByGroupId(groupId: string) {
  return request<any>(`/projects/by-group/${encodeURIComponent(groupId)}`);
}

export async function fetchDepartments() {
  return request<any[]>(`/projects/departments`);
}

export async function fetchTechnologies() {
  return request<string[]>(`/projects/technologies`);
}

export async function fetchBatches() {
  return request<string[]>(`/projects/batches`);
}

export async function submitOfficialProject(data: any) {
  return request<{ message: string; projectId: string; project?: any }>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOfficialProject(id: string, data: any) {
  return request<{ message: string; projectId: string; project: any }>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadProjectDocument(fileName: string, fileData: string) {
  return request<{ url: string; fileName: string }>('/projects/upload-doc', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileData }),
  });
}

// ─── Official Groups API (4-6 Confirmed Students) ─────────────────────────────

export interface GroupMemberData {
  fullName: string;
  studentRollNumber: string;
  role?: string;
}

export async function fetchMyGroup(userId: string, rollNumber?: string) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (rollNumber) params.set('rollNumber', rollNumber);
  return request<any>(`/groups/my-group?${params.toString()}`);
}

export async function createOfficialGroup(data: {
  leaderId: string;
  name: string;
  departmentId: string;
  academicYear?: string;
  members?: GroupMemberData[];
}) {
  return request<any>('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function inviteGroupMember(groupId: string, leaderId: string, studentRollNumber: string) {
  return request<any>(`/groups/${groupId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ leaderId, studentRollNumber }),
  });
}

export async function acceptGroupInvitation(groupId: string, userId: string) {
  return request<any>(`/groups/${groupId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function declineGroupInvitation(groupId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/groups/${groupId}/decline`, {
    method: 'POST',
  });
}

export async function fetchPendingInvites(): Promise<{ invites: any[] }> {
  return request<{ invites: any[] }>('/groups/pending-invites');
}

// ─── Ratings API ───────────────────────────────────────────────────────────────

export interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  myRating: number | null;
}

export async function fetchRatings(projectId: string): Promise<RatingSummary> {
  return request<RatingSummary>(`/projects/${encodeURIComponent(projectId)}/ratings`);
}

export async function submitRating(projectId: string, score: number): Promise<RatingSummary> {
  return request<RatingSummary>(`/projects/${encodeURIComponent(projectId)}/ratings`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export async function deleteRating(projectId: string): Promise<RatingSummary> {
  return request<RatingSummary>(`/projects/${encodeURIComponent(projectId)}/ratings`, {
    method: 'DELETE',
  });
}

// ─── Comments API ──────────────────────────────────────────────────────────────

export interface ProjectComment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface CommentsPagination {
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export async function fetchComments(
  projectId: string,
  page = 1
): Promise<{ comments: ProjectComment[]; pagination: CommentsPagination }> {
  return request<{ comments: ProjectComment[]; pagination: CommentsPagination }>(
    `/projects/${encodeURIComponent(projectId)}/comments?page=${page}`
  );
}

export async function postComment(
  projectId: string,
  text: string
): Promise<{ message: string; comment: ProjectComment }> {
  return request<{ message: string; comment: ProjectComment }>(
    `/projects/${encodeURIComponent(projectId)}/comments`,
    { method: 'POST', body: JSON.stringify({ text }) }
  );
}

export async function editComment(
  projectId: string,
  commentId: string,
  text: string
): Promise<{ message: string; comment: ProjectComment }> {
  return request<{ message: string; comment: ProjectComment }>(
    `/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'PUT', body: JSON.stringify({ text }) }
  );
}

export async function deleteComment(
  projectId: string,
  commentId: string
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' }
  );
}

// ─── Views & Shares Tracking API ──────────────────────────────────────────────

export async function recordProjectView(
  projectId: string
): Promise<{ success: boolean; counted: boolean; views_count: number }> {
  return request<{ success: boolean; counted: boolean; views_count: number }>(
    `/projects/${encodeURIComponent(projectId)}/view`,
    { method: 'POST' }
  );
}

export async function recordProjectShare(
  projectId: string,
  shareType: string = 'share'
): Promise<{ success: boolean; counted: boolean; shares_count: number }> {
  return request<{ success: boolean; counted: boolean; shares_count: number }>(
    `/projects/${encodeURIComponent(projectId)}/share`,
    { method: 'POST', body: JSON.stringify({ shareType }) }
  );
}

// ─── Wishlist API ─────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  wishlistId: string;
  projectId: string;
  savedAt: string;
  isUnavailable?: boolean;
  [key: string]: any;
}

export async function fetchMyWishlist(): Promise<{ success: boolean; count: number; items: any[] }> {
  return request<{ success: boolean; count: number; items: any[] }>('/wishlist');
}

export async function fetchWishlistIds(): Promise<{ success: boolean; projectIds: string[] }> {
  return request<{ success: boolean; projectIds: string[] }>('/wishlist/ids');
}

export async function addToWishlist(
  projectId: string
): Promise<{ success: boolean; alreadySaved: boolean; message: string }> {
  return request<{ success: boolean; alreadySaved: boolean; message: string }>(
    `/wishlist/${encodeURIComponent(projectId)}`,
    { method: 'POST' }
  );
}

export async function removeFromWishlist(
  projectId: string
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/wishlist/${encodeURIComponent(projectId)}`,
    { method: 'DELETE' }
  );
}

