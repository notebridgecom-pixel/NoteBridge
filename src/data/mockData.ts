import { NoteItem, User, PurchaseOrder, WithdrawalRequest, ContentReport } from '../types';

export const UNIVERSITIES = [
  'All Universities',
  'SPPU (Savitribai Phule Pune University)',
  'Mumbai University (MU)',
  'VTU (Visvesvaraya Technological University, Karnataka)',
  'AKTU (Dr. A.P.J. Abdul Kalam Technical University, UP)',
  'Anna University (Chennai)',
  'GGSIPU (IP University, Delhi)',
  'JNTU Hyderabad',
  'RGPV (Madhya Pradesh)',
  'MAKAUT (West Bengal)',
  'Delhi University (DU)',
];

export const DEGREES = [
  'All Streams',
  'Diploma',
  'B.Tech / B.E.',
  'BCA',
  'B.Sc Computer Science / IT',
  'M.Tech / M.E.',
  'MCA',
  'BBA / MBA',
];

export const BRANCHES = [
  'All Branches',
  'Electronics and Computer Engineering (ECE)',
  'Computer Engineering (CO / CMPN)',
  'Telecommunication Engineering (TE)',
  'Information Technology (IT / IF)',
  'Electronics & Telecommunication (EnTC / EXTC)',
  'Computer Science & Engg (CSE)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Electrical Engineering (EE)',
];

export const SEMESTERS = ['All Semesters', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

export const POPULAR_SUBJECTS = [
  { name: 'Electronics and Computer Engineering', icon: 'Cpu', color: 'from-blue-600 to-indigo-600', description: 'Microprocessors, Signals & Systems, Embedded Systems, IoT & VLSI', count: '130+ Notes' },
  { name: 'TE', icon: 'BookOpen', color: 'from-amber-500 to-rose-600', description: 'Third Year (TE) Core Syllabus, Sem 5 & 6 Notes, Question Banks', count: '120+ Notes' },
  { name: 'Engineering Mathematics', icon: 'Calculator', color: 'from-blue-500 to-indigo-600', description: 'Matrices, Calculus, Differential Eqns, Laplace', count: '240+ Notes' },
  { name: 'Microprocessors & Embedded Systems', icon: 'Cpu', color: 'from-purple-500 to-indigo-600', description: '8086, ARM Cortex, Peripheral Interfacing, ECE Solved PYQs', count: '85+ Notes' },
  { name: 'Data Structures & Algorithms', icon: 'Binary', color: 'from-emerald-500 to-teal-600', description: 'Trees, Graphs, Sorting, DP with C++ / Java', count: '190+ Notes' },
  { name: 'Engineering Mechanics', icon: 'Cpu', color: 'from-amber-500 to-orange-600', description: 'Statics, Dynamics, Trusses, Friction & Centroid', count: '140+ Notes' },
  { name: 'Digital Electronics & PYQs', icon: 'Zap', color: 'from-cyan-500 to-blue-600', description: 'K-Maps, Flip-Flops, Counters, Logic Gates', count: '160+ Notes' },
  { name: 'Operating Systems', icon: 'Layers', color: 'from-purple-500 to-pink-600', description: 'Process Scheduling, Deadlocks, Memory Mgmt', count: '110+ Notes' },
  { name: 'Database Management Systems', icon: 'Database', color: 'from-rose-500 to-red-600', description: 'SQL Queries, Normalization, ACID, Indexing', count: '135+ Notes' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-notebridge-official',
    name: 'NoteBridge Official Hub',
    email: 'notebridge.com@gmail.com',
    password: 'NoteBridge@2026',
    phone: '+91 85915 87848',
    college: 'NoteBridge Academic Network (HQ)',
    university: 'Mumbai University (MU)',
    degree: 'B.Tech / B.E.',
    branch: 'Electronics and Computer Engineering (ECE)',
    semester: 8,
    role: 'admin',
    isVerified: true,
    isVerifiedSenior: true,
    isEmailVerified: true,
    rating: 5.0,
    totalRatingsCount: 42,
    walletBalance: 2500,
    totalEarnings: 15400,
    createdAt: '2024-01-01',
  },
  {
    id: 'user-admin-primary',
    name: 'Raj Sambhaji Bhosale',
    email: 'rajbhosaletkd@gmail.com',
    password: 'Admin@123',
    phone: '+91 85915 87848',
    college: 'Vidyalankar Polytechnic / Engineering College',
    university: 'Mumbai University & MSBTE',
    degree: 'Central Administrator',
    branch: 'Administrative Operations',
    semester: 8,
    role: 'admin',
    isVerified: true,
    isEmailVerified: true,
    walletBalance: 0,
    totalEarnings: 0,
    createdAt: '2024-01-01',
  },
  {
    id: 'user-senior-1',
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@vit.edu.in',
    password: 'Senior@123',
    phone: '+91 98234 11223',
    college: 'Vidyalankar Engineering College',
    university: 'Mumbai University (MU)',
    degree: 'BE / B.Tech',
    branch: 'Computer Engineering',
    semester: 7,
    role: 'seller',
    isVerified: true,
    isVerifiedSenior: true,
    isEmailVerified: true,
    rating: 0,
    totalRatingsCount: 0,
    walletBalance: 0,
    totalEarnings: 0,
    createdAt: '2024-08-10',
  },
  {
    id: 'user-senior-2',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@vpt.edu.in',
    password: 'Senior@123',
    phone: '+91 97412 88990',
    college: 'Vidyalankar Polytechnic',
    university: 'MSBTE (Maharashtra State Board of Technical Education)',
    degree: 'Diploma',
    branch: 'Computer Engineering',
    semester: 6,
    role: 'seller',
    isVerified: true,
    isVerifiedSenior: true,
    isEmailVerified: true,
    rating: 0,
    totalRatingsCount: 0,
    walletBalance: 0,
    totalEarnings: 0,
    createdAt: '2024-09-02',
  },
  {
    id: 'user-buyer-1',
    name: 'Aarav Bhosale',
    email: 'aarav.bhosale@vit.edu.in',
    password: 'Student@123',
    phone: '+91 98765 43210',
    college: 'Vidyalankar Engineering College',
    university: 'Mumbai University (MU)',
    degree: 'BE / B.Tech',
    branch: 'Computer Engineering',
    semester: 3,
    role: 'buyer',
    isVerified: true,
    isEmailVerified: true,
    walletBalance: 0,
    totalEarnings: 0,
    createdAt: '2025-01-15',
  }
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Data Structures & Algorithms Complete Handwritten Notes',
    description: 'Crisp handwritten notes strictly mapped to Mumbai University (MU) & Vidyalankar Engineering College curriculum. Covers Arrays, Linked Lists, Trees (AVL, B-Tree), Graphs (Dijkstra, Kruskal), Dynamic Programming with dry-run diagrams and solved 10-mark University PYQs.',
    subject: 'Data Structures & Algorithms',
    subjectId: 'subj-dsa',
    university: 'Mumbai University (MU)',
    collegeName: 'Vidyalankar Engineering College',
    collegeId: 'col-vit',
    degree: 'BE / B.Tech',
    courseId: 'course-btech',
    branch: 'Computer Engineering',
    branchId: 'branch-btech-cmpn',
    semester: 3,
    unitsCovered: 'Unit 1 to 6 (Full Syllabus)',
    unitId: 'Complete Units (Unit 1 to 6 - Full Syllabus)',
    academicYear: '2024-2025',
    price: 49,
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Engineering College',
    sellerYear: '4th Year Finalist',
    totalPages: 48,
    fileSizeMb: 12.4,
    tags: ['MU 2024 Pattern', 'Solved PYQs', 'Clean Handwriting', 'Dry Runs', 'Trees & Graphs'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: true,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-10',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Introduction to Data Structures & Asymptotic Analysis',
        sections: [
          {
            heading: '1.1 Time & Space Complexity Big-O Hierarchy',
            body: 'Algorithm analysis measures resource growth rate relative to input size n. Master Theorem is frequently asked for 5 marks in SPPU Dec exams.',
            formula: 'T(n) = a T(n/b) + f(n)  ⇒  Case 1: If f(n) = O(n^{log_b a - ε}), T(n) = Θ(n^{log_b a})',
            pyqAlert: '★ SPPU Dec 2022 (5M): State Master Theorem & solve T(n) = 2T(n/2) + n',
            tips: 'Examiner tip: Always draw the recurrence tree diagram for full step marks!'
          },
          {
            heading: '1.2 Abstract Data Types (ADT) vs Data Structures',
            body: 'ADT specifies WHAT operations can be performed (e.g., Stack has push, pop, peek), while Data Structure specifies HOW it is implemented in memory (Array vs Linked List representation).'
          }
        ]
      },
      {
        pageNumber: 2,
        title: 'Unit 2: Linear Data Structures — Singly & Doubly Linked Lists',
        sections: [
          {
            heading: '2.1 Memory Representation & Node Structure',
            body: 'Dynamic allocation via struct Node { int data; struct Node* next; }. Eliminates continuous memory limitation of static arrays.',
            diagramDescription: '[Head Pointer] -> [Data: 10 | Next] -> [Data: 20 | Next] -> [Data: 30 | NULL]',
            pyqAlert: '★ SPPU In-Sem 2023 (6M): Write C function to reverse a Singly Linked List in-place with O(1) extra space.',
            tips: 'Remember to track three pointers: prev = NULL, current = head, next = NULL.'
          },
          {
            heading: '2.2 Circular Linked List vs Doubly Linked List',
            body: 'In Circular Doubly Linked List, head->prev = tail and tail->next = head. Crucial for operating system Round-Robin CPU scheduling queues.'
          }
        ]
      },
      {
        pageNumber: 3,
        title: 'Unit 3: Non-Linear Structures — AVL Trees & Rotations',
        sections: [
          {
            heading: '3.1 Balance Factor (BF) & Rotations',
            body: 'An AVL tree is a self-balancing BST where Balance Factor = Height(Left Subtree) - Height(Right Subtree) ∈ {-1, 0, 1}.',
            formula: 'Balance Factor (BF) = h_L - h_R. If |BF| > 1, perform LL, RR, LR, or RL rotation.',
            pyqAlert: '★ SPPU May 2023 (8M): Construct AVL tree by inserting: 14, 17, 11, 7, 53, 4, 13 with step-by-step tree diagrams.'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-2',
    title: 'Programming in C (PIC) MSBTE I-Scheme Master Notes',
    description: 'Complete MSBTE I-Scheme compliant notes for Vidyalankar Polytechnic students. Covers C syntax, arrays, pointer arithmetic, structures, file handling, and solved MSBTE model answer question papers with clean flowcharts.',
    subject: 'Programming in C (PIC)',
    subjectId: 'subj-diploma-cprog',
    university: 'MSBTE (Maharashtra State Board of Technical Education)',
    collegeName: 'Vidyalankar Polytechnic',
    collegeId: 'col-vpoly',
    degree: 'Diploma',
    courseId: 'course-diploma',
    branch: 'Computer Engineering',
    branchId: 'branch-diploma-co',
    semester: 2,
    unitsCovered: 'Unit 1 to 5 (Full MSBTE Syllabus)',
    unitId: 'Complete MSBTE I-Scheme Syllabus (Unit 1 to 5)',
    academicYear: '2024-2025',
    price: 39,
    sellerId: 'user-senior-2',
    sellerName: 'Sneha Kulkarni',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Polytechnic',
    sellerYear: '3rd Year Diploma Student',
    totalPages: 36,
    fileSizeMb: 9.8,
    tags: ['MSBTE I-Scheme', 'Pointers & Structs', 'Flowcharts', 'Model Answer Solved', 'Diploma High Yield'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: true,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-05',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Higher Order Linear Differential Equations with Constant Coeffs',
        sections: [
          {
            heading: '1.1 Complementary Function (CF) & Particular Integral (PI)',
            body: 'General solution is y = CF + PI. For auxiliary equation f(D) = 0 with real/distinct, repeated, or imaginary roots.',
            formula: 'PI = \\frac{1}{f(D)} X(x) \\quad | \\quad \\text{Short-cut method for } e^{ax}, \\sin(ax+b), x^m',
            pyqAlert: '★ MU May 2023 (6M): Solve (D^3 - 3D^2 + 4)y = e^{2x} + \\cos(2x)'
          }
        ]
      },
      {
        pageNumber: 2,
        title: 'Unit 2: Laplace Transforms & Inverse Laplace Formulas',
        sections: [
          {
            heading: '2.1 Standard Laplace Pairs Table',
            body: 'Comprehensive lookup formulas with First & Second Shifting Theorems.',
            formula: '\\mathcal{L}\\{e^{at}t^n\\} = \\frac{n!}{(s-a)^{n+1}}, \\quad \\mathcal{L}\\{\\sin(\\omega t)\\} = \\frac{\\omega}{s^2+\\omega^2}',
            tips: 'Tip: For periodic functions f(t) with period T, Laplace = \\frac{1}{1-e^{-sT}} \\int_0^T e^{-st}f(t)dt'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-3',
    title: 'Digital Electronics & Microprocessor PYQs (Unit 1–5)',
    description: 'Crisp, syllabus-aligned Digital Electronics notes. K-Map minimization (up to 5 variables), Quine-McCluskey, Multiplexers/Decoders, Synchronous Counters design with state diagrams and timing charts.',
    subject: 'Digital Electronics & PYQs',
    university: 'VTU (Visvesvaraya Technological University, Karnataka)',
    collegeName: 'RVCE Bengaluru',
    degree: 'B.Tech / B.E.',
    branch: 'Telecommunication Engineering (TE)',
    semester: 3,
    unitsCovered: 'Unit 1 to 5',
    academicYear: '2024-2025',
    price: 35,
    sellerId: 'user-senior-2',
    sellerName: 'Ananya Iyer',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'RV College of Engineering',
    sellerYear: '4th Year TE',
    totalPages: 42,
    fileSizeMb: 11.2,
    tags: ['VTU 21Scheme', 'K-Maps', 'Counters', 'Timing Diagrams', 'PYQ Solved'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: false,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-12',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Combinational Logic & Karnaugh Map Minimization',
        sections: [
          {
            heading: '1.1 SOP and POS Minimization with Don\'t Care Conditions',
            body: 'Gray code ordering on K-Map ensures single bit change between adjacent cells. Always prioritize forming octets > quads > pairs.',
            diagramDescription: '4-variable K-Map grid with grouping loops highlighted for Essential Prime Implicants.',
            pyqAlert: '★ VTU Jan 2023 (8M): Minimize f(A,B,C,D) = Σm(0,2,5,7,8,10,13,15) + d(3,11) using K-Map.'
          }
        ]
      },
      {
        pageNumber: 2,
        title: 'Unit 2: Sequential Circuits — Flip-Flop Conversions & Counters',
        sections: [
          {
            heading: '2.1 Master-Slave JK Flip Flop & Race Around Condition',
            body: 'Race around condition occurs in level-triggered JK flip-flop when J=1, K=1 and clock pulse width tp > propagation delay td.',
            formula: 'Condition to avoid: \\Delta t < t_w < T'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-4',
    title: 'Engineering Mechanics (Statics, Trusses & Friction) with Solved Numericals',
    description: 'First year Engineering Mechanics master notes. Lami\'s theorem, Varignon\'s theorem, Method of Joints for Trusses, Friction on Inclined Plane, Belt Friction, Centroid and Moment of Inertia for composite figures.',
    subject: 'Engineering Mechanics',
    university: 'AKTU (Dr. A.P.J. Abdul Kalam Technical University, UP)',
    collegeName: 'IET Lucknow',
    degree: 'B.Tech / B.E.',
    branch: 'Mechanical Engineering (ME)',
    semester: 1,
    unitsCovered: 'Unit 1 to 5 Complete',
    academicYear: '2024-2025',
    price: 29,
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'IET / PICT',
    sellerYear: 'Senior',
    totalPages: 32,
    fileSizeMb: 8.5,
    tags: ['First Year', 'Trusses', 'Free Body Diagrams', 'AKTU Solved', 'Numericals'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: false,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-08',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: System of Coplanar Concurrent Forces & Equilibrium',
        sections: [
          {
            heading: '1.1 Free Body Diagram (FBD) Rules & Lami\'s Theorem',
            body: 'Step 1: Isolate the body. Step 2: Show all active and reactive forces (Normal reactions perpendicular to surface).',
            formula: '\\frac{P}{\\sin\\alpha} = \\frac{Q}{\\sin\\beta} = \\frac{R}{\\sin\\gamma}',
            pyqAlert: '★ AKTU 2023 (7M): Sphere resting inside a smooth V-groove with angle 60°. Find reactions at contacts.'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-5',
    title: 'Operating Systems & System Calls Core Exam Notes',
    description: 'Concise review notes covering CPU scheduling (SJF, Round Robin), Synchronization (Semaphores, Producer-Consumer, Dining Philosophers), Deadlock (Banker\'s Algorithm), Paging, TLB, Virtual Memory, and Page Replacement Algorithms.',
    subject: 'Operating Systems',
    university: 'SPPU (Savitribai Phule Pune University)',
    collegeName: 'COEP Pune',
    degree: 'B.Tech / B.E.',
    branch: 'Information Technology (IT)',
    semester: 4,
    unitsCovered: 'Unit 1 to 5',
    academicYear: '2024-2025',
    price: 45,
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'COEP Pune',
    sellerYear: '4th Year Tech',
    totalPages: 40,
    fileSizeMb: 10.1,
    tags: ['Banker Algorithm', 'CPU Scheduling', 'Page Replacement', 'SPPU Sem 4'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: true,
    hasPYQ: true,
    hasHandwrittenFormulas: false,
    createdAt: '2025-01-14',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1 & 2: Process Management & CPU Scheduling Algorithms',
        sections: [
          {
            heading: '1.1 Gantt Chart & Scheduling Metrics',
            body: 'Waiting Time = Turnaround Time - Burst Time. Turnaround Time = Completion Time - Arrival Time.',
            formula: '\\text{TAT} = CT - AT, \\quad \\text{WT} = TAT - BT',
            pyqAlert: '★ SPPU May 2023 (10M): Given 5 processes with arrival times and burst times, calculate average WT for Preemptive SJF and Round Robin (q=2).'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-6',
    title: 'Database Management Systems (DBMS) SQL + Normalization Guide',
    description: 'Zero to hero notes for DBMS university theory & lab viva. ER to Relational schema mapping, Relational Algebra operators, 1NF to BCNF step-by-step algorithms, Transaction ACID properties, Two-Phase Locking (2PL), and B+ Tree indexing.',
    subject: 'Database Management Systems',
    university: 'Anna University (Chennai)',
    collegeName: 'CEG Anna University',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science & Engg (CSE)',
    semester: 4,
    unitsCovered: 'Unit 1 to 5 (Regulation 2021)',
    academicYear: '2024-2025',
    price: 39,
    sellerId: 'user-senior-2',
    sellerName: 'Ananya Iyer',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'CEG Anna University',
    sellerYear: 'Senior',
    totalPages: 38,
    fileSizeMb: 9.2,
    tags: ['BCNF Normalization', 'SQL Queries', '2PL & Concurrency', 'Anna Univ R2021'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: false,
    hasPYQ: true,
    hasHandwrittenFormulas: false,
    createdAt: '2025-01-16',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: ER Modeling & Relational Schema Mapping',
        sections: [
          {
            heading: '1.1 Entity-Relationship (ER) Notation',
            body: 'Mapping Weak Entity Sets: Primary key of weak entity is formed by combining the primary key of identifying owner entity + discriminator (partial key).',
            pyqAlert: '★ Anna Univ Nov 2023 (13M): Design ER diagram for Hospital Management System with multi-valued attributes and convert into relations.'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-7',
    title: 'Object Oriented Programming with Java (Semester 3)',
    description: 'Syllabus compliant handwritten summary. Classes, Polymorphism, Abstract classes vs Interfaces, Multi-threading lifecycle, Exception handling, Collections Framework (ArrayList, HashMap, HashSet).',
    subject: 'Object Oriented Programming',
    university: 'GGSIPU (IP University, Delhi)',
    collegeName: 'MAIT Delhi',
    degree: 'B.Tech / B.E.',
    branch: 'Information Technology (IT)',
    semester: 3,
    unitsCovered: 'Unit 1 to 4',
    academicYear: '2024-2025',
    price: 25,
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'PICT / IPU network',
    sellerYear: 'Senior',
    totalPages: 28,
    fileSizeMb: 7.1,
    tags: ['Java OOPs', 'IPU Delhi', 'Collections', 'Threading'],
    status: 'pending',
    adminFeedback: 'Please confirm all code snippets are original and not copied from coaching booklets.',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: false,
    hasPYQ: true,
    hasHandwrittenFormulas: false,
    createdAt: '2025-02-01',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Java OOP Principles & Memory Layout',
        sections: [
          {
            heading: '1.1 JVM, JRE, JDK & Classloading',
            body: 'Java is platform independent at bytecode (.class) level. Memory is segregated into Heap (objects) and Stack (method frames & local variables).'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-8',
    title: 'Signals and Systems Discrete & Continuous Notes',
    description: 'Detailed derivations and solved university questions. Fourier Transform, Z-Transform (ROC properties), Convolution integral, LTI system properties.',
    subject: 'Signals and Systems',
    university: 'JNTU Hyderabad',
    collegeName: 'CBIT Hyderabad',
    degree: 'B.Tech / B.E.',
    branch: 'Telecommunication Engineering (TE)',
    semester: 4,
    unitsCovered: 'Unit 1 to 5',
    academicYear: '2024-2025',
    price: 50,
    sellerId: 'user-senior-2',
    sellerName: 'Ananya Iyer',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'RVCE / JNTU',
    sellerYear: 'Senior',
    totalPages: 44,
    fileSizeMb: 11.5,
    tags: ['Z-Transform', 'ROC', 'Fourier', 'JNTUH R22'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: false,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-20',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Signals Classification & LTI Properties',
        sections: [
          {
            heading: '1.1 Continuous vs Discrete Time Signals',
            body: 'Energy signal condition: 0 < E < \\infty, P = 0. Power signal condition: 0 < P < \\infty, E = \\infty.',
            formula: 'E = \\int_{-\\infty}^{\\infty} |x(t)|^2 dt, \\quad P = \\lim_{T \\to \\infty} \\frac{1}{T} \\int_{-T/2}^{T/2} |x(t)|^2 dt'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-10',
    title: 'Diploma Applied Mathematics (MSBTE K-Scheme) Complete Notes & Solved Papers',
    description: 'Comprehensive handwritten guide tailored specifically for Polytechnic / Diploma engineering students. Covers Integration, Definite Integrals, Differential Equations, Probability & Statistics with step-by-step MSBTE model answer solutions.',
    subject: 'Engineering Mathematics',
    university: 'SPPU (Savitribai Phule Pune University)',
    collegeName: 'Government Polytechnic Pune',
    degree: 'Diploma',
    branch: 'Computer Science & Engg (CSE)',
    semester: 2,
    unitsCovered: 'Unit 1 to 5 (Full Syllabus)',
    academicYear: '2024-2025',
    price: 35,
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'GP Pune / PICT',
    sellerYear: 'Polytechnic Student',
    totalPages: 38,
    fileSizeMb: 9.2,
    tags: ['Diploma', 'MSBTE K-Scheme', 'Integration Tricks', 'Solved Model Papers', 'Formula Sheet'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: true,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-22',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Standard Integration Formulas & Substitution Method',
        sections: [
          {
            heading: '1.1 Integration by Parts (ILATE Rule)',
            body: 'Inverse, Logarithmic, Algebraic, Trigonometric, Exponential sequence for choosing u and v.',
            formula: '\\int u v \\, dx = u \\int v \\, dx - \\int \\left( \\frac{du}{dx} \\int v \\, dx \\right) dx',
            pyqAlert: '★ MSBTE Winter 2023 (6M): Evaluate \\int x \\sin(3x) \\, dx with complete steps.',
            tips: 'Examiner tip: Always write + C constant of integration on every step.'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-9',
    title: 'Diploma TE (Sem 5) Advanced Java Programming (AJP 22517) Complete MSBTE Notes',
    description: 'Third Year (TE) Polytechnic / Diploma engineering handwritten guide. Covers Abstract Window Toolkit (AWT), Swing, Event Handling, Database Connectivity (JDBC), Servlets and JSP with exam-ready MSBTE model answer code snippets.',
    subject: 'TE',
    university: 'Mumbai University (MU)',
    collegeName: 'Vidyalankar Polytechnic, Mumbai',
    degree: 'Diploma',
    branch: 'Computer Science & Engg (CSE)',
    semester: 5,
    unitsCovered: 'Unit 1 to 6 (Full TE Syllabus)',
    academicYear: '2024-2025',
    price: 39,
    sellerId: 'user-senior-1',
    sellerName: 'Pratham Patil',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Polytechnic / VIT',
    sellerYear: 'Diploma TE Student',
    totalPages: 44,
    fileSizeMb: 11.5,
    tags: ['Diploma TE', 'AJP 22517', 'Sem 5', 'MSBTE Model Answers', 'JDBC & Servlets'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: true,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-01-20',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: AWT & Swing Hierarchy with Event Delegation Model',
        sections: [
          {
            heading: '1.1 Event Delegation Architecture in Java',
            body: 'Event Source generates Event object and sends to registered Event Listener interface via addActionListener().',
            formula: 'public void actionPerformed(ActionEvent e) { String cmd = e.getActionCommand(); }',
            pyqAlert: '★ MSBTE Summer 2024 (6M): Explain Event Delegation Model with neat architecture diagram.',
            tips: 'Examiner tip: Always draw Source -> Event Object -> Listener block flow chart.'
          }
        ]
      }
    ],
    reviews: []
  },
  {
    id: 'note-11',
    title: 'Microprocessors, Microcontrollers & ARM Architecture Notes with Solved PYQs',
    description: 'Comprehensive handwritten guide tailored for Electronics and Computer Engineering (ECE) students. Covers 8086 architecture, pin diagrams, memory & peripheral interfacing (8255, 8254), ARM Cortex-M instruction sets, and University PYQ solutions.',
    subject: 'Microprocessors & Microcontrollers (8086 & ARM)',
    subjectId: 'subj-btech-ece-mpmc',
    university: 'Mumbai University (MU)',
    collegeName: 'Vidyalankar Engineering College',
    collegeId: 'col-vit',
    degree: 'BE / B.Tech',
    courseId: 'course-btech',
    branch: 'Electronics and Computer Engineering',
    branchId: 'branch-btech-ece',
    semester: 4,
    unitsCovered: 'Unit 1 to 5 (Full Syllabus)',
    unitId: 'Complete Units (Unit 1 to 5 - Full Syllabus & Solved PYQs)',
    academicYear: '2024-2025',
    price: 49,
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    sellerRating: 0,
    sellerRatingsCount: 0,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Engineering College',
    sellerYear: 'Senior Author',
    totalPages: 42,
    fileSizeMb: 10.8,
    tags: ['ECE', 'Microprocessors', '8086', 'ARM Cortex', 'MU Solved Papers', 'Interfacing'],
    status: 'approved',
    salesCount: 0,
    rating: 0,
    reviewsCount: 0,
    featured: true,
    hasPYQ: true,
    hasHandwrittenFormulas: true,
    createdAt: '2025-02-10',
    samplePages: [
      {
        pageNumber: 1,
        title: 'Unit 1: 8086 Architecture & Register Organization',
        sections: [
          {
            heading: '1.1 Bus Interface Unit (BIU) & Execution Unit (EU)',
            body: '8086 has a 16-bit data bus and 20-bit address bus capable of addressing 1 MB of memory. Pipelining is achieved using a 6-byte prefetch instruction queue.',
            formula: '\\text{Physical Address} = (\\text{Segment Register} \\times 16) + \\text{Offset}',
            pyqAlert: '★ MU Winter 2023 (10M): Draw the architectural diagram of 8086 microprocessor and explain EU & BIU functions.',
            tips: 'Always draw the 6-byte instruction queue and ALU bus interface neatly.'
          }
        ]
      }
    ],
    reviews: []
  }
];

export const INITIAL_ORDERS: PurchaseOrder[] = [];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];

export const INITIAL_REPORTS: ContentReport[] = [];

