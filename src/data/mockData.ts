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
  { name: 'TE', icon: 'BookOpen', count: '165 notes', color: 'from-amber-500 to-rose-600', description: 'Third Year (TE) Core Syllabus, Sem 5 & 6 Notes, Question Banks' },
  { name: 'Engineering Mathematics', icon: 'Calculator', count: '142 notes', color: 'from-blue-500 to-indigo-600', description: 'Matrices, Calculus, Differential Eqns, Laplace' },
  { name: 'Data Structures & Algorithms', icon: 'Binary', count: '198 notes', color: 'from-emerald-500 to-teal-600', description: 'Trees, Graphs, Sorting, DP with C++ / Java' },
  { name: 'Engineering Mechanics', icon: 'Cpu', count: '87 notes', color: 'from-amber-500 to-orange-600', description: 'Statics, Dynamics, Trusses, Friction & Centroid' },
  { name: 'Digital Electronics & PYQs', icon: 'Zap', count: '115 notes', color: 'from-cyan-500 to-blue-600', description: 'K-Maps, Flip-Flops, Counters, Logic Gates' },
  { name: 'Operating Systems', icon: 'Layers', count: '94 notes', color: 'from-purple-500 to-pink-600', description: 'Process Scheduling, Deadlocks, Memory Mgmt' },
  { name: 'Database Management Systems', icon: 'Database', count: '130 notes', color: 'from-rose-500 to-red-600', description: 'SQL Queries, Normalization, ACID, Indexing' },
];

export const INITIAL_USERS: User[] = [
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
    walletBalance: 0,
    totalEarnings: 0,
    createdAt: '2024-01-01',
  },
  {
    id: 'user-anushka',
    name: 'Anushka',
    email: 'anushkka@gmail.com',
    password: '', // accepts entered password automatically
    phone: '+91 98765 43210',
    college: 'Mumbai University Campus',
    university: 'Mumbai University (MU)',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Engineering (CO / CMPN)',
    semester: 4,
    role: 'buyer',
    walletBalance: 0,
    totalEarnings: 0,
    createdAt: '2024-09-01',
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
    isVerifiedSenior: true,
    rating: 5.0,
    totalRatingsCount: 1,
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
    isVerifiedSenior: true,
    rating: 5.0,
    totalRatingsCount: 1,
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
    sellerRating: 4.9,
    sellerRatingsCount: 148,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Engineering College',
    sellerYear: '4th Year Finalist (9.6 CGPA)',
    totalPages: 48,
    fileSizeMb: 12.4,
    tags: ['MU 2024 Pattern', 'Solved PYQs', 'Clean Handwriting', 'Dry Runs', 'Trees & Graphs'],
    status: 'approved',
    salesCount: 172,
    rating: 4.9,
    reviewsCount: 38,
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
    reviews: [
      {
        id: 'rev-1',
        userId: 'u-101',
        userName: 'Pooja Patil',
        userCollege: 'DY Patil College of Engg, Pune',
        rating: 5,
        comment: 'Literally saved my In-Sem exams! The AVL tree rotation diagrams and SPPU PYQ solutions were identical to what came in my paper.',
        createdAt: '2025-01-18',
        verifiedPurchase: true
      },
      {
        id: 'rev-2',
        userId: 'u-102',
        userName: 'Sanket Kulkarni',
        userCollege: 'Sinhgad Institute, Pune',
        rating: 5,
        comment: 'Best ₹49 spent. The handwriting is super legible and the dry-run tables make graph algorithms very simple to grasp.',
        createdAt: '2025-01-22',
        verifiedPurchase: true
      }
    ]
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
    sellerRating: 4.8,
    sellerRatingsCount: 96,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Polytechnic',
    sellerYear: '3rd Year Diploma Topper',
    totalPages: 36,
    fileSizeMb: 9.8,
    tags: ['MSBTE I-Scheme', 'Pointers & Structs', 'Flowcharts', 'Model Answer Solved', 'Diploma High Yield'],
    status: 'approved',
    salesCount: 245,
    rating: 4.8,
    reviewsCount: 52,
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
    reviews: [
      {
        id: 'rev-3',
        userId: 'u-103',
        userName: 'Tanmay Mehta',
        userCollege: 'Thadomal Shahani Engg College, Mumbai',
        rating: 5,
        comment: 'Formulas are neatly summarized on page 1-3. Saved me 4 days of textbook grinding.',
        createdAt: '2025-01-20',
        verifiedPurchase: true
      }
    ]
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
    sellerRating: 4.8,
    sellerRatingsCount: 96,
    sellerVerified: true,
    sellerCollege: 'RV College of Engineering',
    sellerYear: '4th Year TE',
    totalPages: 42,
    fileSizeMb: 11.2,
    tags: ['VTU 21Scheme', 'K-Maps', 'Counters', 'Timing Diagrams', 'PYQ Solved'],
    status: 'approved',
    salesCount: 118,
    rating: 4.8,
    reviewsCount: 29,
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
    reviews: [
      {
        id: 'rev-4',
        userId: 'u-104',
        userName: 'Karthik Gowda',
        userCollege: 'BMS College of Engineering',
        rating: 5,
        comment: 'The counter design table method is so easy to follow. Directly got 10 marks in VTU external!',
        createdAt: '2025-01-25',
        verifiedPurchase: true
      }
    ]
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
    sellerRating: 4.9,
    sellerRatingsCount: 148,
    sellerVerified: true,
    sellerCollege: 'IET / PICT',
    sellerYear: 'Senior Mentor',
    totalPages: 32,
    fileSizeMb: 8.5,
    tags: ['First Year', 'Trusses', 'Free Body Diagrams', 'AKTU Solved', 'Numericals'],
    status: 'approved',
    salesCount: 89,
    rating: 4.7,
    reviewsCount: 19,
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
    sellerRating: 4.9,
    sellerRatingsCount: 148,
    sellerVerified: true,
    sellerCollege: 'COEP Pune',
    sellerYear: '4th Year Tech',
    totalPages: 40,
    fileSizeMb: 10.1,
    tags: ['Banker Algorithm', 'CPU Scheduling', 'Page Replacement', 'SPPU Sem 4'],
    status: 'approved',
    salesCount: 134,
    rating: 4.9,
    reviewsCount: 31,
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
    sellerRating: 4.8,
    sellerRatingsCount: 96,
    sellerVerified: true,
    sellerCollege: 'CEG Anna University',
    sellerYear: 'Senior Scholar',
    totalPages: 38,
    fileSizeMb: 9.2,
    tags: ['BCNF Normalization', 'SQL Queries', '2PL & Concurrency', 'Anna Univ R2021'],
    status: 'approved',
    salesCount: 92,
    rating: 4.8,
    reviewsCount: 22,
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
    sellerRating: 4.9,
    sellerRatingsCount: 148,
    sellerVerified: true,
    sellerCollege: 'PICT / IPU network',
    sellerYear: '4th Year Mentor',
    totalPages: 28,
    fileSizeMb: 7.1,
    tags: ['Java OOPs', 'IPU Delhi', 'Collections', 'Threading'],
    status: 'pending', // Pending review for admin demo
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
    sellerRating: 4.8,
    sellerRatingsCount: 96,
    sellerVerified: true,
    sellerCollege: 'RVCE / JNTU',
    sellerYear: 'Senior',
    totalPages: 44,
    fileSizeMb: 11.5,
    tags: ['Z-Transform', 'ROC', 'Fourier', 'JNTUH R22'],
    status: 'approved',
    salesCount: 41,
    rating: 4.6,
    reviewsCount: 11,
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
    sellerRating: 4.9,
    sellerRatingsCount: 148,
    sellerVerified: true,
    sellerCollege: 'GP Pune / PICT',
    sellerYear: 'Polytechnic Gold Medalist',
    totalPages: 38,
    fileSizeMb: 9.2,
    tags: ['Diploma', 'MSBTE K-Scheme', 'Integration Tricks', 'Solved Model Papers', 'Formula Sheet'],
    status: 'approved',
    salesCount: 88,
    rating: 4.9,
    reviewsCount: 24,
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
    reviews: [
      {
        id: 'rev-diploma-1',
        userId: 'u-108',
        userName: 'Aditya Shinde',
        userCollege: 'Government Polytechnic Mumbai',
        rating: 5,
        comment: 'Best notes for Diploma 2nd sem math! Formulas and MSBTE solved questions are super clear.',
        createdAt: '2025-01-26',
        verifiedPurchase: true
      }
    ]
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
    sellerRating: 5.0,
    sellerRatingsCount: 92,
    sellerVerified: true,
    sellerCollege: 'Vidyalankar Polytechnic / VIT',
    sellerYear: 'Diploma TE Topper',
    totalPages: 44,
    fileSizeMb: 11.5,
    tags: ['Diploma TE', 'AJP 22517', 'Sem 5', 'MSBTE Model Answers', 'JDBC & Servlets'],
    status: 'approved',
    salesCount: 114,
    rating: 5.0,
    reviewsCount: 38,
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
    reviews: [
      {
        id: 'rev-diploma-te-1',
        userId: 'u-109',
        userName: 'Sanket More',
        userCollege: 'Vidyalankar Polytechnic',
        rating: 5,
        comment: 'Helped me score 68/70 in AJP theory exam! Every MSBTE question is covered step by step.',
        createdAt: '2025-01-28',
        verifiedPurchase: true
      }
    ]
  }
];

const nowMs = Date.now();
const hourMs = 3600 * 1000;
const dayMs = 24 * hourMs;

export const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: 'ord-nb-001',
    orderNumber: 'NB-2025-88412',
    noteId: 'note-1',
    noteTitle: 'Data Structures & Algorithms Complete Handwritten Notes',
    subject: 'Data Structures & Algorithms',
    university: 'Mumbai University (MU)',
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    buyerId: 'user-admin-primary',
    buyerName: 'Raj Sambhaji Bhosale',
    buyerEmail: 'rajbhosaletkd@gmail.com',
    buyerPhone: '+91 98765 43210',
    amount: 49,
    sellerShare: 39,
    platformShare: 10,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-774920194812',
    status: 'completed',
    purchasedAt: new Date(nowMs - 2 * hourMs).toISOString(),
    verifiedAt: new Date(nowMs - 1.8 * hourMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: rajbhosaletkd@gmail.com • Order #NB-2025-88412 • NoteBridge Anti-Leak Protection',
    userRated: true,
  },
  {
    id: 'ord-nb-002',
    orderNumber: 'NB-2025-88415',
    noteId: 'note-3',
    noteTitle: 'Digital Electronics & Microprocessor PYQs (Unit 1–5)',
    subject: 'Digital Electronics & PYQs',
    university: 'Mumbai University (MU)',
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    buyerId: 'user-admin-primary',
    buyerName: 'Raj Sambhaji Bhosale',
    buyerEmail: 'rajbhosaletkd@gmail.com',
    buyerPhone: '+91 98765 43210',
    amount: 49,
    sellerShare: 39,
    platformShare: 10,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-884910293847',
    status: 'completed',
    purchasedAt: new Date(nowMs - 5 * hourMs).toISOString(),
    verifiedAt: new Date(nowMs - 4.8 * hourMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: rajbhosaletkd@gmail.com • Order #NB-2025-88415 • NoteBridge Anti-Leak Protection',
    userRated: true,
  },
  {
    id: 'ord-nb-003',
    orderNumber: 'NB-2025-89104',
    noteId: 'note-10',
    noteTitle: 'Diploma Applied Mathematics (MSBTE K-Scheme) Complete Notes & Solved Papers',
    subject: 'Engineering Mathematics',
    university: 'MSBTE (Maharashtra State Board of Technical Education)',
    sellerId: 'user-senior-2',
    sellerName: 'Sneha Kulkarni',
    buyerId: 'user-admin-primary',
    buyerName: 'Raj Sambhaji Bhosale',
    buyerEmail: 'rajbhosaletkd@gmail.com',
    buyerPhone: '+91 98765 43210',
    amount: 59,
    sellerShare: 47,
    platformShare: 12,
    paymentMethod: 'upi_id',
    upiTransactionId: 'UPI-992810394821',
    status: 'completed',
    purchasedAt: new Date(nowMs - 1 * dayMs).toISOString(),
    verifiedAt: new Date(nowMs - 0.95 * dayMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: rajbhosaletkd@gmail.com • Order #NB-2025-89104 • NoteBridge Anti-Leak Protection',
  },
  {
    id: 'ord-nb-004',
    orderNumber: 'NB-2025-90214',
    noteId: 'note-4',
    noteTitle: 'Digital Electronics & Logic Design (DELD) with Solved PYQs',
    subject: 'Digital Electronics & PYQs',
    university: 'SPPU (Savitribai Phule Pune University)',
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    buyerId: 'user-admin-primary',
    buyerName: 'Raj Sambhaji Bhosale',
    buyerEmail: 'rajbhosaletkd@gmail.com',
    buyerPhone: '+91 98765 43210',
    amount: 39,
    sellerShare: 31,
    platformShare: 8,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-110293847561',
    status: 'pending_verification',
    purchasedAt: new Date(nowMs - 3 * hourMs).toISOString(),
    watermarkText: 'Licensed to: rajbhosaletkd@gmail.com • Order #NB-2025-90214 • NoteBridge Anti-Leak Protection',
  },
  {
    id: 'ord-nb-005',
    orderNumber: 'NB-2025-77192',
    noteId: 'note-1',
    noteTitle: 'Data Structures & Algorithms Complete Handwritten Notes',
    subject: 'Data Structures & Algorithms',
    university: 'Mumbai University (MU)',
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    buyerId: 'user-buyer-1',
    buyerName: 'Aarav Bhosale',
    buyerEmail: 'aarav.bhosale@vit.edu.in',
    buyerPhone: '+91 98765 43210',
    amount: 49,
    sellerShare: 39,
    platformShare: 10,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-338291048291',
    status: 'completed',
    purchasedAt: new Date(nowMs - 6 * dayMs).toISOString(),
    verifiedAt: new Date(nowMs - 5.9 * dayMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: aarav.bhosale@vit.edu.in • Order #NB-2025-77192 • NoteBridge Anti-Leak Protection',
    userRated: true,
  },
  {
    id: 'ord-nb-006',
    orderNumber: 'NB-2025-77195',
    noteId: 'note-2',
    noteTitle: 'Operating Systems (OS) Complete Notes with Process & Memory Diagrams',
    subject: 'Operating Systems',
    university: 'Mumbai University (MU)',
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    buyerId: 'user-buyer-1',
    buyerName: 'Aarav Bhosale',
    buyerEmail: 'aarav.bhosale@vit.edu.in',
    buyerPhone: '+91 98765 43210',
    amount: 39,
    sellerShare: 31,
    platformShare: 8,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-449201948271',
    status: 'completed',
    purchasedAt: new Date(nowMs - 14 * dayMs).toISOString(),
    verifiedAt: new Date(nowMs - 13.9 * dayMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: aarav.bhosale@vit.edu.in • Order #NB-2025-77195 • NoteBridge Anti-Leak Protection',
  },
  {
    id: 'ord-nb-007',
    orderNumber: 'NB-2025-77201',
    noteId: 'note-9',
    noteTitle: 'Advanced Java Programming (AJP - MSBTE Diploma 5th Sem) Complete Model Answers',
    subject: 'Advanced Java Programming',
    university: 'MSBTE (Maharashtra State Board of Technical Education)',
    sellerId: 'user-senior-2',
    sellerName: 'Sneha Kulkarni',
    buyerId: 'user-buyer-1',
    buyerName: 'Aarav Bhosale',
    buyerEmail: 'aarav.bhosale@vit.edu.in',
    buyerPhone: '+91 98765 43210',
    amount: 49,
    sellerShare: 39,
    platformShare: 10,
    paymentMethod: 'upi_id',
    upiTransactionId: 'UPI-558291049281',
    status: 'completed',
    purchasedAt: new Date(nowMs - 22 * dayMs).toISOString(),
    verifiedAt: new Date(nowMs - 21.9 * dayMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: aarav.bhosale@vit.edu.in • Order #NB-2025-77201 • NoteBridge Anti-Leak Protection',
  },
  {
    id: 'ord-nb-008',
    orderNumber: 'NB-2025-77209',
    noteId: 'note-6',
    noteTitle: 'Computer Networks & Cloud Computing Protocols Handbook',
    subject: 'Computer Networks',
    university: 'Anna University (Chennai)',
    sellerId: 'user-senior-1',
    sellerName: 'Rohan Deshmukh',
    buyerId: 'user-buyer-1',
    buyerName: 'Aarav Bhosale',
    buyerEmail: 'aarav.bhosale@vit.edu.in',
    buyerPhone: '+91 98765 43210',
    amount: 49,
    sellerShare: 39,
    platformShare: 10,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-668291048291',
    status: 'completed',
    purchasedAt: new Date(nowMs - 55 * dayMs).toISOString(),
    verifiedAt: new Date(nowMs - 54.9 * dayMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: aarav.bhosale@vit.edu.in • Order #NB-2025-77209 • NoteBridge Anti-Leak Protection',
  },
  {
    id: 'ord-nb-009',
    orderNumber: 'NB-2025-77215',
    noteId: 'note-3',
    noteTitle: 'Digital Electronics & Microprocessor PYQs (Unit 1–5)',
    subject: 'Digital Electronics & PYQs',
    university: 'VTU (Visvesvaraya Technological University, Karnataka)',
    sellerId: 'user-senior-2',
    sellerName: 'Ananya Iyer',
    buyerId: 'user-buyer-1',
    buyerName: 'Aarav Bhosale',
    buyerEmail: 'aarav.bhosale@vit.edu.in',
    buyerPhone: '+91 98765 43210',
    amount: 35,
    sellerShare: 28,
    platformShare: 7,
    paymentMethod: 'upi_qr',
    upiTransactionId: 'UPI-994019284716',
    status: 'completed',
    purchasedAt: new Date(nowMs - 120 * dayMs).toISOString(),
    verifiedAt: new Date(nowMs - 119.9 * dayMs).toISOString(),
    verifiedBy: 'Raj Sambhaji Bhosale (Central Admin)',
    watermarkText: 'Licensed to: aarav.bhosale@vit.edu.in • Order #NB-2025-77215 • NoteBridge Anti-Leak Protection',
  },
];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];

export const INITIAL_REPORTS: ContentReport[] = [];

