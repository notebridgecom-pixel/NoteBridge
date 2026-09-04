import { AcademicCatalog, AcademicCollege, AcademicCourse, AcademicBranch, AcademicSubject } from '../types';
import { logSecurityEvent } from './securityLogs';

const CATALOG_STORAGE_KEY = 'notebridge_academic_catalog_v3';

export const INITIAL_COURSES: AcademicCourse[] = [
  {
    id: 'course-diploma',
    name: 'Diploma',
    category: 'Diploma / Polytechnic',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
  },
  {
    id: 'course-btech',
    name: 'BE / B.Tech',
    category: 'Engineering & Technology',
    durationYears: 4,
    totalSemesters: 8,
    isActive: true,
  },
  {
    id: 'course-bcom',
    name: 'B.Com',
    category: 'Commerce & Arts',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
  },
  {
    id: 'course-mcom',
    name: 'M.Com',
    category: 'Commerce & Arts',
    durationYears: 2,
    totalSemesters: 4,
    isActive: true,
  },
  {
    id: 'course-bsc',
    name: 'B.Sc Computer Science / IT',
    category: 'Science & Research',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
  },
  {
    id: 'course-msc',
    name: 'M.Sc',
    category: 'Science & Research',
    durationYears: 2,
    totalSemesters: 4,
    isActive: true,
  },
  {
    id: 'course-bca',
    name: 'BCA',
    category: 'Computer Applications',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
  },
  {
    id: 'course-mca',
    name: 'MCA',
    category: 'Computer Applications',
    durationYears: 2,
    totalSemesters: 4,
    isActive: true,
  },
  {
    id: 'course-bba',
    name: 'BBA',
    category: 'Management',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
  },
  {
    id: 'course-mba',
    name: 'MBA',
    category: 'Management',
    durationYears: 2,
    totalSemesters: 4,
    isActive: true,
  },
  {
    id: 'course-ba',
    name: 'BA',
    category: 'Commerce & Arts',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
  },
  {
    id: 'course-mtech',
    name: 'M.Tech',
    category: 'Engineering & Technology',
    durationYears: 2,
    totalSemesters: 4,
    isActive: true,
  },
];

export const INITIAL_COLLEGES: AcademicCollege[] = [
  {
    id: 'col-vpoly',
    name: 'Vidyalankar Polytechnic',
    code: 'VP',
    location: 'Wadala (East), Mumbai, Maharashtra',
    affiliatedUniversity: 'MSBTE (Maharashtra State Board of Technical Education)',
    courseIds: ['course-diploma'],
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'col-vit',
    name: 'Vidyalankar Engineering College',
    code: 'VIT',
    location: 'Wadala (East), Mumbai, Maharashtra',
    affiliatedUniversity: 'Mumbai University (MU)',
    courseIds: ['course-btech', 'course-mtech', 'course-mca', 'course-mba'],
    isActive: true,
    createdAt: '2024-01-01',
  },
];

export const INITIAL_BRANCHES: AcademicBranch[] = [
  // 1. Vidyalankar Polytechnic / Diploma Streams & Branches
  {
    id: 'branch-diploma-co',
    name: 'Computer Engineering',
    code: 'CO',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },
  {
    id: 'branch-diploma-te',
    name: 'Telecommunication Engineering',
    code: 'TE',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },
  {
    id: 'branch-diploma-it',
    name: 'Information Technology',
    code: 'IF',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },
  {
    id: 'branch-diploma-ee',
    name: 'Electronics & Telecommunication',
    code: 'EJ/TE',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },
  {
    id: 'branch-diploma-me',
    name: 'Mechanical Engineering',
    code: 'ME',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },
  {
    id: 'branch-diploma-ce',
    name: 'Civil Engineering',
    code: 'CE',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },
  {
    id: 'branch-diploma-elec',
    name: 'Electrical Engineering',
    code: 'EE',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  },

  // 2. Vidyalankar Engineering College / BE / B.Tech Streams & Branches
  {
    id: 'branch-btech-ece',
    name: 'Electronics and Computer Engineering',
    code: 'ECE',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-cmpn',
    name: 'Computer Engineering',
    code: 'CMPN',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-it',
    name: 'Information Technology',
    code: 'INFT',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-extc',
    name: 'Electronics and Telecommunication Engineering',
    code: 'EXTC',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-aids',
    name: 'Artificial Intelligence and Data Science',
    code: 'AI&DS',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-cse',
    name: 'Computer Science and Engineering',
    code: 'CSE',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-me',
    name: 'Mechanical Engineering',
    code: 'MECH',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-ce',
    name: 'Civil Engineering',
    code: 'CIVIL',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-btech-ee',
    name: 'Electrical Engineering',
    code: 'ELEC',
    courseId: 'course-btech',
    collegeIds: ['col-vit'],
    isActive: true,
  },

  // General streams for future expansion
  {
    id: 'branch-bcom-general',
    name: 'Financial Accounting & Auditing',
    code: 'BCOM-FAA',
    courseId: 'course-bcom',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-bca-general',
    name: 'Software Development & Web Technologies',
    code: 'BCA-SD',
    courseId: 'course-bca',
    collegeIds: ['col-vit'],
    isActive: true,
  },
  {
    id: 'branch-mba-finance',
    name: 'Finance & Banking Management',
    code: 'MBA-FIN',
    courseId: 'course-mba',
    collegeIds: ['col-vit'],
    isActive: true,
  },
];

export const INITIAL_ACADEMIC_YEARS = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2023-2024',
];

export const INITIAL_SUBJECTS: AcademicSubject[] = [
  // Vidyalankar Engineering College / B.Tech Computer Engg
  {
    id: 'subj-dsa',
    name: 'Data Structures & Algorithms',
    code: 'CSC301',
    courseId: 'course-btech',
    branchId: 'branch-btech-cmpn',
    semester: 3,
    collegeId: 'col-vit',
    units: [
      'Unit 1: Introduction to Data Structures, Arrays & Linked Lists',
      'Unit 2: Stacks, Queues & Recursion',
      'Unit 3: Trees, Binary Search Trees & AVL Trees',
      'Unit 4: Graphs, BFS, DFS & Shortest Path Algorithms',
      'Unit 5: Sorting & Searching Techniques (Quick, Merge, Radix)',
      'Unit 6: Hashing & Dynamic Programming with PYQ Solutions',
      'Complete Units (Unit 1 to 6 - Full Syllabus)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-os',
    name: 'Operating Systems',
    code: 'CSC402',
    courseId: 'course-btech',
    branchId: 'branch-btech-cmpn',
    semester: 4,
    collegeId: 'col-vit',
    units: [
      'Unit 1: OS Overview, Dual Mode Operation & System Calls',
      'Unit 2: Process Synchronization, Critical Section & Semaphores',
      'Unit 3: CPU Scheduling Algorithms & Deadlock Handling',
      'Unit 4: Memory Management, Paging & Virtual Memory',
      'Unit 5: File Systems & Disk Scheduling (SCAN, C-SCAN)',
      'Complete Units (Unit 1 to 5 - Full Syllabus)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-dbms',
    name: 'Database Management Systems',
    code: 'CSC403',
    courseId: 'course-btech',
    branchId: 'branch-btech-cmpn',
    semester: 4,
    collegeId: 'col-vit',
    units: [
      'Unit 1: ER Modeling & Relational Algebra',
      'Unit 2: SQL Complex Queries, Triggers & Views',
      'Unit 3: Normalization (1NF, 2NF, 3NF, BCNF)',
      'Unit 4: Transaction Processing & ACID Properties',
      'Unit 5: Concurrency Control & Crash Recovery Protocols',
      'Complete Units (Unit 1 to 5 - Full Syllabus)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-aids-ml',
    name: 'Machine Learning & Pattern Recognition',
    code: 'AIC501',
    courseId: 'course-btech',
    branchId: 'branch-btech-aids',
    semester: 5,
    collegeId: 'col-vit',
    units: [
      'Unit 1: Supervised Learning, Linear & Logistic Regression',
      'Unit 2: Decision Trees, Random Forests & Ensemble Methods',
      'Unit 3: Support Vector Machines & Kernel Tricks',
      'Unit 4: Unsupervised Clustering (K-Means, Hierarchical, DBSCAN)',
      'Unit 5: Neural Networks & Backpropagation Fundamentals',
      'Complete Units (Unit 1 to 5 - Full Syllabus)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-extc-dsp',
    name: 'Digital Signal Processing',
    code: 'ECC502',
    courseId: 'course-btech',
    branchId: 'branch-btech-extc',
    semester: 5,
    collegeId: 'col-vit',
    units: [
      'Unit 1: Discrete Fourier Transform (DFT) & FFT Algorithms',
      'Unit 2: IIR Filter Design (Butterworth, Chebyshev)',
      'Unit 3: FIR Filter Design (Windowing & Frequency Sampling)',
      'Unit 4: Finite Word Length Effects in DSP',
      'Unit 5: Applications in Audio & Image Processing',
      'Complete Units (Unit 1 to 5 - Full Syllabus)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },

  // Vidyalankar Polytechnic / Diploma Subjects
  {
    id: 'subj-diploma-cprog',
    name: 'Programming in C (PIC)',
    code: '22226',
    courseId: 'course-diploma',
    branchId: 'branch-diploma-co',
    semester: 2,
    collegeId: 'col-vpoly',
    units: [
      'Unit 1: Basics of C Programming & Control Flow',
      'Unit 2: Arrays & Strings Manipulation',
      'Unit 3: Functions & Recursion in C',
      'Unit 4: Structures, Unions & Pointers',
      'Unit 5: File Handling & Preprocessors',
      'Complete MSBTE I-Scheme Syllabus (Unit 1 to 5)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-diploma-java',
    name: 'Object Oriented Programming using Java',
    code: '22412',
    courseId: 'course-diploma',
    branchId: 'branch-diploma-co',
    semester: 4,
    collegeId: 'col-vpoly',
    units: [
      'Unit 1: OOP Principles & Core Java Fundamentals',
      'Unit 2: Inheritance, Interfaces & Packages',
      'Unit 3: Exception Handling & Multithreading',
      'Unit 4: Java Collections Framework & Generics',
      'Unit 5: GUI Programming using AWT & Swing',
      'Complete MSBTE I-Scheme Syllabus (Unit 1 to 5)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-diploma-mech-som',
    name: 'Strength of Materials (SOM)',
    code: '22306',
    courseId: 'course-diploma',
    branchId: 'branch-diploma-me',
    semester: 3,
    collegeId: 'col-vpoly',
    units: [
      'Unit 1: Direct Stresses and Strains',
      'Unit 2: Shear Force and Bending Moment Diagrams (SFD/BMD)',
      'Unit 3: Bending & Shear Stresses in Beams',
      'Unit 4: Torsion in Circular Shafts',
      'Unit 5: Direct & Bending Stresses in Columns and Struts',
      'Complete MSBTE Syllabus with Formula Handout',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-btech-ece-mpmc',
    name: 'Microprocessors & Microcontrollers (8086 & ARM)',
    code: 'ECC401',
    courseId: 'course-btech',
    branchId: 'branch-btech-ece',
    semester: 4,
    collegeId: 'col-vit',
    units: [
      'Unit 1: 8086 Architecture, Pin Diagram & Addressing Modes',
      'Unit 2: Instruction Set, Assembly Programming & String Ops',
      'Unit 3: Memory & I/O Interfacing (8255 PPI, 8254 Timer)',
      'Unit 4: ARM Cortex-M Architecture & Thumb Instructions',
      'Unit 5: Interrupts, Exceptions & Bus Protocols (SPI, I2C, UART)',
      'Complete Units (Unit 1 to 5 - Full Syllabus & Solved PYQs)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-btech-ece-coa',
    name: 'Computer Organization & Architecture (COA)',
    code: 'ECC402',
    courseId: 'course-btech',
    branchId: 'branch-btech-ece',
    semester: 4,
    collegeId: 'col-vit',
    units: [
      'Unit 1: CPU Architecture, Register Transfer Language & Micro-operations',
      'Unit 2: Computer Arithmetic (Booth Algorithm, Restoring & Non-restoring)',
      'Unit 3: Control Unit Design (Hardwired vs Microprogrammed)',
      'Unit 4: Memory Organization (Cache Mapping, Virtual Memory, TLB)',
      'Unit 5: Pipelining, Hazards, Multiprocessors & RISC/CISC',
      'Complete Units (Unit 1 to 5 - Full Syllabus & Solved PYQs)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-btech-ece-signals',
    name: 'Signals & Systems',
    code: 'ECC403',
    courseId: 'course-btech',
    branchId: 'branch-btech-ece',
    semester: 4,
    collegeId: 'col-vit',
    units: [
      'Unit 1: Continuous & Discrete Time Signals Classification',
      'Unit 2: Linear Time-Invariant (LTI) Systems & Convolution',
      'Unit 3: Fourier Series, Fourier Transform & Properties',
      'Unit 4: Laplace Transform & Region of Convergence (ROC)',
      'Unit 5: Z-Transform & Frequency Analysis of LTI Systems',
      'Complete Units (Unit 1 to 5 - Full Syllabus & Numericals)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-btech-ece-iot',
    name: 'Embedded Systems & Internet of Things (IoT)',
    code: 'ECC501',
    courseId: 'course-btech',
    branchId: 'branch-btech-ece',
    semester: 5,
    collegeId: 'col-vit',
    units: [
      'Unit 1: Embedded System Hardware Components & Sensors',
      'Unit 2: RTOS Concepts (Tasks, Semaphores, IPC, Priority Inversion)',
      'Unit 3: IoT Communication Protocols (MQTT, CoAP, HTTP, WebSockets)',
      'Unit 4: Cloud Connectivity, Edge Computing & ESP32/Raspberry Pi Interfacing',
      'Unit 5: IoT Security, Low Power Design & Smart System Case Studies',
      'Complete Units (Unit 1 to 5 - Full Syllabus)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-diploma-ece-bee',
    name: 'Basic Electrical & Electronics Engineering (BEE)',
    code: '22103',
    courseId: 'course-diploma',
    branchId: 'branch-diploma-ee',
    semester: 2,
    collegeId: 'col-vpoly',
    units: [
      'Unit 1: DC Circuits, Kirchhoff Laws & Network Theorems (Thevenin, Norton)',
      'Unit 2: AC Fundamentals, Series & Parallel RLC Circuits, Phasors',
      'Unit 3: Three-Phase Circuits & Transformer Operation',
      'Unit 4: Semiconductor Diodes, Rectifiers & BJT Characteristics',
      'Unit 5: Digital Logic Gates & Operational Amplifiers (Op-Amp 741)',
      'Complete MSBTE I-Scheme Syllabus (Unit 1 to 5)',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
  {
    id: 'subj-diploma-civil-survey',
    name: 'Surveying & Advanced Geomatics',
    code: '22301',
    courseId: 'course-diploma',
    branchId: 'branch-diploma-ce',
    semester: 3,
    collegeId: 'col-vpoly',
    units: [
      'Unit 1: Chain & Compass Surveying',
      'Unit 2: Levelling & Contouring',
      'Unit 3: Theodolite Surveying',
      'Unit 4: Total Station & GPS Principles',
      'Unit 5: Curve Ranging & Field Computations',
      'Complete MSBTE Syllabus with Field Numerical',
    ],
    academicYears: ['2024-2025', '2025-2026'],
    isActive: true,
  },
];

export const INITIAL_CATALOG: AcademicCatalog = {
  colleges: INITIAL_COLLEGES,
  courses: INITIAL_COURSES,
  branches: INITIAL_BRANCHES,
  subjects: INITIAL_SUBJECTS,
  academicYears: INITIAL_ACADEMIC_YEARS,
  updatedAt: new Date().toISOString(),
};

/** Get whole academic catalog from persistent storage */
export function getAcademicCatalog(): AcademicCatalog {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_CATALOG));
      return INITIAL_CATALOG;
    }
    const parsed = JSON.parse(raw) as AcademicCatalog;
    // ensure all structure exists
    if (!parsed.colleges || !parsed.courses || !parsed.branches || !parsed.subjects) {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_CATALOG));
      return INITIAL_CATALOG;
    }

    // Remove any duplicate or legacy branch-diploma-ece
    let hasUpdates = false;
    const originalBranchCount = parsed.branches.length;
    parsed.branches = parsed.branches.filter((b) => b.id !== 'branch-diploma-ece');
    if (parsed.branches.length !== originalBranchCount) {
      hasUpdates = true;
    }

    // Rename any legacy Electrical and Computer Engineering to Electronics and Computer Engineering
    parsed.branches.forEach((b) => {
      if (b.name === 'Electrical and Computer Engineering' || b.name === 'Electrical & Computer Engineering') {
        b.name = 'Electronics and Computer Engineering';
        hasUpdates = true;
      }
    });

    // Merge any newly introduced initial branches (e.g. Electronics and Computer Engineering)
    INITIAL_BRANCHES.forEach((ib) => {
      if (!parsed.branches.some((b) => b.id === ib.id || (b.name.toLowerCase() === ib.name.toLowerCase() && b.courseId === ib.courseId))) {
        parsed.branches.push(ib);
        hasUpdates = true;
      }
    });

    // Merge any newly introduced initial subjects
    INITIAL_SUBJECTS.forEach((is) => {
      if (!parsed.subjects.some((s) => s.id === is.id || s.code === is.code)) {
        parsed.subjects.push(is);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load academic catalog', e);
    return INITIAL_CATALOG;
  }
}

/** Save academic catalog to persistent storage */
export function saveAcademicCatalog(catalog: AcademicCatalog): void {
  try {
    catalog.updatedAt = new Date().toISOString();
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch (e) {
    console.error('Failed to save academic catalog', e);
  }
}

/** Get list of Colleges */
export function getColleges(activeOnly: boolean = true): AcademicCollege[] {
  const catalog = getAcademicCatalog();
  return activeOnly ? catalog.colleges.filter((c) => c.isActive) : catalog.colleges;
}

/** Get list of Courses / Degrees */
export function getCourses(collegeId?: string, activeOnly: boolean = true): AcademicCourse[] {
  const catalog = getAcademicCatalog();
  let courses = activeOnly ? catalog.courses.filter((c) => c.isActive) : catalog.courses;
  if (collegeId && collegeId !== 'all') {
    const college = catalog.colleges.find((c) => c.id === collegeId);
    if (college && college.courseIds && college.courseIds.length > 0) {
      courses = courses.filter((c) => college.courseIds.includes(c.id));
    }
  }
  return courses;
}

/** Get list of Branches */
export function getBranches(courseId?: string, collegeId?: string, activeOnly: boolean = true): AcademicBranch[] {
  const catalog = getAcademicCatalog();
  let branches = activeOnly ? catalog.branches.filter((b) => b.isActive) : catalog.branches;

  if (courseId && courseId !== 'all') {
    branches = branches.filter((b) => b.courseId === courseId || b.courseId === 'all');
  }

  if (collegeId && collegeId !== 'all') {
    branches = branches.filter((b) => !b.collegeIds || b.collegeIds.length === 0 || b.collegeIds.includes(collegeId));
  }

  return branches;
}

/** Get list of Semesters for a Course */
export function getSemestersForCourse(courseId?: string): number[] {
  const catalog = getAcademicCatalog();
  if (courseId && courseId !== 'all') {
    const course = catalog.courses.find((c) => c.id === courseId);
    if (course) {
      return Array.from({ length: course.totalSemesters }, (_, i) => i + 1);
    }
  }
  return [1, 2, 3, 4, 5, 6, 7, 8];
}

/** Get Subjects with hierarchical filtering */
export function getSubjects(params?: {
  collegeId?: string;
  courseId?: string;
  branchId?: string;
  semester?: number;
  activeOnly?: boolean;
}): AcademicSubject[] {
  const catalog = getAcademicCatalog();
  let list = params?.activeOnly !== false ? catalog.subjects.filter((s) => s.isActive) : catalog.subjects;

  if (params?.collegeId && params.collegeId !== 'all') {
    list = list.filter((s) => !s.collegeId || s.collegeId === 'all' || s.collegeId === params.collegeId);
  }
  if (params?.courseId && params.courseId !== 'all') {
    list = list.filter((s) => s.courseId === params.courseId);
  }
  if (params?.branchId && params.branchId !== 'all') {
    list = list.filter((s) => s.branchId === params.branchId);
  }
  if (params?.semester) {
    list = list.filter((s) => s.semester === params.semester);
  }

  return list;
}

/** Get Units for a subject */
export function getUnitsForSubject(subjectIdOrName: string): string[] {
  const catalog = getAcademicCatalog();
  const found = catalog.subjects.find((s) => s.id === subjectIdOrName || s.name.toLowerCase() === subjectIdOrName.toLowerCase());
  if (found && found.units && found.units.length > 0) {
    return found.units;
  }
  return [
    'Unit 1: Introduction & Foundational Concepts',
    'Unit 2: Core Analysis & Problem Formulations',
    'Unit 3: Advanced Principles & Solved Models',
    'Unit 4: Applications & Practical Implementations',
    'Unit 5: Comprehensive Revision & Solved PYQs',
    'Complete Syllabus (Units 1 to 5)',
  ];
}

/** Get Academic Years list */
export function getAcademicYears(): string[] {
  const catalog = getAcademicCatalog();
  return catalog.academicYears || INITIAL_ACADEMIC_YEARS;
}

// -------------------------------------------------------------
// CRUD Operations for Admin Dashboard
// -------------------------------------------------------------

export function addCollege(college: Omit<AcademicCollege, 'id' | 'createdAt'>): AcademicCollege {
  const catalog = getAcademicCatalog();
  const newCol: AcademicCollege = {
    ...college,
    id: `col-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  catalog.colleges.push(newCol);
  saveAcademicCatalog(catalog);

  logSecurityEvent({
    action: 'college_created',
    category: 'catalog_management',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    targetType: 'catalog',
    targetId: newCol.id,
    targetLabel: `Institution: ${newCol.name} (${newCol.code})`,
    details: `Added new academic institution '${newCol.name}' located in ${newCol.location} affiliated with ${newCol.affiliatedUniversity}.`,
    metadata: {
      collegeName: newCol.name,
      code: newCol.code,
      university: newCol.affiliatedUniversity,
    },
  });

  return newCol;
}

export function updateCollege(collegeId: string, updates: Partial<AcademicCollege>): AcademicCollege | null {
  const catalog = getAcademicCatalog();
  const index = catalog.colleges.findIndex((c) => c.id === collegeId);
  if (index === -1) return null;
  catalog.colleges[index] = { ...catalog.colleges[index], ...updates };
  saveAcademicCatalog(catalog);
  return catalog.colleges[index];
}

export function deleteCollege(collegeId: string): boolean {
  const catalog = getAcademicCatalog();
  const target = catalog.colleges.find((c) => c.id === collegeId);
  catalog.colleges = catalog.colleges.filter((c) => c.id !== collegeId);
  // also cleanup branch mappings
  catalog.branches.forEach((b) => {
    b.collegeIds = b.collegeIds.filter((cid) => cid !== collegeId);
  });
  saveAcademicCatalog(catalog);

  if (target) {
    logSecurityEvent({
      action: 'college_deleted',
      category: 'catalog_management',
      severity: 'warning',
      performedBy: 'Raj Sambhaji Bhosale (Admin)',
      targetType: 'catalog',
      targetId: collegeId,
      targetLabel: `Institution: ${target.name}`,
      details: `Removed academic institution '${target.name}' from active catalog registry.`,
    });
  }

  return true;
}

export function toggleCollegeStatus(collegeId: string): boolean {
  const catalog = getAcademicCatalog();
  const col = catalog.colleges.find((c) => c.id === collegeId);
  if (!col) return false;
  col.isActive = !col.isActive;
  saveAcademicCatalog(catalog);
  return col.isActive;
}

export function addCourse(course: Omit<AcademicCourse, 'id'>): AcademicCourse {
  const catalog = getAcademicCatalog();
  const newCourse: AcademicCourse = {
    ...course,
    id: `course-${Date.now()}`,
  };
  catalog.courses.push(newCourse);
  saveAcademicCatalog(catalog);

  logSecurityEvent({
    action: 'course_created',
    category: 'catalog_management',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    targetType: 'catalog',
    targetId: newCourse.id,
    targetLabel: `Course: ${newCourse.name}`,
    details: `Created new qualification track '${newCourse.name}' under ${newCourse.category} (${newCourse.totalSemesters} semesters).`,
  });

  return newCourse;
}

export function updateCourse(courseId: string, updates: Partial<AcademicCourse>): AcademicCourse | null {
  const catalog = getAcademicCatalog();
  const index = catalog.courses.findIndex((c) => c.id === courseId);
  if (index === -1) return null;
  catalog.courses[index] = { ...catalog.courses[index], ...updates };
  saveAcademicCatalog(catalog);
  return catalog.courses[index];
}

export function deleteCourse(courseId: string): boolean {
  const catalog = getAcademicCatalog();
  catalog.courses = catalog.courses.filter((c) => c.id !== courseId);
  saveAcademicCatalog(catalog);
  return true;
}

export function toggleCourseStatus(courseId: string): boolean {
  const catalog = getAcademicCatalog();
  const course = catalog.courses.find((c) => c.id === courseId);
  if (!course) return false;
  course.isActive = !course.isActive;
  saveAcademicCatalog(catalog);
  return course.isActive;
}

export function addBranch(branch: Omit<AcademicBranch, 'id'>): AcademicBranch {
  const catalog = getAcademicCatalog();
  const newBranch: AcademicBranch = {
    ...branch,
    id: `branch-${Date.now()}`,
  };
  catalog.branches.push(newBranch);
  saveAcademicCatalog(catalog);

  logSecurityEvent({
    action: 'branch_created',
    category: 'catalog_management',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    targetType: 'catalog',
    targetId: newBranch.id,
    targetLabel: `Branch: ${newBranch.name} (${newBranch.code})`,
    details: `Added new academic branch '${newBranch.name}' (${newBranch.code}) to catalog.`,
  });

  return newBranch;
}

export function updateBranch(branchId: string, updates: Partial<AcademicBranch>): AcademicBranch | null {
  const catalog = getAcademicCatalog();
  const index = catalog.branches.findIndex((b) => b.id === branchId);
  if (index === -1) return null;
  catalog.branches[index] = { ...catalog.branches[index], ...updates };
  saveAcademicCatalog(catalog);
  return catalog.branches[index];
}

export function deleteBranch(branchId: string): boolean {
  const catalog = getAcademicCatalog();
  const target = catalog.branches.find((b) => b.id === branchId);
  catalog.branches = catalog.branches.filter((b) => b.id !== branchId);
  saveAcademicCatalog(catalog);

  if (target) {
    logSecurityEvent({
      action: 'branch_deleted',
      category: 'catalog_management',
      severity: 'warning',
      performedBy: 'Raj Sambhaji Bhosale (Admin)',
      targetType: 'catalog',
      targetId: branchId,
      targetLabel: `Branch: ${target.name}`,
      details: `Deleted academic branch '${target.name}' from catalog.`,
    });
  }

  return true;
}

export function toggleBranchStatus(branchId: string): boolean {
  const catalog = getAcademicCatalog();
  const branch = catalog.branches.find((b) => b.id === branchId);
  if (!branch) return false;
  branch.isActive = !branch.isActive;
  saveAcademicCatalog(catalog);
  return branch.isActive;
}

export function addSubject(subject: Omit<AcademicSubject, 'id'>): AcademicSubject {
  const catalog = getAcademicCatalog();
  const newSubj: AcademicSubject = {
    ...subject,
    id: `subj-${Date.now()}`,
  };
  catalog.subjects.push(newSubj);
  saveAcademicCatalog(catalog);

  logSecurityEvent({
    action: 'subject_created',
    category: 'catalog_management',
    severity: 'info',
    performedBy: 'Raj Sambhaji Bhosale (Admin)',
    targetType: 'catalog',
    targetId: newSubj.id,
    targetLabel: `Subject: ${newSubj.name} (${newSubj.code})`,
    details: `Added academic subject '${newSubj.name}' (${newSubj.code}) for Semester ${newSubj.semester} with ${newSubj.units.length} syllabus modules.`,
    metadata: {
      subject: newSubj.name,
      code: newSubj.code,
      semester: newSubj.semester,
      unitsCount: newSubj.units.length,
    },
  });

  return newSubj;
}

export function updateSubject(subjectId: string, updates: Partial<AcademicSubject>): AcademicSubject | null {
  const catalog = getAcademicCatalog();
  const index = catalog.subjects.findIndex((s) => s.id === subjectId);
  if (index === -1) return null;
  catalog.subjects[index] = { ...catalog.subjects[index], ...updates };
  saveAcademicCatalog(catalog);
  return catalog.subjects[index];
}

export function deleteSubject(subjectId: string): boolean {
  const catalog = getAcademicCatalog();
  const target = catalog.subjects.find((s) => s.id === subjectId);
  catalog.subjects = catalog.subjects.filter((s) => s.id !== subjectId);
  saveAcademicCatalog(catalog);

  if (target) {
    logSecurityEvent({
      action: 'subject_deleted',
      category: 'catalog_management',
      severity: 'warning',
      performedBy: 'Raj Sambhaji Bhosale (Admin)',
      targetType: 'catalog',
      targetId: subjectId,
      targetLabel: `Subject: ${target.name}`,
      details: `Deleted academic subject '${target.name}' from catalog.`,
    });
  }

  return true;
}

export function toggleSubjectStatus(subjectId: string): boolean {
  const catalog = getAcademicCatalog();
  const subj = catalog.subjects.find((s) => s.id === subjectId);
  if (!subj) return false;
  subj.isActive = !subj.isActive;
  saveAcademicCatalog(catalog);
  return subj.isActive;
}

export function addAcademicYear(year: string): void {
  const catalog = getAcademicCatalog();
  if (!catalog.academicYears.includes(year)) {
    catalog.academicYears.unshift(year);
    saveAcademicCatalog(catalog);
  }
}

export function resetCatalogToDefault(): void {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_CATALOG));
}
