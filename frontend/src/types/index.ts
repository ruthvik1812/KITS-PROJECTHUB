export type ProjectStatus = 'approved' | 'pending' | 'needs_revision' | 'rejected' | 'draft';

export type ProjectType =
  | 'Major Capstone Project'
  | 'Mini Project'
  | 'RTRP (RealTime Research Project)'
  | 'Hackathon Project'
  | 'Research & Innovation'
  | 'Industry Collaborative'
  | 'Interdisciplinary';

// Public team member details (omits sensitive rollNumber/email)
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  contribution: string;
  avatar?: string;
  rollNumber?: string; // Optional in public presentation; stored securely in ProjectPrivate
  email?: string;
}

export interface Mentor {
  name: string;
  designation: string;
  department: string;
  email?: string;
}

export interface ProjectLinks {
  website?: string;
  repository?: string;
  video?: string;
  documentation?: string;
  presentation?: string;
}

export interface ReviewRubric {
  technicalDepth: number; // 1-10
  innovation: number; // 1-10
  methodology: number; // 1-10
  documentation: number; // 1-10
}

export interface ReviewFeedback {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerDepartment: string;
  decision: 'approved' | 'needs_revision' | 'rejected';
  comments: string;
  rubric?: ReviewRubric;
  reviewedAt: string;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'schematic' | 'dataset' | 'guide' | 'code' | 'paper' | 'tool';
  url?: string;
  description: string;
  sizeOrFormat?: string;
  downloadable?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  stage: string; // e.g. "Phase 1: Foundations"
  durationEst: string;
  description: string;
  deliverables: string[];
  steps: string[];
  hardwareEvidencePrompt?: string;
  codeSnippet?: {
    language: string;
    code: string;
    caption: string;
  };
}

export interface RubricCriterion {
  title: string;
  maxScore: number;
  description: string;
  benchmarks: {
    poor: string;
    acceptable: string;
    exemplary: string;
  };
}

export interface DetailedRubric {
  technicalDepth: RubricCriterion;
  methodology: RubricCriterion;
  innovation: RubricCriterion;
  replicationFidelity: RubricCriterion;
  documentation: RubricCriterion;
}

export interface HardwareEvidence {
  type: 'CAD / Schematic' | 'PCB Layout' | 'Firmware Hex / Logic Trace' | 'Bench Test Results' | 'Bill of Materials';
  title: string;
  description: string;
  specifications: string[];
  externalViewerUrl?: string;
  fileFormat?: string;
}

export interface LearnerPracticeRecord {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole?: string;
  enrolledAt: string;
  completedMilestoneIds: string[];
  notes?: string;
  repoUrl?: string;
  status: 'in-progress' | 'completed';
  lastUpdated: string;
}

export interface ProjectDiscussionPost {
  id: string;
  projectId: string;
  authorUid: string;
  authorName: string;
  authorRole: 'student' | 'faculty' | 'learner' | 'alumni' | 'guest';
  avatar?: string;
  content: string;
  timestamp: string;
  isOriginalAuthor?: boolean;
  isMentor?: boolean;
  upvotes: number;
  hasUpvoted?: boolean;
  replyToId?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  subject: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  estimatedWeeks: number;
  departmentId: string;
  departmentName: string;
  recommendedPrerequisites: string[]; // strictly recommended, non-blocking
  diagnosticQuiz: {
    id: string;
    question: string;
    options: {
      text: string;
      level: 'ready' | 'review_recommended' | 'beginner_guidance';
      feedback: string;
    }[];
  }[];
  stages: {
    stageNumber: number;
    title: string;
    description: string;
    projectIds: string[];
    skillsAcquired: string[];
  }[];
  careerRoles: string[];
}

// Public Project entity in /projects/{projectId}
export interface Project {
  id: string;
  submissionType?: 'individual' | 'group';
  submission_type?: 'individual' | 'group';
  ownerUserId?: string;
  owner_user_id?: string;
  official_group_id?: string;
  group?: any;
  title: string;
  summary: string;
  description: string;
  problemStatement?: string;
  problem_statement?: string;
  solution?: string;
  features?: string[];
  methodology?: string;
  departmentId: string;
  departmentName: string;
  departmentCode?: string;
  department_code?: string;
  department_id?: string;
  graduationYear: number;
  academicYear: string;
  academic_year?: string;
  projectType: ProjectType | string;
  project_type?: string;
  technologies: string[];
  tools?: string[];
  teamMembers: TeamMember[];
  original_authors?: any[];
  mentor: Mentor;
  faculty_mentor_name?: string;
  faculty_mentor_role?: string;
  thumbnail: string;
  images?: string[];
  screenshots?: string[];
  links: ProjectLinks;
  live_demo_url?: string;
  repo_url?: string;
  documentation_url?: string;
  video_url?: string;
  presentation_url?: string;
  presentationUrl?: string;
  status: ProjectStatus;
  ownerUid?: string;
  submittedByName?: string;
  submittedBy?: {
    uid: string;
    name: string;
    email?: string;
    rollNumber?: string;
  };
  submittedAt: string;
  updatedAt: string;
  reviews?: ReviewFeedback[];
  featured?: boolean;
  viewsCount: number;
  views_count?: number;
  sharesCount?: number;
  shares_count?: number;
  likesCount: number;
  isLiked?: boolean;

  // Project-based Learning additions
  subject?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  skills?: string[];
  duration?: string;
  equipment?: string[];
  language?: string;
  licence?: string;
  contentOwner?: string;
  version?: string;
  outcomes?: string[];
  resources?: LearningResource[];
  milestones?: Milestone[];
  rubricCriteria?: DetailedRubric;
  hardwareEvidence?: HardwareEvidence;
  isFictionalDemo?: boolean;
  discussionPosts?: ProjectDiscussionPost[];
}

// Protected Project Data in /projectPrivate/{projectId}
export interface ProjectPrivateData {
  projectId: string;
  ownerUid: string;
  departmentId: string;
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
  internalRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  shortName: string;
  icon?: string;
  description: string;
  hodName?: string;
  hodEmail?: string;
  labsCount?: number;
}

export type UserRole = 'student' | 'faculty' | 'admin' | 'visitor';

export interface UserProfile {
  uid: string;
  firebaseUid?: string;
  name: string;
  fullName?: string;
  email: string;
  photoURL?: string;
  photoUrl?: string;
  role: UserRole;
  membershipApproved: boolean; // College verification status required for submission
  departmentId?: string;
  departmentName?: string;
  rollNumber?: string;
  studentRollNumber?: string;
  section?: string;
  yearSemester?: string;
  mobile?: string;
  fatherName?: string;
  fatherMobile?: string;
  parentEmail?: string;
  presentAddress?: string;
  dob?: string;
  isVerified?: boolean;
  group?: any;
  designation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEvent {
  id: string;
  projectId: string;
  reviewerUid: string;
  reviewerName: string;
  reviewerDepartment: string;
  decision: 'approved' | 'needs_revision' | 'rejected';
  comments: string;
  rubric?: ReviewRubric;
  timestamp: string;
}

export interface ProjectFilters {
  searchQuery: string;
  department: string;
  graduationYear: string;
  technology: string;
  projectType: string;
  subject?: string;
  difficulty?: string;
  skill?: string;
  sortBy: 'newest' | 'oldest' | 'popular' | 'title';
  status?: string;
}
