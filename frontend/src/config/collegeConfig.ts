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
    email: 'projecthub@kitsts.ac.in',
    phone: '+91 8727-252555',
    website: 'https://kitsts.ac.in/',
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
  departments: [
    {
      id: 'civil',
      code: 'CIVIL',
      name: 'Civil Engineering',
      shortName: 'Civil',
      icon: 'Building2',
      description: 'Structural health monitoring, sustainable geopolymer concrete, GIS hydrological modeling, and smart urban infrastructure.',
      hodName: 'Dr. T. Narsimha Reddy',
      hodEmail: 'hod.civil@kitsts.ac.in',
      labsCount: 6,
    },
    {
      id: 'eee',
      code: 'EEE',
      name: 'Electrical and Electronics Engineering',
      shortName: 'EEE',
      icon: 'Zap',
      description: 'Smart power grids, renewable microgrid integration, bidirectional EV fast chargers, and power electronics motor drives.',
      hodName: 'Dr. B. Venkanna',
      hodEmail: 'hod.eee@kitsts.ac.in',
      labsCount: 6,
    },
    {
      id: 'mech',
      code: 'MECH',
      name: 'Mechanical Engineering',
      shortName: 'Mechanical',
      icon: 'Cog',
      description: 'Additive manufacturing, multi-axis robotic arms, computational fluid dynamics (CFD), and solar thermal refrigeration.',
      hodName: 'Dr. P. Sudhakar',
      hodEmail: 'hod.mech@kitsts.ac.in',
      labsCount: 9,
    },
    {
      id: 'ece',
      code: 'ECE',
      name: 'Electronics and Communication Engineering',
      shortName: 'ECE',
      icon: 'Radio',
      description: 'VLSI architectures, embedded IoT telemetry, FPGA accelerator design, signal processing, and antenna arrays.',
      hodName: 'Dr. K. Srinivas Rao',
      hodEmail: 'hod.ece@kitsts.ac.in',
      labsCount: 7,
    },
    {
      id: 'cse',
      code: 'CSE',
      name: 'Computer Science and Engineering',
      shortName: 'CSE',
      icon: 'Cpu',
      description: 'Distributed cloud systems, applied cryptography, real-time edge processing, and high-performance algorithms.',
      hodName: 'Dr. M. Ravindra Babu',
      hodEmail: 'hod.cse@kitsts.ac.in',
      labsCount: 8,
    },
    {
      id: 'aiml',
      code: 'AI & ML',
      name: 'Artificial Intelligence and Machine Learning',
      shortName: 'AI & ML',
      icon: 'Brain',
      description: 'Deep neural networks, computer vision, multilingual NLP, autonomous robotics, and edge inference pipelines.',
      hodName: 'Dr. S. Ramesh Kumar',
      hodEmail: 'hod.aiml@kitsts.ac.in',
      labsCount: 4,
    },
    {
      id: 'it',
      code: 'IT',
      name: 'Information Technology',
      shortName: 'IT',
      icon: 'Layers',
      description: 'Enterprise full-stack architectures, cybersecurity defense grids, cloud-native DevOps, and cross-platform mobile ecosystems.',
      hodName: 'Dr. A. Srinivas',
      hodEmail: 'hod.it@kitsts.ac.in',
      labsCount: 5,
    },
    {
      id: 'ds',
      code: 'CSE (DS)',
      name: 'CSE Data Science',
      shortName: 'CSE Data Science',
      icon: 'BarChart3',
      description: 'Big data telemetry pipelines, predictive Bayesian statistics, high-dimensional anomaly detection, and business intelligence.',
      hodName: 'Dr. V. Rajeshwari',
      hodEmail: 'hod.ds@kitsts.ac.in',
      labsCount: 4,
    },
  ],
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

export const thumbnailPresets = [
  {
    label: 'Smart Agriculture & IoT Rover',
    url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'AI & Neural Vision',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Microgrid & Renewable Power',
    url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Robotics & Mechatronics',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Biomedical & Signal Processing',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Structural Engineering & Smart City',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    label: 'Cloud & Cyber Infrastructure',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
  },
];
