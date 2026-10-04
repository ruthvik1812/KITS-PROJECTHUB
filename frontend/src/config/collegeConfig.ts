import { Department } from '../types';

export interface CollegeConfig {
  collegeName: string;
  collegeFullName: string;
  shortName: string;
  motto: string;
  establishedYear: number;
  affiliationText: string;
  accreditationText: string;
  campusLocation: string;
  address: {
    line1: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  palette: {
    primaryMagenta: string;
    primaryBlue: string;
    navBackground: string;
    darkText: string;
    mutedText: string;
    cardBorder: string;
    cyanAccent: string;
    activeTabBlue: string;
  };
  departments: Department[];
  graduationYears: number[];
  projectTypes: string[];
  popularTechnologies: string[];
}

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'cse',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    shortName: 'CSE',
    icon: 'Cpu',
    description: 'Core computing, systems engineering, cryptography, and cloud platforms.',
  },
  {
    id: 'aiml',
    code: 'CSM',
    name: 'Artificial Intelligence and Machine Learning',
    shortName: 'AI & ML',
    icon: 'Brain',
    description: 'Deep neural networks, computer vision, NLP, and intelligent systems.',
  },
  {
    id: 'ece',
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    shortName: 'ECE',
    icon: 'Radio',
    description: 'VLSI architectures, embedded IoT telemetry, DSP, and antenna arrays.',
  },
  {
    id: 'eee',
    code: 'EEE',
    name: 'Electrical and Electronics Engineering',
    shortName: 'EEE',
    icon: 'Zap',
    description: 'Renewable energy microgrids, EV powertrains, and high-voltage simulation.',
  },
  {
    id: 'me',
    code: 'ME',
    name: 'Mechanical Engineering',
    shortName: 'Mechanical',
    icon: 'Cog',
    description: 'Robotics chassis, additive manufacturing, thermofluids, and CAD/CAM.',
  },
  {
    id: 'it',
    code: 'IT',
    name: 'Information Technology',
    shortName: 'IT',
    icon: 'Layers',
    description: 'Cybersecurity, fullstack engineering, database systems, and networks.',
  },
  {
    id: 'civil',
    code: 'CIVIL',
    name: 'Civil Engineering',
    shortName: 'Civil',
    icon: 'Building2',
    description: 'Structural health monitoring, concrete technology, and GIS urban modeling.',
  },
  {
    id: 'ds',
    code: 'CSE (DS)',
    name: 'CSE Data Science',
    shortName: 'CSE Data Science',
    icon: 'BarChart3',
    description: 'Big data telemetry, predictive statistics, and business intelligence.',
  },
];

export const kitsCollegeConfig: CollegeConfig = {
  collegeName: 'KITS ProjectHub',
  collegeFullName: 'Kamala Institute of Technology and Science',
  shortName: 'KITS Singapur',
  motto: 'Advancing Technical Excellence & Student Innovation',
  establishedYear: 1997,
  affiliationText: 'Approved by AICTE, New Delhi & Affiliated to JNTU Hyderabad',
  accreditationText: 'Accredited with NAAC "A+" Grade & NBA Accredited Programs',
  campusLocation: 'Singapur, Huzurabad, Telangana',
  address: {
    line1: 'Singapur, Huzurabad Mandal',
    city: 'Huzurabad',
    district: 'Karimnagar',
    state: 'Telangana',
    pincode: '505468',
    country: 'India',
  },
  contact: {
    email: 'contact@kitss.edu.in',
    phone: '+91 94405 61261',
    website: 'https://kitss.edu.in',
  },
  palette: {
    primaryMagenta: '#CA0765',
    primaryBlue: '#0070C2',
    navBackground: '#F6F6F7',
    darkText: '#19232B',
    mutedText: '#757F95',
    cardBorder: '#D5D5D5',
    cyanAccent: '#03A9F5',
    activeTabBlue: '#0D6EFD',
  },
  departments: DEFAULT_DEPARTMENTS,
  graduationYears: [2027, 2028, 2029, 2030, 2031],
  projectTypes: [
    'Major Capstone Project',
    'Mini Project',
    'RTRP (RealTime Research Project)',
    'Hackathon Project',
    'Research & Innovation',
    'Industry Collaborative',
    'Interdisciplinary',
  ],
  popularTechnologies: [
    'React',
    'TypeScript',
    'Python',
    'TensorFlow',
    'PyTorch',
    'IoT & Arduino',
    'Node.js',
    'OpenCV',
    'Flutter',
    'MATLAB',
    'ESP32',
    'ROS (Robotics)',
    'FastAPI',
    'SolidWorks',
    'Embedded C',
    'MERN Stack',
    'Cloud & Cyber Infrastructure',
    'AI & Neural Vision',
    'Microgrid & Renewable Power',
    'Robotics & Mechatronics',
    'Biomedical & Signal Processing',
    'Structural Engineering & Smart City',
    'MongoDB',
  ],
};

