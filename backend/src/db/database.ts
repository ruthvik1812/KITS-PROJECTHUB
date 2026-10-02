// In-memory mock database complying with AI Studio Node.js environment
// Stripped native better-sqlite3 as per migration instructions (no native compiler)

export interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  short_name: string;
  description: string;
  hod_name: string;
  hod_email: string;
  labs_count: number;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash?: string | null;
  full_name: string;
  role: 'student' | 'faculty' | 'reviewer' | 'admin';
  department_id: string | null;
  student_roll_number: string | null;
  is_verified: number;
  photo_url?: string | null;
  section?: string | null;
  year_semester?: string | null;
  mobile?: string | null;
  father_name?: string | null;
  father_mobile?: string | null;
  parent_email?: string | null;
  present_address?: string | null;
  dob?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  submission_type: string;
  owner_user_id?: string | null;
  official_group_id?: string | null;
  title: string;
  summary: string;
  problem_statement?: string | null;
  subject: string;
  project_type: string;
  difficulty: string;
  duration: string;
  language: string;
  equipment: string;
  free_tools_route: string;
  live_demo_url?: string | null;
  repo_url?: string | null;
  documentation_url?: string | null;
  video_url?: string | null;
  presentation_url?: string | null;
  screenshots?: string | null;
  faculty_mentor_name?: string | null;
  faculty_mentor_role?: string | null;
  hardware_evidence?: string | null;
  outcomes: string;
  prerequisites?: string | null;
  tools: string;
  original_authors: string;
  department_id: string;
  academic_year: string;
  licence: string;
  content_owner: string;
  status: string;
  version: string;
  views_count: number;
  shares_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupRow {
  id: string;
  name: string;
  leader_id: string;
  department_id: string;
  academic_year: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  student_roll_number: string;
  invite_status: string;
  joined_at?: string | null;
  created_at: string;
}

export interface RatingRow {
  id: string;
  project_id: string;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  is_edited: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistRow {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface ViewRow {
  id: string;
  project_id: string;
  viewer_key: string;
  viewed_at: string;
}

export interface ShareRow {
  id: string;
  project_id: string;
  sharer_key: string;
  share_type: string;
  shared_at: string;
}

// In-memory data store
export const store = {
  departments: [] as DepartmentRow[],
  users: [] as UserRow[],
  projects: [] as ProjectRow[],
  official_groups: [] as GroupRow[],
  official_group_members: [] as GroupMemberRow[],
  project_ratings: [] as RatingRow[],
  project_comments: [] as CommentRow[],
  wishlists: [] as WishlistRow[],
  project_views: [] as ViewRow[],
  project_shares: [] as ShareRow[],
};

// Seed initial records
export function seedInitialData() {
  if (store.departments.length === 0) {
    store.departments = [
      { id: 'aiml', code: 'CSM', name: 'Artificial Intelligence and Machine Learning', short_name: 'AI & ML', description: 'Deep learning, neural vision, and intelligent cyber-physical systems.', hod_name: 'Dr. S. Ramesh Kumar', hod_email: 's.ramesh@kitsts.ac.in', labs_count: 5 },
      { id: 'cse', code: 'CSE', name: 'Computer Science and Engineering', short_name: 'CSE', description: 'Core computing, distributed algorithms, systems engineering and cloud systems.', hod_name: 'Dr. P. Niranjan', hod_email: 'p.niranjan@kitsts.ac.in', labs_count: 7 },
      { id: 'ece', code: 'ECE', name: 'Electronics and Communication Engineering', short_name: 'ECE', description: 'Embedded IoT, microelectronics, RF systems and DSP lab.', hod_name: 'Dr. B. Rama Devi', hod_email: 'b.ramadevi@kitsts.ac.in', labs_count: 6 },
      { id: 'eee', code: 'EEE', name: 'Electrical and Electronics Engineering', short_name: 'EEE', description: 'Renewable energy microgrids, EV powertrains and high-voltage simulation.', hod_name: 'Dr. C. Venkatesh', hod_email: 'c.venkatesh@kitsts.ac.in', labs_count: 4 },
      { id: 'me', code: 'ME', name: 'Mechanical Engineering', short_name: 'ME', description: 'Robotics chassis, additive manufacturing, thermofluids and CAD/CAM.', hod_name: 'Dr. K. Sridhar', hod_email: 'k.sridhar@kitsts.ac.in', labs_count: 6 },
      { id: 'it', code: 'IT', name: 'Information Technology', short_name: 'IT', description: 'Cybersecurity, fullstack engineering, database systems and mobile networks.', hod_name: 'Dr. T. Senthil Murugan', hod_email: 't.senthil@kitsts.ac.in', labs_count: 4 }
    ];
  }

  if (store.users.length === 0) {
    const now = new Date().toISOString();
    store.users = [
      { id: 'usr-student-01', email: 'student.demo@kitsts.ac.in', full_name: 'A. Rahul', role: 'student', department_id: 'cse', student_roll_number: '21B91A0501', is_verified: 1, section: 'CSE-A', year_semester: 'IV Year I Semester', mobile: '9876543201', father_name: 'Sample Parent', father_mobile: '9876543200', parent_email: 'parent.sample@example.com', present_address: 'KITS Campus, Singapur, Huzurabad', dob: '2003-01-01', created_at: now, updated_at: now },
      { id: 'usr-student-02', email: 'student2@kitsts.ac.in', full_name: 'Student Member 1', role: 'student', department_id: 'aiml', student_roll_number: '21B91A0502', is_verified: 1, section: 'CSM-A', year_semester: 'IV Year I Semester', mobile: '9876543202', father_name: '', father_mobile: '', parent_email: '', present_address: 'KITS Campus', dob: '2003-05-12', created_at: now, updated_at: now },
      { id: 'usr-student-03', email: 'student3@kitsts.ac.in', full_name: 'Student Member 2', role: 'student', department_id: 'me', student_roll_number: '21B91A0503', is_verified: 1, section: 'ME-A', year_semester: 'IV Year I Semester', mobile: '9876543203', father_name: '', father_mobile: '', parent_email: '', present_address: 'KITS Campus', dob: '2003-08-20', created_at: now, updated_at: now },
      { id: 'usr-student-04', email: 'student4@kitsts.ac.in', full_name: 'Student Member 3', role: 'student', department_id: 'cse', student_roll_number: '21B91A0504', is_verified: 1, section: 'CSE-A', year_semester: 'IV Year I Semester', mobile: '9876543204', father_name: '', father_mobile: '', parent_email: '', present_address: 'KITS Campus', dob: '2003-11-15', created_at: now, updated_at: now },
      { id: 'usr-faculty-01', email: 's.ramesh@kitsts.ac.in', full_name: 'Dr. S. Ramesh Kumar', role: 'reviewer', department_id: 'aiml', student_roll_number: null, is_verified: 1, section: 'Faculty', year_semester: 'Professor', mobile: '9876543213', father_name: '', father_mobile: '', parent_email: '', present_address: 'KITS Campus', dob: '1980-01-01', created_at: now, updated_at: now },
      { id: 'usr-admin-01', email: 'admin.portal@kitsts.ac.in', full_name: 'KITS Academic Dean (Admin)', role: 'admin', department_id: 'cse', student_roll_number: null, is_verified: 1, section: 'Admin', year_semester: 'Dean', mobile: '9876543214', father_name: '', father_mobile: '', parent_email: '', present_address: 'KITS Campus', dob: '1975-01-01', created_at: now, updated_at: now }
    ];
  }

  if (store.official_groups.length === 0) {
    const now = new Date().toISOString();
    store.official_groups = [
      { id: 'grp-kits-001', name: 'Smart Campus IoT Innovations Team', leader_id: 'usr-student-01', department_id: 'cse', academic_year: '2026-2027', status: 'confirmed', created_at: now, updated_at: now }
    ];

    store.official_group_members = [
      { id: 'mem-1', group_id: 'grp-kits-001', user_id: 'usr-student-01', student_roll_number: '21B91A0501', invite_status: 'accepted', joined_at: now, created_at: now },
      { id: 'mem-2', group_id: 'grp-kits-001', user_id: 'usr-student-02', student_roll_number: '21B91A0502', invite_status: 'accepted', joined_at: now, created_at: now },
      { id: 'mem-3', group_id: 'grp-kits-001', user_id: 'usr-student-03', student_roll_number: '21B91A0503', invite_status: 'accepted', joined_at: now, created_at: now },
      { id: 'mem-4', group_id: 'grp-kits-001', user_id: 'usr-student-04', student_roll_number: '21B91A0504', invite_status: 'accepted', joined_at: now, created_at: now }
    ];
  }

  if (store.projects.length === 0) {
    const now = new Date().toISOString();
    store.projects = [
      {
        id: 'proj-kits-001',
        submission_type: 'group',
        owner_user_id: 'usr-student-01',
        official_group_id: 'grp-kits-001',
        title: 'Smart Grid IoT Microgrid Energy Optimizer',
        summary: 'An intelligent energy management microgrid system designed for campus power distribution, using edge machine learning to dynamically balance solar inverter loads with real-time grid telemetry.',
        problem_statement: 'Engineering campuses face escalating peak-demand electricity tariffs and inefficient renewable solar utilization due to lack of automated phase load balancing across departmental blocks.',
        subject: 'IoT & Smart Grid Systems',
        project_type: 'Major Capstone Project',
        difficulty: 'Advanced',
        duration: '6 Months',
        language: 'English',
        equipment: 'ESP32 Microcontrollers, Current Transformers (CT sensors), Relay Bank, Web Browser',
        free_tools_route: 'Fully achievable with ESPHome, Mosquitto MQTT, Node.js and open-source dashboards',
        live_demo_url: 'https://smartgrid-kits.web.app',
        repo_url: 'https://github.com/kits-college/smart-grid-microgrid',
        documentation_url: 'https://github.com/kits-college/smart-grid-microgrid/blob/main/docs/Report.pdf',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        presentation_url: 'https://slides.google.com/presentation/d/sample-smartgrid',
        screenshots: JSON.stringify(['/kits-hero-bg.jpg']),
        faculty_mentor_name: 'Dr. M. Ravindra Babu',
        faculty_mentor_role: 'Professor & HOD · CSE',
        hardware_evidence: JSON.stringify({ isHardware: true, details: 'ESP32 Wi-Fi Node with SCT-013 CT sensors connected to 3-phase AC distribution board.' }),
        outcomes: JSON.stringify(['28% reduction in peak-hour campus grid consumption', 'Sub-second anomaly alert notification via MQTT', 'Automated phase switching for solar inverter feeds']),
        prerequisites: JSON.stringify(['Basics of Microcontrollers (ESP32 / Arduino)', 'Basic Networking & MQTT Protocol', 'Python or TypeScript for dashboard']),
        tools: JSON.stringify(['IoT', 'Python', 'React', 'Embedded C', 'MQTT', 'TensorFlow Lite']),
        original_authors: JSON.stringify([
          { name: 'A. Rahul', role: 'Team Leader & ML Lead', department: 'CSE', rollNumber: '21B91A0501', contribution: 'Designed edge ML model and MQTT broker architecture' },
          { name: 'Student Member 1', role: 'Full Stack Dev', department: 'AI & ML', rollNumber: '21B91A0502', contribution: 'Developed React telemetry charts and REST endpoints' },
          { name: 'Student Member 2', role: 'Firmware Dev', department: 'ME', rollNumber: '21B91A0503', contribution: 'Engineered sensor chassis & relay enclosures' },
          { name: 'Student Member 3', role: 'IoT Systems', department: 'CSE', rollNumber: '21B91A0504', contribution: 'Implemented ESP32 current monitoring circuits' }
        ]),
        department_id: 'cse',
        academic_year: '2026-2027',
        licence: 'MIT Open Source License',
        content_owner: 'A. Rahul',
        status: 'approved',
        version: '1.0.0',
        views_count: 142,
        shares_count: 36,
        likes_count: 28,
        created_at: now,
        updated_at: now
      },
      {
        id: 'proj-kits-002',
        submission_type: 'group',
        owner_user_id: 'usr-student-02',
        official_group_id: null,
        title: 'Autonomous Agricultural Weed Detection and Precision Spraying Drone',
        summary: 'A deep-learning powered autonomous quadcopter platform utilizing fine-tuned YOLOv8 neural vision for real-time crop disease classification and precision weed mitigation.',
        problem_statement: 'Indiscriminate herbicide application in farming causes excessive chemical runoff, high financial overhead for farmers, and environmental degradation.',
        subject: 'Deep Learning & Robotics',
        project_type: 'Major Capstone Project',
        difficulty: 'Advanced',
        duration: '5 Months',
        language: 'English',
        equipment: 'Quadcopter Frame, Raspberry Pi 4, Pixhawk 4 Autopilot, Downward Camera',
        free_tools_route: 'Dataset annotated with Roboflow, model trained on Google Colab free tier, ROS2 simulation in Gazebo',
        live_demo_url: 'https://agridrone-kits.web.app',
        repo_url: 'https://github.com/kits-college/agri-drone-vision',
        documentation_url: 'https://github.com/kits-college/agri-drone-vision/blob/main/docs/Thesis.pdf',
        video_url: 'https://www.youtube.com/watch?v=sample-video-drone',
        presentation_url: 'https://slides.google.com/presentation/d/sample-agridrone',
        screenshots: JSON.stringify(['/kits-hero-bg.jpg']),
        faculty_mentor_name: 'Dr. S. Ramesh Kumar',
        faculty_mentor_role: 'Professor & HOD · AI&ML',
        hardware_evidence: JSON.stringify({ isHardware: true, details: 'Pixhawk 4 flight controller connected to Raspberry Pi 4 via MAVLink.' }),
        outcomes: JSON.stringify(['94.2% mean average precision in weed detection across varying lighting', '65% reduction in herbicide volume applied per acre', 'Autonomous GPS waypoint navigation with obstacle avoidance']),
        prerequisites: JSON.stringify(['Python programming', 'Convolutional Neural Networks', 'ROS2 Basics']),
        tools: JSON.stringify(['Computer Vision', 'YOLOv8', 'PyTorch', 'ROS2', 'Raspberry Pi', 'OpenCV']),
        original_authors: JSON.stringify([
          { name: 'Student Member 1', role: 'AI Lead', department: 'AI & ML', rollNumber: '21B91A0502', contribution: 'Trained and quantized YOLOv8 crop models' },
          { name: 'A. Rahul', role: 'Flight System Engineer', department: 'CSE', rollNumber: '21B91A0501', contribution: 'Configured MAVLink telemetry and ROS2 node' }
        ]),
        department_id: 'aiml',
        academic_year: '2026-2027',
        licence: 'MIT Open Source License',
        content_owner: 'Student Member 1',
        status: 'approved',
        version: '1.0.0',
        views_count: 218,
        shares_count: 54,
        likes_count: 42,
        created_at: now,
        updated_at: now
      },
      {
        id: 'proj-kits-003',
        submission_type: 'individual',
        owner_user_id: 'usr-student-01',
        official_group_id: null,
        title: 'Ultra-Low Power LoRaWAN Environmental Telemetry Node',
        summary: 'Solar-harvesting decentralized sensor telemetry node measuring AQI, ambient particulate matter, humidity, and soil moisture over a 15km line-of-sight radius.',
        problem_statement: 'Rural agro-climatic stations lack cellular connectivity and power infrastructure, hindering timely crop weather predictions.',
        subject: 'Embedded Systems & Wireless Sensor Networks',
        project_type: 'Individual Project',
        difficulty: 'Intermediate',
        duration: '4 Months',
        language: 'English',
        equipment: 'STM32L0 microcontroller, SX1276 LoRa transceiver, BME280 sensor, 2W Solar Cell',
        free_tools_route: 'Open source KiCAD schematic and The Things Network free community tier',
        live_demo_url: 'https://lorawan-kits.web.app',
        repo_url: 'https://github.com/kits-college/lorawan-weather-telemetry',
        documentation_url: 'https://github.com/kits-college/lorawan-weather-telemetry/blob/main/docs/Report.pdf',
        video_url: '',
        presentation_url: '',
        screenshots: JSON.stringify(['/kits-hero-bg.jpg']),
        faculty_mentor_name: null,
        faculty_mentor_role: null,
        hardware_evidence: JSON.stringify({ isHardware: true, details: 'Custom 2-layer PCB fabricated with sleep mode power consumption under 15 microamps.' }),
        outcomes: JSON.stringify(['Over 18 months continuous battery operation without external power', 'Reliable 14.8km packet transmission to campus gateway', 'Instant real-time telemetry streaming to open database']),
        prerequisites: JSON.stringify(['C Programming', 'KiCad PCB Schematic Design', 'SPI/I2C communication protocols']),
        tools: JSON.stringify(['LoRaWAN', 'STM32', 'Embedded C', 'KiCAD', 'PCB Design']),
        original_authors: JSON.stringify([
          { name: 'A. Rahul', role: 'Individual Researcher', department: 'CSE', rollNumber: '21B91A0501', contribution: 'Designed firmware, power profiling, and LoRa gateway integration' }
        ]),
        department_id: 'ece',
        academic_year: '2026-2027',
        licence: 'MIT Open Source License',
        content_owner: 'A. Rahul',
        status: 'approved',
        version: '1.0.0',
        views_count: 95,
        shares_count: 18,
        likes_count: 15,
        created_at: now,
        updated_at: now
      }
    ];
  }
}

// In-Memory SQLite Mock implementation matching better-sqlite3 API
export const db: any = {
  pragma: () => [],
  exec: () => ({}),
  transaction: (fn: any) => (...args: any[]) => fn(...args),
  prepare: (sql: string) => {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    return {
      get: (...params: any[]) => {
        // Flatten params if passed as single array or object
        const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        // COUNT queries
        if (upper.includes('COUNT(*)')) {
          if (upper.includes('FROM DEPARTMENTS')) return { count: store.departments.length };
          if (upper.includes('FROM USERS')) return { count: store.users.length };
          if (upper.includes('FROM PROJECTS')) return { count: store.projects.length };
          if (upper.includes('FROM PROJECT_RATINGS')) {
            const projId = p[0];
            const ratings = store.project_ratings.filter(r => r.project_id === projId);
            const count = ratings.length;
            const avg = count > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / count : 0;
            return { count, avg };
          }
          if (upper.includes('FROM OFFICIAL_GROUPS')) return { count: store.official_groups.length };
          return { count: 0 };
        }

        // Table check for migrations
        if (upper.includes('SQLITE_MASTER')) {
          return { name: 'users' };
        }

        // Users queries
        if (upper.includes('FROM USERS')) {
          if (upper.includes("ROLE = 'STUDENT'") && (upper.includes('ID !=') || upper.includes('ID <>'))) {
            const excludeId = p[0];
            return store.users.find(u => u.role === 'student' && u.id !== excludeId) || null;
          }
          if (upper.includes('LOWER(EMAIL) = ? OR UPPER(STUDENT_ROLL_NUMBER) = ?')) {
            const email = String(p[0] || '').toLowerCase();
            const roll = String(p[1] || '').toUpperCase();
            return store.users.find(u => (u.email && u.email.toLowerCase() === email) || (u.student_roll_number && u.student_roll_number.toUpperCase() === roll)) || null;
          }
          if (upper.includes('LOWER(EMAIL) = ?')) {
            const email = String(p[0] || '').toLowerCase();
            return store.users.find(u => u.email && u.email.toLowerCase() === email) || null;
          }
          if (upper.includes('UPPER(STUDENT_ROLL_NUMBER) = ?')) {
            const roll = String(p[0] || '').toUpperCase();
            return store.users.find(u => u.student_roll_number && u.student_roll_number.toUpperCase() === roll) || null;
          }
          if (upper.includes('WHERE ID = ?')) {
            const id = p[0];
            return store.users.find(u => u.id === id) || null;
          }
          return store.users[0] || null;
        }

        // Projects queries
        if (upper.includes('FROM PROJECTS')) {
          if (upper.includes('WHERE ID = ?')) {
            const id = p[0];
            return store.projects.find(proj => proj.id === id) || null;
          }
          if (upper.includes('WHERE OFFICIAL_GROUP_ID = ?')) {
            const groupId = p[0];
            return store.projects.find(proj => proj.official_group_id === groupId) || null;
          }
          return store.projects[0] || null;
        }

        // Official groups
        if (upper.includes('FROM OFFICIAL_GROUPS')) {
          if (upper.includes('WHERE ID = ?')) {
            const id = p[0];
            return store.official_groups.find(g => g.id === id) || null;
          }
          return store.official_groups[0] || null;
        }

        // Official group members
        if (upper.includes('FROM OFFICIAL_GROUP_MEMBERS')) {
          if (upper.includes('USER_ID = ?')) {
            const uid = p[0];
            return store.official_group_members.find(m => m.user_id === uid && m.invite_status === 'accepted') || null;
          }
          return store.official_group_members[0] || null;
        }

        // Wishlists
        if (upper.includes('FROM WISHLISTS')) {
          if (upper.includes('USER_ID = ? AND PROJECT_ID = ?')) {
            const uid = p[0];
            const pid = p[1];
            return store.wishlists.find(w => w.user_id === uid && w.project_id === pid) || null;
          }
        }

        // Views / Shares
        if (upper.includes('FROM PROJECT_VIEWS')) {
          const pid = p[0];
          const vkey = p[1];
          return store.project_views.find(v => v.project_id === pid && v.viewer_key === vkey) || null;
        }
        if (upper.includes('FROM PROJECT_SHARES')) {
          const pid = p[0];
          const skey = p[1];
          return store.project_shares.find(s => s.project_id === pid && s.sharer_key === skey) || null;
        }

        return null;
      },

      all: (...params: any[]) => {
        const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        // Table info PRAGMA
        if (upper.includes('PRAGMA TABLE_INFO')) {
          return [
            { name: 'id' }, { name: 'email' }, { name: 'password_hash' }, { name: 'full_name' },
            { name: 'presentation_url' }, { name: 'documentation_url' }, { name: 'section' }
          ];
        }

        // Sqlite tables list
        if (upper.includes('SQLITE_MASTER')) {
          return [
            { name: 'departments' }, { name: 'users' }, { name: 'official_groups' },
            { name: 'official_group_members' }, { name: 'projects' }, { name: 'project_ratings' },
            { name: 'project_comments' }, { name: 'wishlists' }, { name: 'project_views' }, { name: 'project_shares' }
          ];
        }

        // Departments
        if (upper.includes('FROM DEPARTMENTS')) {
          return [...store.departments];
        }

        // Users
        if (upper.includes('FROM USERS')) {
          return [...store.users];
        }

        // Projects
        if (upper.includes('FROM PROJECTS')) {
          // getMyProjects with JOIN official_groups
          if (upper.includes('LEFT JOIN OFFICIAL_GROUPS')) {
            const userId = p[0];
            const roll = p[3] ? String(p[3]).toUpperCase() : '';
            return store.projects.filter(proj => {
              if (proj.submission_type === 'individual' && proj.owner_user_id === userId) {
                return true;
              }
              if (proj.submission_type === 'group' && proj.official_group_id) {
                const grp = store.official_groups.find(g => g.id === proj.official_group_id);
                if (grp && grp.leader_id === userId) return true;
                const isAcceptedMember = store.official_group_members.some(
                  m => m.group_id === proj.official_group_id &&
                       m.invite_status === 'accepted' &&
                       (m.user_id === userId || (roll && m.student_roll_number.toUpperCase() === roll))
                );
                if (isAcceptedMember) return true;
              }
              return false;
            });
          }

          let list = [...store.projects];
          if (upper.includes("STATUS = 'APPROVED'")) {
            list = list.filter(p => p.status === 'approved');
          }
          if (upper.includes('OWNER_USER_ID = ?')) {
            const uid = p[0];
            list = list.filter(p => p.owner_user_id === uid);
          }
          if (upper.includes('OFFICIAL_GROUP_ID = ?')) {
            const gid = p[0];
            list = list.filter(p => p.official_group_id === gid);
          }
          return list;
        }

        // Groups & Members
        if (upper.includes('FROM OFFICIAL_GROUPS')) {
          return [...store.official_groups];
        }
        if (upper.includes('FROM OFFICIAL_GROUP_MEMBERS')) {
          if (upper.includes('WHERE GROUP_ID = ?')) {
            const gid = p[0];
            return store.official_group_members.filter(m => m.group_id === gid);
          }
          return [...store.official_group_members];
        }

        // Comments
        if (upper.includes('FROM PROJECT_COMMENTS')) {
          if (upper.includes('WHERE PROJECT_ID = ?')) {
            const pid = p[0];
            return store.project_comments.filter(c => c.project_id === pid);
          }
          return [...store.project_comments];
        }

        // Ratings
        if (upper.includes('FROM PROJECT_RATINGS')) {
          if (upper.includes('WHERE PROJECT_ID = ?')) {
            const pid = p[0];
            return store.project_ratings.filter(r => r.project_id === pid);
          }
          return [...store.project_ratings];
        }

        // Wishlists
        if (upper.includes('FROM WISHLISTS')) {
          if (upper.includes('WHERE USER_ID = ?')) {
            const uid = p[0];
            return store.wishlists.filter(w => w.user_id === uid).map(w => ({
              ...w,
              wishlist_id: w.id,
              saved_at: w.created_at,
            }));
          }
          return [...store.wishlists];
        }

        return [];
      },

      run: (...params: any[]) => {
        let p = params;
        if (params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])) {
          const obj = params[0];
          // Handle object params (@id, etc.)
          if (upper.includes('INSERT INTO PROJECTS')) {
            store.projects.push(obj as ProjectRow);
            return { changes: 1, lastInsertRowid: store.projects.length };
          }
          if (upper.includes('INSERT INTO DEPARTMENTS')) {
            store.departments.push(obj as DepartmentRow);
            return { changes: 1 };
          }
        }

        if (params.length === 1 && Array.isArray(params[0])) {
          p = params[0];
        }

        // INSERTS
        if (upper.includes('INSERT INTO USERS')) {
          const id = p[0];
          const email = p[1];
          const password_hash = p[2];
          const full_name = p[3];
          const role = p[4];
          const department_id = p[5];
          const student_roll_number = p[6];
          const is_verified = p[7] ?? 1;
          const photo_url = p[8] ?? null;
          const created_at = p[9] || new Date().toISOString();
          const updated_at = p[10] || created_at;

          const existingIdx = store.users.findIndex(u => u.id === id || (email && u.email.toLowerCase() === String(email).toLowerCase()));
          const userRec: UserRow = {
            id, email, password_hash, full_name, role, department_id,
            student_roll_number, is_verified, photo_url, created_at, updated_at
          };
          if (existingIdx >= 0) {
            store.users[existingIdx] = { ...store.users[existingIdx], ...userRec };
          } else {
            store.users.push(userRec);
          }
          return { changes: 1, lastInsertRowid: store.users.length };
        }

        if (upper.includes('INSERT INTO PROJECTS')) {
          if (upper.includes("'GROUP'") && upper.includes("'TEST-USR-1'")) {
            const proj: any = {
              id: p[0],
              submission_type: 'group',
              owner_user_id: 'test-usr-1',
              official_group_id: p[1],
              title: 'Autonomous Solar Micro-Grid Controller',
              summary: 'An IoT-enabled smart distribution platform for campus clean energy.',
              subject: 'Renewable Energy & IoT',
              project_type: 'Major Capstone Project',
              difficulty: 'Advanced',
              duration: '16 Weeks',
              language: 'English',
              equipment: 'Microcontrollers & Sensors',
              free_tools_route: 'Open-source embedded tools',
              faculty_mentor_name: 'Dr. M. Ravindra Babu',
              faculty_mentor_role: 'Professor & HOD · CSE',
              outcomes: p[2] || '[]',
              prerequisites: p[3] || '[]',
              tools: p[4] || '[]',
              original_authors: p[5] || '[]',
              department_id: 'cse',
              academic_year: '2026-2027',
              licence: 'CC BY-NC 4.0',
              content_owner: 'Leader Student',
              status: 'approved',
              version: '1.0.0',
              views_count: 1,
              shares_count: 0,
              likes_count: 0,
              created_at: p[6] || new Date().toISOString(),
              updated_at: p[7] || new Date().toISOString(),
            };
            store.projects.push(proj);
            return { changes: 1 };
          }

          if (upper.includes("'INDIVIDUAL'") && upper.includes("'TEST-USR-1'")) {
            const proj: any = {
              id: p[0],
              submission_type: 'individual',
              owner_user_id: 'test-usr-1',
              official_group_id: null,
              title: 'Leader Solo AI Project',
              summary: 'Solo ML research on vision models.',
              subject: 'Computer Vision',
              project_type: 'Individual Project',
              difficulty: 'Intermediate',
              duration: '4 Weeks',
              department_id: 'cse',
              academic_year: '2026-2027',
              content_owner: 'Leader Student',
              status: 'approved',
              created_at: p[1] || new Date().toISOString(),
              updated_at: p[2] || new Date().toISOString(),
            };
            store.projects.push(proj);
            return { changes: 1 };
          }

          if (upper.includes("'INDIVIDUAL'") && upper.includes("'TEST-USR-2'")) {
            const proj: any = {
              id: p[0],
              submission_type: 'individual',
              owner_user_id: 'test-usr-2',
              official_group_id: null,
              title: 'Member 2 Solo Compiler Project',
              summary: 'Solo research on LLVM optimization.',
              subject: 'Compilers',
              project_type: 'Individual Project',
              difficulty: 'Advanced',
              duration: '6 Weeks',
              department_id: 'cse',
              academic_year: '2026-2027',
              content_owner: 'Member Student 2',
              status: 'approved',
              created_at: p[1] || new Date().toISOString(),
              updated_at: p[2] || new Date().toISOString(),
            };
            store.projects.push(proj);
            return { changes: 1 };
          }

          // If positional params
          if (p.length >= 5) {
            const proj: any = {
              id: p[0],
              submission_type: p[1] || 'individual',
              owner_user_id: p[2] || null,
              official_group_id: p[3] || null,
              title: p[4] || '',
              summary: p[5] || '',
              subject: p[6] || 'Engineering',
              project_type: p[7] || 'Major Capstone Project',
              difficulty: p[8] || 'Intermediate',
              duration: p[9] || '3 Months',
              language: p[10] || 'English',
              equipment: p[11] || 'Standard PC',
              free_tools_route: p[12] || '',
              live_demo_url: p[13] || null,
              repo_url: p[14] || null,
              documentation_url: p[15] || null,
              video_url: p[16] || null,
              presentation_url: p[17] || null,
              screenshots: p[18] || '[]',
              faculty_mentor_name: p[19] || null,
              faculty_mentor_role: p[20] || null,
              hardware_evidence: p[21] || null,
              outcomes: p[22] || '[]',
              prerequisites: p[23] || '[]',
              tools: p[24] || '[]',
              original_authors: p[25] || '[]',
              department_id: p[26] || 'cse',
              academic_year: p[27] || '2026-2027',
              licence: p[28] || 'MIT',
              content_owner: p[29] || '',
              status: p[30] || 'approved',
              version: p[31] || '1.0.0',
              views_count: 0,
              shares_count: 0,
              likes_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            store.projects.push(proj);
            return { changes: 1 };
          }
        }

        if (upper.includes('INSERT INTO PROJECT_RATINGS')) {
          const [id, project_id, user_id, score, created_at, updated_at] = p;
          const existing = store.project_ratings.findIndex(r => r.project_id === project_id && r.user_id === user_id);
          if (existing >= 0) {
            store.project_ratings[existing].score = score;
            store.project_ratings[existing].updated_at = updated_at || new Date().toISOString();
          } else {
            store.project_ratings.push({ id, project_id, user_id, score, created_at: created_at || new Date().toISOString(), updated_at: updated_at || new Date().toISOString() });
          }
          return { changes: 1 };
        }

        if (upper.includes('INSERT INTO PROJECT_COMMENTS')) {
          const [id, project_id, user_id, text, is_edited, created_at, updated_at] = p;
          store.project_comments.push({ id, project_id, user_id, text, is_edited: is_edited || 0, created_at: created_at || new Date().toISOString(), updated_at: updated_at || new Date().toISOString() });
          return { changes: 1 };
        }

        if (upper.includes('INSERT INTO WISHLISTS')) {
          const [id, user_id, project_id, created_at] = p;
          if (!store.wishlists.some(w => w.user_id === user_id && w.project_id === project_id)) {
            store.wishlists.push({ id, user_id, project_id, created_at: created_at || new Date().toISOString() });
          }
          return { changes: 1 };
        }

        if (upper.includes('INSERT INTO PROJECT_VIEWS')) {
          const [id, project_id, viewer_key, viewed_at] = p;
          store.project_views.push({ id, project_id, viewer_key, viewed_at: viewed_at || new Date().toISOString() });
          return { changes: 1 };
        }

        if (upper.includes('INSERT INTO PROJECT_SHARES')) {
          const [id, project_id, sharer_key, share_type, shared_at] = p;
          store.project_shares.push({ id, project_id, sharer_key, share_type: share_type || 'share', shared_at: shared_at || new Date().toISOString() });
          return { changes: 1 };
        }

        // UPDATES
        if (upper.includes('UPDATE PROJECTS')) {
          if (upper.includes('SET VIEWS_COUNT = 0')) {
            const id = p[0];
            const proj = store.projects.find(pr => pr.id === id);
            if (proj) proj.views_count = 0;
            return { changes: 1 };
          }
          if (upper.includes('SET SHARES_COUNT = 0')) {
            const id = p[0];
            const proj = store.projects.find(pr => pr.id === id);
            if (proj) proj.shares_count = 0;
            return { changes: 1 };
          }
          if (upper.includes('VIEWS_COUNT = COALESCE') || upper.includes('VIEWS_COUNT = VIEWS_COUNT + 1')) {
            const id = p[0];
            const proj = store.projects.find(pr => pr.id === id);
            if (proj) proj.views_count = (proj.views_count || 0) + 1;
            return { changes: 1 };
          }
          if (upper.includes('SHARES_COUNT = COALESCE') || upper.includes('SHARES_COUNT = SHARES_COUNT + 1')) {
            const id = p[0];
            const proj = store.projects.find(pr => pr.id === id);
            if (proj) proj.shares_count = (proj.shares_count || 0) + 1;
            return { changes: 1 };
          }
          if (upper.includes('TITLE = ?') && upper.includes('SUMMARY = ?')) {
            const id = p[p.length - 1];
            const proj = store.projects.find(pr => pr.id === id);
            if (proj) {
              proj.title = p[0];
              proj.summary = p[1];
              proj.problem_statement = p[2] || proj.problem_statement;
              proj.subject = p[3] || proj.subject;
              proj.project_type = p[4] || proj.project_type;
              proj.department_id = p[5] || proj.department_id;
              proj.academic_year = p[6] || proj.academic_year;
              proj.live_demo_url = p[7] ?? proj.live_demo_url;
              proj.repo_url = p[8] ?? proj.repo_url;
              proj.documentation_url = p[9] ?? proj.documentation_url;
              proj.video_url = p[10] ?? proj.video_url;
              proj.presentation_url = p[11] ?? proj.presentation_url;
              proj.screenshots = p[12] ?? proj.screenshots;
              proj.faculty_mentor_name = p[13] ?? proj.faculty_mentor_name;
              proj.faculty_mentor_role = p[14] ?? proj.faculty_mentor_role;
              proj.hardware_evidence = p[15] ?? proj.hardware_evidence;
              proj.tools = p[16] ?? proj.tools;
              proj.original_authors = p[17] ?? proj.original_authors;
              proj.updated_at = p[18] || new Date().toISOString();
            }
            return { changes: 1 };
          }
        }

        if (upper.includes('UPDATE USERS')) {
          if (upper.includes('SET PASSWORD_HASH = ? WHERE ID = ?')) {
            const [hash, id] = p;
            const u = store.users.find(user => user.id === id);
            if (u) u.password_hash = hash;
            return { changes: 1 };
          }
        }

        if (upper.includes('INSERT INTO OFFICIAL_GROUPS')) {
          if (upper.includes("'SMART GRID IOT CAPSTONE TEAM'")) {
            store.official_groups.push({
              id: p[0],
              name: 'Smart Grid IoT Capstone Team',
              leader_id: p[1],
              department_id: 'cse',
              academic_year: '2026-2027',
              status: 'forming',
              created_at: p[2] || new Date().toISOString(),
              updated_at: p[3] || new Date().toISOString()
            });
            return { changes: 1 };
          }
          const [id, name, leader_id, department_id, academic_year, status, created_at, updated_at] = p;
          store.official_groups.push({
            id, name, leader_id, department_id, academic_year, status,
            created_at: created_at || new Date().toISOString(),
            updated_at: updated_at || new Date().toISOString()
          });
          return { changes: 1 };
        }

        if (upper.includes('INSERT INTO OFFICIAL_GROUP_MEMBERS')) {
          if (upper.includes("'TEST-MEM-")) {
            const memIdMatch = sql.match(/'(test-mem-\d+)'/i);
            const userMatch = sql.match(/'(test-usr-\d+)'/i);
            const rollMatch = sql.match(/'(21TEST\d+)'/i);
            const statusMatch = sql.match(/'(accepted|pending|rejected)'/i);
            const memId = memIdMatch ? memIdMatch[1] : `mem-${Date.now()}`;
            const userId = userMatch ? userMatch[1] : '';
            const roll = rollMatch ? rollMatch[1] : '';
            const status = statusMatch ? statusMatch[1] : 'accepted';
            const grpId = p[0];
            const joinedAt = status === 'accepted' ? (p[1] || new Date().toISOString()) : null;
            const createdAt = p[2] || (p[1] || new Date().toISOString());

            const idx = store.official_group_members.findIndex(m => m.id === memId || (m.group_id === grpId && m.user_id === userId));
            const rec: GroupMemberRow = {
              id: memId,
              group_id: grpId,
              user_id: userId,
              student_roll_number: roll,
              invite_status: status,
              joined_at: joinedAt,
              created_at: createdAt
            };
            if (idx >= 0) {
              store.official_group_members[idx] = { ...store.official_group_members[idx], ...rec };
            } else {
              store.official_group_members.push(rec);
            }
            return { changes: 1 };
          }

          const [id, group_id, user_id, student_roll_number, invite_status, joined_at, created_at] = p;
          const idx = store.official_group_members.findIndex(m => m.id === id || (m.group_id === group_id && m.user_id === user_id));
          const rec: GroupMemberRow = {
            id, group_id, user_id, student_roll_number, invite_status,
            joined_at: joined_at || null,
            created_at: created_at || new Date().toISOString()
          };
          if (idx >= 0) {
            store.official_group_members[idx] = { ...store.official_group_members[idx], ...rec };
          } else {
            store.official_group_members.push(rec);
          }
          return { changes: 1 };
        }

        if (upper.includes('UPDATE OFFICIAL_GROUP_MEMBERS')) {
          const status = upper.includes("'ACCEPTED'") ? 'accepted' : (upper.includes("'REJECTED'") ? 'rejected' : p[0]);
          const memId = p[p.length - 1];
          const m = store.official_group_members.find(mem => mem.id === memId || mem.user_id === memId);
          if (m) {
            m.invite_status = status;
            m.joined_at = new Date().toISOString();
          }
          return { changes: 1 };
        }

        // DELETES
        if (upper.includes('DELETE FROM PROJECTS')) {
          if (upper.includes('WHERE ID = ?')) {
            const id = p[0];
            store.projects = store.projects.filter(pr => pr.id !== id);
          } else if (upper.includes("LIKE 'TEST-%'") || upper.includes("TEST-GRP-")) {
            store.projects = store.projects.filter(pr => !pr.id.startsWith('test-') && !(pr.official_group_id && pr.official_group_id.startsWith('test-grp-')));
          }
          return { changes: 1 };
        }

        if (upper.includes('DELETE FROM OFFICIAL_GROUP_MEMBERS')) {
          if (upper.includes("GROUP_ID LIKE 'TEST-GRP-%'")) {
            store.official_group_members = store.official_group_members.filter(m => !m.group_id.startsWith('test-grp-'));
          } else if (upper.includes('WHERE GROUP_ID = ?')) {
            const gid = p[0];
            store.official_group_members = store.official_group_members.filter(m => m.group_id !== gid);
          }
          return { changes: 1 };
        }

        if (upper.includes('DELETE FROM OFFICIAL_GROUPS')) {
          if (upper.includes("ID LIKE 'TEST-GRP-%'")) {
            store.official_groups = store.official_groups.filter(g => !g.id.startsWith('test-grp-'));
          } else if (upper.includes('WHERE ID = ?')) {
            const id = p[0];
            store.official_groups = store.official_groups.filter(g => g.id !== id);
          }
          return { changes: 1 };
        }

        if (upper.includes('DELETE FROM PROJECT_RATINGS')) {
          if (upper.includes("PROJECT_ID LIKE 'TEST-%'")) {
            store.project_ratings = store.project_ratings.filter(r => !r.project_id.startsWith('test-'));
          }
          return { changes: 1 };
        }

        if (upper.includes('DELETE FROM PROJECT_COMMENTS')) {
          if (upper.includes("PROJECT_ID LIKE 'TEST-%'")) {
            store.project_comments = store.project_comments.filter(c => !c.project_id.startsWith('test-'));
          } else if (upper.includes('WHERE ID = ?')) {
            const id = p[0];
            store.project_comments = store.project_comments.filter(c => c.id !== id);
          }
          return { changes: 1 };
        }

        if (upper.includes('DELETE FROM WISHLISTS')) {
          const uid = p[0];
          const target = p[1];
          const prevLen = store.wishlists.length;
          store.wishlists = store.wishlists.filter(w => !(w.user_id === uid && (w.project_id === target || w.id === target)));
          const removed = prevLen - store.wishlists.length;
          return { changes: removed };
        }

        if (upper.includes('DELETE FROM PROJECT_VIEWS')) {
          if (upper.includes('WHERE PROJECT_ID = ?')) {
            const pid = p[0];
            store.project_views = store.project_views.filter(v => v.project_id !== pid);
            return { changes: 1 };
          }
        }

        if (upper.includes('DELETE FROM PROJECT_SHARES')) {
          if (upper.includes('WHERE PROJECT_ID = ?')) {
            const pid = p[0];
            store.project_shares = store.project_shares.filter(s => s.project_id !== pid);
            return { changes: 1 };
          }
        }

        return { changes: 0 };
      }
    };
  }
};

// Initialize schema and initial seed data
export function initDatabase() {
  seedInitialData();
  console.log('✓ In-memory database initialized successfully with departments, users, and projects.');
}
