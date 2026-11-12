/**
 * ============================================================================
 * KNOWLEDGE KINGDOM: ACADEMIC REALM SYSTEM & THEMATIC PROGRESSION
 * Module: src/lib/realms/academicRealms.ts
 *
 * Balance: 80% Premium Modern Academic LMS + 20% Fantasy RPG/Arcade Inspiration
 * Standards: ABET / ACM-IEEE Computer Science Curriculum Mappings (CS-201 to CS-302)
 * Levels: Exactly 7 progressive tiers per realm with 12 questions per attempt
 * Passing Threshold: 9/12 (75%)
 * Timed Hints: Available at <= 15s remaining for Levels 1-6; strictly disabled on Level 7
 * ============================================================================
 */

export type BloomTaxonomyLevel =
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE"
  | "CREATE";

export type LevelDifficulty =
  | "INTRODUCTORY"
  | "FOUNDATIONAL"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT"
  | "MASTERY"
  | "CRUCIBLE";

export type CourseCode =
  | "CS-201"
  | "CS-202"
  | "CS-203"
  | "CS-204"
  | "CS-301"
  | "CS-302";

export type SubjectSlug =
  | "data-structures-and-algorithms"
  | "database-management-systems"
  | "operating-systems"
  | "computer-networks"
  | "ai-and-machine-learning"
  | "web-dev-and-devops";

export type RealmSlug =
  | "algorithmic-citadel"
  | "relational-vault"
  | "kernel-keep"
  | "network-nexus"
  | "neural-sanctum"
  | "cloud-spire-bastion";

export type LevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RealmThemeTokens {
  primaryColor: string;       // Primary HEX brand color
  secondaryColor: string;     // Complementary lighter HEX
  darkAccent: string;         // Deep tint HEX (e.g. 950 shade)
  darkerBg: string;           // Dark background canvas HEX
  accentRgb: string;          // Comma-separated RGB for CSS inline styles: "r, g, b"
  borderClass: string;        // Default border Tailwind class
  borderActiveClass: string;  // Active/focused border with glow
  bgLightClass: string;       // Subtle tint background (10% opacity)
  bgMediumClass: string;      // Medium card background (40% opacity)
  bgDarkClass: string;        // Deep solid card background (80% opacity)
  textPrimaryClass: string;   // High-contrast primary accent text
  textSecondaryClass: string; // Subtle secondary accent text
  textMutedClass: string;     // Muted accent text
  glowClass: string;          // Ambient shadow glow class
  glowStrongClass: string;    // Intense shadow glow class
  gradientBg: string;         // Card backdrop linear gradient class
  gradientBorder: string;     // Border gradient class
  badgeClass: string;         // Academic pill/badge styling
  progressBarClass: string;   // Progress bar fill class
  iconName: string;           // Canonical Lucide icon identifier
  secondaryIconName: string;  // Supporting Lucide icon identifier
}

export interface AcademicRealmLevel {
  levelNumber: LevelNumber;
  name: string;
  rpgTitle: string;
  description: string;
  academicTopics: string[];
  bloomsTaxonomy: BloomTaxonomyLevel;
  difficulty: LevelDifficulty;
  questionCount: 12;
  totalQuestions: 12;
  passingScoreThreshold: 9;
  passingThreshold: 9;
  passingPercentage: 75;
  timeLimitPerQuestionSeconds: 35;
  timeLimitSeconds: 35;
  hintsAvailable: boolean;
  hintUnlockSeconds: number | null; // 15 for Levels 1-6; null for Level 7
  xpReward: number;
  isBossLevel: boolean;
}

export interface AcademicRealm {
  id: SubjectSlug;
  slug: SubjectSlug;
  realmSlug: RealmSlug;
  courseCode: CourseCode;
  name: string;
  academicTitle: string;
  realmTitle: string;
  legacyTerritoryName: string;
  academicDomain: string;
  rpgFlavor: string;
  accentColor: string;
  icon: string;
  description: string;
  theme: RealmThemeTokens;
  levels: [
    AcademicRealmLevel,
    AcademicRealmLevel,
    AcademicRealmLevel,
    AcademicRealmLevel,
    AcademicRealmLevel,
    AcademicRealmLevel,
    AcademicRealmLevel
  ];
  totalQuestionsPerAttempt: 12;
  passingThresholdScore: 9;
  passingThresholdPercentage: 75;
  totalLevels: 7;
}

// ============================================================================
// REALM 1: Algorithmic Citadel (CS-201)
// ============================================================================
const ALGORITHMIC_CITADEL: AcademicRealm = {
  id: "data-structures-and-algorithms",
  slug: "data-structures-and-algorithms",
  realmSlug: "algorithmic-citadel",
  courseCode: "CS-201",
  academicTitle: "Data Structures & Algorithms",
    name: "Algorithmic Citadel",
  realmTitle: "Algorithmic Citadel",
  legacyTerritoryName: "The Citadel of Algorithms",
  academicDomain: "CS-201: Trees, Graphs, Sorting, Dynamic Programming, O(n) Complexity",
  rpgFlavor: "Gates of Recursion, Citadel Spires",
  accentColor: "#de1659",
  icon: "GitFork",
  description:
    "Master contiguous memory layouts, balance factors, dynamic programming state spaces, recursion trees, and asymptotic time bounds across 7 rigorous academic trials.",
  totalQuestionsPerAttempt: 12,
  passingThresholdScore: 9,
  passingThresholdPercentage: 75,
  totalLevels: 7,
  theme: {
    primaryColor: "#de1659",
    secondaryColor: "#fb7185",
    darkAccent: "#4c0519",
    darkerBg: "#1f020a",
    accentRgb: "222, 22, 89",
    borderClass: "border-rose-500/30 hover:border-rose-400/60",
    borderActiveClass: "border-rose-400 shadow-[0_0_15px_rgba(222,22,89,0.35)]",
    bgLightClass: "bg-rose-500/10",
    bgMediumClass: "bg-rose-950/40",
    bgDarkClass: "bg-rose-950/80",
    textPrimaryClass: "text-rose-400",
    textSecondaryClass: "text-rose-300",
    textMutedClass: "text-rose-400/60",
    glowClass: "shadow-[0_0_25px_rgba(222,22,89,0.25)]",
    glowStrongClass: "shadow-[0_0_35px_rgba(222,22,89,0.45)]",
    gradientBg: "bg-gradient-to-br from-rose-950/30 via-black to-zinc-950",
    gradientBorder: "from-rose-500/40 via-pink-500/20 to-transparent",
    badgeClass: "bg-rose-950/80 border border-rose-500/40 text-rose-300",
    progressBarClass: "bg-rose-500",
    iconName: "GitFork",
    secondaryIconName: "Target",
  },
  levels: [
    {
      levelNumber: 1,
      name: "Foundations: Complexity & Linear Sequences",
      rpgTitle: "The Outer Portcullis",
      description:
        "Rigorous asymptotic notations (Big-O, Omega, Theta), contiguous array memory layouts, pointer indexing, and basic sequential searching bounds.",
      academicTopics: [
        "Asymptotic Complexity (Big-O, Omega, Theta)",
        "Contiguous Memory Allocation & Array Indexing",
        "Linear vs Binary Search Time Tradeoffs",
        "Stack LIFO & Queue FIFO Invariants",
        "Worst-case vs Average-case Analysis",
      ],
      bloomsTaxonomy: "REMEMBER",
      difficulty: "INTRODUCTORY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 100,
      isBossLevel: false,
    },
    {
      levelNumber: 2,
      name: "Core Operations: Linked Spans & Priority Heaps",
      rpgTitle: "The Hall of Linked Spans",
      description:
        "Pointer-based linked structures, dynamic node allocation, sentinel node management, circular buffers, and complete binary heaps.",
      academicTopics: [
        "Singly and Doubly Linked List Pointer Mutations",
        "Circular Queues and Ring Buffers",
        "Min-Heap and Max-Heap Structural Invariants",
        "Heapify, Sift-Up and Sift-Down Operations",
        "O(log n) Priority Queue Extract-Min Mechanics",
      ],
      bloomsTaxonomy: "UNDERSTAND",
      difficulty: "FOUNDATIONAL",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 150,
      isBossLevel: false,
    },
    {
      levelNumber: 3,
      name: "Intermediate Constructs: Binary Search Trees",
      rpgTitle: "The Grove of Invariants",
      description:
        "Hierarchical tree structures, Binary Search Tree key ordering invariants, recursive tree walks, and level-order queue traversals.",
      academicTopics: [
        "Binary Search Tree Ordering Invariant (Left < Node <= Right)",
        "Inorder, Preorder, and Postorder Traversals",
        "Breadth-First Level-Order Traversal with Queues",
        "BST Search, Insertion, and Deletion with Successor Replacement",
        "Tree Height, Node Depth, and Path Length Calculation",
      ],
      bloomsTaxonomy: "APPLY",
      difficulty: "INTERMEDIATE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 200,
      isBossLevel: false,
    },
    {
      levelNumber: 4,
      name: "Advanced Structures: Balanced Trees & Graph Spaces",
      rpgTitle: "Spire of the Balanced Canopy",
      description:
        "Self-balancing search tree guarantees, tree rotation mechanics, balance factors, and topological graph representations.",
      academicTopics: [
        "AVL Tree Height Balancing & Balance Factor Invariants (-1, 0, +1)",
        "Single and Double Rotations (LL, RR, LR, RL)",
        "Red-Black Tree Color Invariants and Black-Height",
        "Graph Representations: Adjacency Matrix vs Adjacency List",
        "Graph Density, Vertex Degrees, and Directed vs Undirected Graphs",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "ADVANCED",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 250,
      isBossLevel: false,
    },
    {
      levelNumber: 5,
      name: "Asymptotic Optimization: Graph Search & Shortest Paths",
      rpgTitle: "Catacombs of Dijkstra",
      description:
        "Systematic state exploration, cycle detection in directed graphs, topological ordering, and greedy single-source shortest path optimization.",
      academicTopics: [
        "Breadth-First Search (BFS) for Shortest Unweighted Paths",
        "Depth-First Search (DFS) Discovery & Finish Timestamps",
        "Cycle Detection in Directed and Undirected Graphs",
        "Topological Sorting in Directed Acyclic Graphs (DAGs)",
        "Dijkstra's Algorithm with Min-Priority Queues & Relaxations",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "EXPERT",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 300,
      isBossLevel: false,
    },
    {
      levelNumber: 6,
      name: "System Synthesis: Dynamic Programming & Greedy Logic",
      rpgTitle: "Sanctum of Optimal Substructures",
      description:
        "Optimal substructure decomposition, memoized recursive call trees, bottom-up iterative tabulation, and divide-and-conquer recurrences.",
      academicTopics: [
        "Optimal Substructure and Overlapping Subproblems Properties",
        "Memoization (Top-Down) vs Tabulation (Bottom-Up)",
        "0/1 Knapsack Dynamic Programming Recurrence",
        "Longest Common Subsequence (LCS) State Matrix",
        "Divide-and-Conquer Recurrence Solutions via Master Theorem",
      ],
      bloomsTaxonomy: "EVALUATE",
      difficulty: "MASTERY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 400,
      isBossLevel: false,
    },
    {
      levelNumber: 7,
      name: "Grand Mastery Crucible: Asymptotic Supremacy",
      rpgTitle: "Crucible of the Grand Arch-Algorithmist",
      description:
        "Capstone crucible testing amortized bounds, network flows, minimum spanning forest synthesis, and computational intractability without hints.",
      academicTopics: [
        "Amortized Complexity Analysis (Aggregate, Accounting, Potential)",
        "Minimum Spanning Trees: Kruskal with Disjoint Set Union vs Prim",
        "Max-Flow Min-Cut Theorem (Ford-Fulkerson & Edmonds-Karp)",
        "Complexity Classes P, NP, NP-Complete, and NP-Hard",
        "Polynomial-Time Reductions (3-SAT, Vertex Cover, Clique)",
      ],
      bloomsTaxonomy: "CREATE",
      difficulty: "CRUCIBLE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: false,
      hintUnlockSeconds: null,
      xpReward: 600,
      isBossLevel: true,
    },
  ],
};

// ============================================================================
// REALM 2: Relational Vault (CS-202)
// ============================================================================
const RELATIONAL_VAULT: AcademicRealm = {
  id: "database-management-systems",
  slug: "database-management-systems",
  realmSlug: "relational-vault",
  courseCode: "CS-202",
  academicTitle: "Database Management Systems",
    name: "Relational Vault",
  realmTitle: "Relational Vault",
  legacyTerritoryName: "The Vault of Relational Lore",
  academicDomain: "CS-202: Relational Calculus, Normalization (1NF-BCNF), ACID, Indexes, B+ Trees",
  rpgFlavor: "Vault of Lore, Query Crucible",
  accentColor: "#3b82f6",
  icon: "Database",
  description:
    "Descend into subterranean archives of relational algebra, functional dependency normalization, ACID invariants, B+ Tree physical indexes, and distributed consensus.",
  totalQuestionsPerAttempt: 12,
  passingThresholdScore: 9,
  passingThresholdPercentage: 75,
  totalLevels: 7,
  theme: {
    primaryColor: "#3b82f6",
    secondaryColor: "#60a5fa",
    darkAccent: "#172554",
    darkerBg: "#0a1329",
    accentRgb: "59, 130, 246",
    borderClass: "border-blue-500/30 hover:border-blue-400/60",
    borderActiveClass: "border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.35)]",
    bgLightClass: "bg-blue-500/10",
    bgMediumClass: "bg-blue-950/40",
    bgDarkClass: "bg-blue-950/80",
    textPrimaryClass: "text-blue-400",
    textSecondaryClass: "text-blue-300",
    textMutedClass: "text-blue-400/60",
    glowClass: "shadow-[0_0_25px_rgba(59,130,246,0.25)]",
    glowStrongClass: "shadow-[0_0_35px_rgba(59,130,246,0.45)]",
    gradientBg: "bg-gradient-to-br from-blue-950/30 via-black to-zinc-950",
    gradientBorder: "from-blue-500/40 via-sky-500/20 to-transparent",
    badgeClass: "bg-blue-950/80 border border-blue-500/40 text-blue-300",
    progressBarClass: "bg-blue-500",
    iconName: "Database",
    secondaryIconName: "Key",
  },
  levels: [
    {
      levelNumber: 1,
      name: "Foundations: Entities, Keys & Schemas",
      rpgTitle: "The Gateway of Schemas",
      description:
        "Relational model foundations, domain integrity, superkeys, candidate keys, primary keys, and foreign key referential integrity.",
      academicTopics: [
        "Relational Model Domains, Tuples, and Relations",
        "Candidate Keys, Superkeys, and Primary Key Invariants",
        "Foreign Key Referential Integrity Constraints",
        "Entity Integrity (NOT NULL & Uniqueness Rules)",
        "Entity-Relationship (ER) to Relational Mapping",
      ],
      bloomsTaxonomy: "REMEMBER",
      difficulty: "INTRODUCTORY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 100,
      isBossLevel: false,
    },
    {
      levelNumber: 2,
      name: "Core Operations: Relational Algebra & SQL",
      rpgTitle: "Chamber of Projections",
      description:
        "Formal relational algebra operations, declarative SQL transformations, set operations, join conditions, and aggregate grouping.",
      academicTopics: [
        "Relational Algebra Operators (Select, Project, Cartesian Product)",
        "Natural Join, Theta Join, and Outer Joins (Left, Right, Full)",
        "SQL DDL (CREATE, ALTER) vs DML (SELECT, UPDATE, DELETE)",
        "Aggregations: COUNT, SUM, AVG with GROUP BY and HAVING Clauses",
        "Correlated vs Uncorrelated Subqueries",
      ],
      bloomsTaxonomy: "UNDERSTAND",
      difficulty: "FOUNDATIONAL",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 150,
      isBossLevel: false,
    },
    {
      levelNumber: 3,
      name: "Intermediate Constructs: Normal Forms (1NF–BCNF)",
      rpgTitle: "Crypt of Canonical Normalization",
      description:
        "Functional dependency theory, Armstrong's axioms, attribute closure computation, lossless decomposition, and normalization tiers.",
      academicTopics: [
        "Functional Dependencies (X -> Y) & Armstrong's Axioms",
        "Attribute Closure Algorithm & Minimal Canonical Cover",
        "First Normal Form (1NF: Atomic Attribute Domains)",
        "Second Normal Form (2NF: Elimination of Partial Dependencies)",
        "3NF and Boyce-Codd Normal Form (BCNF: Determinant is Superkey)",
      ],
      bloomsTaxonomy: "APPLY",
      difficulty: "INTERMEDIATE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 200,
      isBossLevel: false,
    },
    {
      levelNumber: 4,
      name: "Advanced Mechanics: ACID & Transaction States",
      rpgTitle: "Pillar of Atomic Invariants",
      description:
        "Transaction lifecycle states, ACID guarantees, Write-Ahead Logging (WAL), checkpointing, and database crash recovery protocols.",
      academicTopics: [
        "Transaction States: Active, Partially Committed, Committed, Failed, Aborted",
        "ACID Properties: Atomicity, Consistency, Isolation, Durability",
        "Write-Ahead Logging (WAL) Protocol & Steal/No-Force Policies",
        "ARIES Crash Recovery: Analysis, Redo, and Undo Passes",
        "Database Checkpoint Mechanics and Dirty Page Table",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "ADVANCED",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 250,
      isBossLevel: false,
    },
    {
      levelNumber: 5,
      name: "Asymptotic Optimization: Concurrency & Lock Protocols",
      rpgTitle: "Labyrinth of Concurrent Transactions",
      description:
        "Serializability theory, conflict serializability testing, ANSI SQL isolation levels, locking protocols, and multiversion concurrency control.",
      academicTopics: [
        "Conflict Serializability & Precedence (Serialization) Graphs",
        "ANSI SQL Isolation Levels (Read Committed, Repeatable Read, Serializable)",
        "Concurrency Anomalies: Dirty Reads, Non-Repeatable Reads, Phantom Reads",
        "Two-Phase Locking (2PL, Strict 2PL, Rigorous 2PL)",
        "Deadlock Prevention (Wait-Die vs Wound-Wait) and Detection Cycles",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "EXPERT",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 300,
      isBossLevel: false,
    },
    {
      levelNumber: 6,
      name: "System Synthesis: Indexing & Storage Engines",
      rpgTitle: "Vault of the B+ Tree Archives",
      description:
        "Slotted page architecture, clustered vs secondary indexing, B+ Tree node mechanics, disk block I/O cost estimation, and query execution plans.",
      academicTopics: [
        "Slotted-Page Architecture and Disk Page Layouts",
        "Clustered (Primary) vs Non-Clustered (Secondary) Indexes",
        "B+ Tree Mechanics: Fanout, Height, Node Splitting, and Merging",
        "Hash Indexing vs Tree Indexing for Range Queries",
        "Disk I/O Cost Models for Index Scans vs Full Table Scans",
      ],
      bloomsTaxonomy: "EVALUATE",
      difficulty: "MASTERY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 400,
      isBossLevel: false,
    },
    {
      levelNumber: 7,
      name: "Grand Mastery Crucible: Distributed Consensus & Optimization",
      rpgTitle: "Crucible of the Grand Query Archon",
      description:
        "Capstone trial covering relational query optimizer cost estimation, distributed commit protocols, Paxos consensus, and CAP theorem tradeoffs without hints.",
      academicTopics: [
        "Cost-Based Query Optimization & Dynamic Programming Join Ordering",
        "Two-Phase Commit (2PC) Protocol & Failure Recovery States",
        "Distributed Deadlock Detection & Global Wait-For Graphs",
        "CAP Theorem Tradeoffs (Consistency vs Availability under Partitions)",
        "Distributed Consensus Fundamentals (Paxos and Raft Leader Quorums)",
      ],
      bloomsTaxonomy: "CREATE",
      difficulty: "CRUCIBLE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: false,
      hintUnlockSeconds: null,
      xpReward: 600,
      isBossLevel: true,
    },
  ],
};

// ============================================================================
// REALM 3: Kernel Keep (CS-203)
// ============================================================================
const KERNEL_KEEP: AcademicRealm = {
  id: "operating-systems",
  slug: "operating-systems",
  realmSlug: "kernel-keep",
  courseCode: "CS-203",
  academicTitle: "Operating Systems",
    name: "Kernel Keep",
  realmTitle: "Kernel Keep",
  legacyTerritoryName: "The Core Kernel Fortress",
  academicDomain: "CS-203: Schedulers, Semaphores, Virtual Memory, Deadlocks, File Systems",
  rpgFlavor: "Core Kernel Keep, Thread Bastion",
  accentColor: "#8b5cf6",
  icon: "Cpu",
  description:
    "Defend the Ring-0 sanctuary: master dual-mode hardware boundaries, preemptive CPU schedulers, atomic synchronization primitives, virtual memory paging, and deadlock avoidance.",
  totalQuestionsPerAttempt: 12,
  passingThresholdScore: 9,
  passingThresholdPercentage: 75,
  totalLevels: 7,
  theme: {
    primaryColor: "#8b5cf6",
    secondaryColor: "#a78bfa",
    darkAccent: "#2e1065",
    darkerBg: "#14072b",
    accentRgb: "139, 92, 246",
    borderClass: "border-violet-500/30 hover:border-violet-400/60",
    borderActiveClass: "border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.35)]",
    bgLightClass: "bg-violet-500/10",
    bgMediumClass: "bg-violet-950/40",
    bgDarkClass: "bg-violet-950/80",
    textPrimaryClass: "text-violet-400",
    textSecondaryClass: "text-violet-300",
    textMutedClass: "text-violet-400/60",
    glowClass: "shadow-[0_0_25px_rgba(139,92,246,0.25)]",
    glowStrongClass: "shadow-[0_0_35px_rgba(139,92,246,0.45)]",
    gradientBg: "bg-gradient-to-br from-violet-950/30 via-black to-zinc-950",
    gradientBorder: "from-violet-500/40 via-purple-500/20 to-transparent",
    badgeClass: "bg-violet-950/80 border border-violet-500/40 text-violet-300",
    progressBarClass: "bg-violet-500",
    iconName: "Cpu",
    secondaryIconName: "Layers",
  },
  levels: [
    {
      levelNumber: 1,
      name: "Foundations: Ring-0 Boundaries & Processes",
      rpgTitle: "The Outer Ring-3 Moat",
      description:
        "Dual-mode CPU execution, hardware privilege rings, system call trap interrupts, and Process Control Block (PCB) memory structures.",
      academicTopics: [
        "User Mode (Ring 3) vs Kernel Mode (Ring 0) Privilege Rings",
        "Hardware Trap Interrupts and System Call Dispatching",
        "Process Control Block (PCB) Elements & Execution Context",
        "Process State Lifecycle: New, Ready, Running, Waiting, Terminated",
        "Context Switching Mechanics and CPU Register State Caching",
      ],
      bloomsTaxonomy: "REMEMBER",
      difficulty: "INTRODUCTORY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 100,
      isBossLevel: false,
    },
    {
      levelNumber: 2,
      name: "Core Operations: CPU Scheduling Algorithms",
      rpgTitle: "Bastion of the Clock Tick",
      description:
        "Preemptive vs non-preemptive thread scheduling, scheduling criteria calculations, time quantum tuning, and multilevel feedback queues.",
      academicTopics: [
        "Preemptive vs Non-Preemptive CPU Scheduling Mechanisms",
        "Scheduling Performance Criteria: Turnaround Time, Waiting Time, Response Time",
        "First-Come, First-Served (FCFS) and Convoy Effect",
        "Shortest Job First (SJF) and Shortest Remaining Time First (SRTF)",
        "Round Robin Time Quantum Selection & Multilevel Feedback Queues (MLFQ)",
      ],
      bloomsTaxonomy: "UNDERSTAND",
      difficulty: "FOUNDATIONAL",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 150,
      isBossLevel: false,
    },
    {
      levelNumber: 3,
      name: "Intermediate Constructs: Critical Sections & Locks",
      rpgTitle: "Chamber of the Critical Section",
      description:
        "Concurrency race conditions, mutual exclusion requirements, hardware atomic instructions, counting semaphores, and classic synchronization paradigms.",
      academicTopics: [
        "Race Conditions and the Critical Section Problem",
        "Criteria for Critical Section Solutions: Mutual Exclusion, Progress, Bounded Waiting",
        "Hardware Atomic Instructions (Test-and-Set, Compare-and-Swap)",
        "Counting vs Binary Semaphores (Wait/P and Signal/V Primitives)",
        "Classic Concurrency Problems: Bounded Buffer & Readers-Writers",
      ],
      bloomsTaxonomy: "APPLY",
      difficulty: "INTERMEDIATE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 200,
      isBossLevel: false,
    },
    {
      levelNumber: 4,
      name: "Advanced Systems: Deadlocks & Banker's Algorithm",
      rpgTitle: "Labyrinth of the Coffman Gridlock",
      description:
        "Formal Coffman deadlock conditions, Resource Allocation Graphs, safe vs unsafe state transitions, and Dijkstra's Banker's Algorithm.",
      academicTopics: [
        "The Four Coffman Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
        "Resource Allocation Graph (RAG) Analysis and Cycle Detection",
        "Deadlock Prevention: Eliminating Circular Wait via Resource Ordering",
        "Deadlock Avoidance: Dijkstra's Banker's Algorithm for Multi-Resource Safety",
        "Safe State Verification (Need <= Available Vector Testing)",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "ADVANCED",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 250,
      isBossLevel: false,
    },
    {
      levelNumber: 5,
      name: "Asymptotic Optimization: Paging & Memory Architecture",
      rpgTitle: "Spire of the Virtual Page Tables",
      description:
        "Virtual to physical address translation, hierarchical page tables, hardware TLB caching, and page fault interrupt processing.",
      academicTopics: [
        "Logical Address Space vs Physical Memory Frames",
        "Single-Level vs Hierarchical Multi-Level Page Tables",
        "Translation Lookaside Buffer (TLB) Hit Ratio and Effective Access Time (EAT)",
        "Hardware Page Fault Exception Handling and Interrupt Routine Cycle",
        "Inverted Page Tables and Hashed Page Table Architectures",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "EXPERT",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 300,
      isBossLevel: false,
    },
    {
      levelNumber: 6,
      name: "System Synthesis: Page Replacement & Disk I/O",
      rpgTitle: "Vault of the Belady Crucible",
      description:
        "Page eviction strategies, Belady's anomaly, thrashing dynamics, working set models, and secondary storage disk head scheduling.",
      academicTopics: [
        "Page Replacement Algorithms: FIFO, Optimal (MIN), LRU, and Clock/Second-Chance",
        "Belady's Anomaly Proof in Non-Stack Page Replacement Algorithms",
        "Thrashing Dynamics and the Working-Set Model of Program Locality",
        "Disk Head Scheduling Algorithms: FCFS, SSTF, SCAN, and C-SCAN",
        "File System Inodes, Direct/Indirect Pointers, and Directory Allocation",
      ],
      bloomsTaxonomy: "EVALUATE",
      difficulty: "MASTERY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 400,
      isBossLevel: false,
    },
    {
      levelNumber: 7,
      name: "Grand Mastery Crucible: Sovereign Kernel Architecture",
      rpgTitle: "Crucible of the Ring-0 Sentinel",
      description:
        "Capstone crucible on microkernel vs monolithic tradeoffs, Copy-on-Write memory, hardware virtualization hypervisors, and hard real-time scheduling without hints.",
      academicTopics: [
        "Monolithic Kernels vs Microkernels (IPC Message Passing Latencies)",
        "Copy-on-Write (CoW) Memory Virtualization in fork() and exec()",
        "Memory-Mapped File I/O (mmap) and Kernel Page Cache Integration",
        "Type-1 vs Type-2 Hypervisors and Hardware-Assisted Paging (EPT/NPT)",
        "Real-Time Scheduling: Earliest Deadline First (EDF) vs Rate Monotonic Scheduling (RMS)",
      ],
      bloomsTaxonomy: "CREATE",
      difficulty: "CRUCIBLE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: false,
      hintUnlockSeconds: null,
      xpReward: 600,
      isBossLevel: true,
    },
  ],
};

// ============================================================================
// REALM 4: Network Nexus (CS-204)
// ============================================================================
const NETWORK_NEXUS: AcademicRealm = {
  id: "computer-networks",
  slug: "computer-networks",
  realmSlug: "network-nexus",
  courseCode: "CS-204",
  academicTitle: "Computer Networks",
    name: "Network Nexus",
  realmTitle: "Network Nexus",
  legacyTerritoryName: "The Whispering Wirelands",
  academicDomain: "CS-204: OSI / TCP/IP, Congestion Control, Routing Algorithms, Subnetting",
  rpgFlavor: "Wirelands Nexus, Protocol Spire",
  accentColor: "#06b6d4",
  icon: "Network",
  description:
    "Traverse the Whispering Wirelands: master the 7-layer OSI and TCP/IP stacks, ARP, CIDR subnet math, Dijkstra link-state routing, TCP congestion windows, and TLS 1.3.",
  totalQuestionsPerAttempt: 12,
  passingThresholdScore: 9,
  passingThresholdPercentage: 75,
  totalLevels: 7,
  theme: {
    primaryColor: "#06b6d4",
    secondaryColor: "#22d3ee",
    darkAccent: "#083344",
    darkerBg: "#031720",
    accentRgb: "6, 182, 212",
    borderClass: "border-cyan-500/30 hover:border-cyan-400/60",
    borderActiveClass: "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]",
    bgLightClass: "bg-cyan-500/10",
    bgMediumClass: "bg-cyan-950/40",
    bgDarkClass: "bg-cyan-950/80",
    textPrimaryClass: "text-cyan-400",
    textSecondaryClass: "text-cyan-300",
    textMutedClass: "text-cyan-400/60",
    glowClass: "shadow-[0_0_25px_rgba(6,182,212,0.25)]",
    glowStrongClass: "shadow-[0_0_35px_rgba(6,182,212,0.45)]",
    gradientBg: "bg-gradient-to-br from-cyan-950/30 via-black to-zinc-950",
    gradientBorder: "from-cyan-500/40 via-teal-500/20 to-transparent",
    badgeClass: "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300",
    progressBarClass: "bg-cyan-500",
    iconName: "Network",
    secondaryIconName: "Globe",
  },
  levels: [
    {
      levelNumber: 1,
      name: "Foundations: OSI & TCP/IP Protocol Stacks",
      rpgTitle: "The Wireland Perimeter",
      description:
        "Layered network architectures, 7-layer OSI model functions, TCP/IP stack consolidation, Protocol Data Units (PDUs), and encapsulation headers.",
      academicTopics: [
        "ISO-OSI 7-Layer Reference Model vs TCP/IP 4-Layer Architecture",
        "Layer Responsibilities: Physical, Link, Network, Transport, Application",
        "Protocol Data Units: Bits, Frames, Packets, Segments, Messages",
        "PDU Encapsulation and Decapsulation Headers at Each Layer",
        "Transmission Metrics: Latency, Bandwidth, and Bandwidth-Delay Product (BDP)",
      ],
      bloomsTaxonomy: "REMEMBER",
      difficulty: "INTRODUCTORY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 100,
      isBossLevel: false,
    },
    {
      levelNumber: 2,
      name: "Core Operations: Framing, MAC & Switching",
      rpgTitle: "Bridge of MAC Topologies",
      description:
        "Data link framing, MAC hardware addressing, Address Resolution Protocol (ARP), CSMA/CD collision detection, and layer-2 Ethernet switching.",
      academicTopics: [
        "IEEE 802.3 Ethernet Frame Structure (Preamble, SFD, MACs, EtherType, CRC)",
        "Address Resolution Protocol (ARP) Broadcast Queries & Cache Poisoning",
        "CSMA/CD Collision Detection in Shared Ethernet Media",
        "Layer-2 Switch Learning, MAC Address Forwarding Tables, and Flooding",
        "Virtual LANs (VLANs) and IEEE 802.1Q Header Tagging",
      ],
      bloomsTaxonomy: "UNDERSTAND",
      difficulty: "FOUNDATIONAL",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 150,
      isBossLevel: false,
    },
    {
      levelNumber: 3,
      name: "Intermediate Constructs: IPv4, IPv6 & CIDR Routing",
      rpgTitle: "Spire of the CIDR Prefixes",
      description:
        "Network layer addressing, IPv4 dotted-decimal formatting, Classless Inter-Domain Routing (CIDR), variable-length subnet masks (VLSM), and ICMP.",
      academicTopics: [
        "IPv4 Header Format (TTL, Protocol, Checksum, Flags, Fragmentation)",
        "Classless Inter-Domain Routing (CIDR) Slash Notation (e.g., /24, /27)",
        "Subnet Calculations: Network Address, Broadcast Address, Usable Host Range",
        "IPv6 128-Bit Addressing Architecture and Address Compression Rules",
        "Internet Control Message Protocol (ICMP) Diagnostics: Echo, TTL Exceeded",
      ],
      bloomsTaxonomy: "APPLY",
      difficulty: "INTERMEDIATE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 200,
      isBossLevel: false,
    },
    {
      levelNumber: 4,
      name: "Advanced Systems: Intra-Domain Routing Protocols",
      rpgTitle: "Crossroads of the Shortest Paths",
      description:
        "Autonomous Systems, distance-vector routing algorithms, link-state routing algorithms, convergence properties, and OSPF hierarchical areas.",
      academicTopics: [
        "Autonomous Systems (AS) and Intra-Domain (IGP) vs Inter-Domain (EGP) Routing",
        "Distance-Vector Routing: Bellman-Ford, Count-to-Infinity, Split Horizon, Poison Reverse",
        "Link-State Routing: Dijkstra Shortest Path First (SPF) Algorithm",
        "Open Shortest Path First (OSPF): Link-State Advertisements (LSAs) and Area 0 Backbone",
        "Routing Information Protocol (RIP) Hop-Count Metric Limitations",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "ADVANCED",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 250,
      isBossLevel: false,
    },
    {
      levelNumber: 5,
      name: "Asymptotic Optimization: TCP Reliability & Flow Control",
      rpgTitle: "Sanctuary of the Synchronized Handshake",
      description:
        "Connection-oriented transport semantics, 3-way handshakes, sequence/ACK number arithmetic, sliding window flow control, and window probing.",
      academicTopics: [
        "Connection-Oriented TCP vs Connectionless Unreliable UDP Tradeoffs",
        "TCP 3-Way Handshake (SYN, SYN-ACK, ACK) and 4-Way FIN Teardown",
        "Sequence Numbers, Cumulative Acknowledgments, and Retransmission Timers",
        "Sliding Window Flow Control and Advertised Receive Window (rwnd)",
        "Zero-Window Probing and Silly Window Syndrome Prevention (Nagle's Algorithm)",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "EXPERT",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 300,
      isBossLevel: false,
    },
    {
      levelNumber: 6,
      name: "System Synthesis: TCP Congestion & BGP Routing",
      rpgTitle: "Spire of the Bottleneck Windows",
      description:
        "Congestion window dynamics, AIMD algorithms, packet loss recovery heuristics, and Border Gateway Protocol inter-domain routing policies.",
      academicTopics: [
        "Congestion Window (cwnd) vs Advertised Window (rwnd) Relationship",
        "TCP Slow Start and Slow Start Threshold (ssthresh) Doubling Dynamics",
        "Additive Increase Multiplicative Decrease (AIMD) Stability Invariant",
        "TCP Reno Fast Retransmit (Triple Duplicate ACKs) & Fast Recovery",
        "Border Gateway Protocol (BGP-4): Path Vector Routing, AS-PATH, and Peering Policies",
      ],
      bloomsTaxonomy: "EVALUATE",
      difficulty: "MASTERY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 400,
      isBossLevel: false,
    },
    {
      levelNumber: 7,
      name: "Grand Mastery Crucible: Global Network Architecture",
      rpgTitle: "Crucible of the Network Architect",
      description:
        "Capstone crucible on modern UDP-based transport, TLS 1.3 cryptographic handshakes, DNSSEC chain of trust, and Software-Defined Networking without hints.",
      academicTopics: [
        "QUIC Transport Protocol over UDP and HTTP/3 Stream Multiplexing",
        "Transport Layer Security (TLS 1.3): 1-RTT / 0-RTT Handshakes & Forward Secrecy",
        "Domain Name System Security Extensions (DNSSEC): RRSIG, DNSKEY, and Chain of Trust",
        "Software-Defined Networking (SDN): Control Plane vs Data Plane Decoupling",
        "OpenFlow Protocol Flow Tables and Network Virtualization Overlays (VXLAN)",
      ],
      bloomsTaxonomy: "CREATE",
      difficulty: "CRUCIBLE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: false,
      hintUnlockSeconds: null,
      xpReward: 600,
      isBossLevel: true,
    },
  ],
};

// ============================================================================
// REALM 5: Neural Sanctum (CS-301)
// ============================================================================
const NEURAL_SANCTUM: AcademicRealm = {
  id: "ai-and-machine-learning",
  slug: "ai-and-machine-learning",
  realmSlug: "neural-sanctum",
  courseCode: "CS-301",
  academicTitle: "Artificial Intelligence & Machine Learning",
    name: "Neural Sanctum",
  realmTitle: "Neural Sanctum",
  legacyTerritoryName: "The Neural Sanctum",
  academicDomain: "CS-301: Supervised ML, Gradient Descent, Transformers, Loss Functions, Metrics",
  rpgFlavor: "Tensor Tower, Latent Arena",
  accentColor: "#10b981",
  icon: "Brain",
  description:
    "Ascend the Tensor Tower: command loss gradients, convex optimization, deep backpropagation, self-attention matrices, and transformer generative architectures across 7 trials.",
  totalQuestionsPerAttempt: 12,
  passingThresholdScore: 9,
  passingThresholdPercentage: 75,
  totalLevels: 7,
  theme: {
    primaryColor: "#10b981",
    secondaryColor: "#34d399",
    darkAccent: "#022c22",
    darkerBg: "#011712",
    accentRgb: "16, 185, 129",
    borderClass: "border-emerald-500/30 hover:border-emerald-400/60",
    borderActiveClass: "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]",
    bgLightClass: "bg-emerald-500/10",
    bgMediumClass: "bg-emerald-950/40",
    bgDarkClass: "bg-emerald-950/80",
    textPrimaryClass: "text-emerald-400",
    textSecondaryClass: "text-emerald-300",
    textMutedClass: "text-emerald-400/60",
    glowClass: "shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    glowStrongClass: "shadow-[0_0_35px_rgba(16,185,129,0.45)]",
    gradientBg: "bg-gradient-to-br from-emerald-950/30 via-black to-zinc-950",
    gradientBorder: "from-emerald-500/40 via-teal-500/20 to-transparent",
    badgeClass: "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300",
    progressBarClass: "bg-emerald-500",
    iconName: "Brain",
    secondaryIconName: "Sparkles",
  },
  levels: [
    {
      levelNumber: 1,
      name: "Foundations: Paradigms, Features & Targets",
      rpgTitle: "Threshold of Labeled Tensors",
      description:
        "Supervised vs unsupervised paradigms, feature matrix formulation, continuous regression vs discrete classification, and dataset partitioning.",
      academicTopics: [
        "Supervised Learning with Ground-Truth Labels vs Unsupervised Discovery",
        "Feature Matrices (X) and Target Label Vectors (y) Representation",
        "Regression (Continuous Targets) vs Classification (Discrete Categories)",
        "Train, Validation, and Test Partitioning Protocols",
        "Data Leakage Hazards and Preprocessing Pipelines",
      ],
      bloomsTaxonomy: "REMEMBER",
      difficulty: "INTRODUCTORY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 100,
      isBossLevel: false,
    },
    {
      levelNumber: 2,
      name: "Core Operations: Linear Models & Decision Trees",
      rpgTitle: "Glade of Linear Hyperplanes",
      description:
        "Parametric modeling with Ordinary Least Squares, logistic sigmoid decision boundaries, maximum likelihood, and recursive decision tree splits.",
      academicTopics: [
        "Ordinary Least Squares (OLS) Linear Regression & Closed-Form Normal Equation",
        "Logistic Regression and the Sigmoid Activation Function (1 / (1 + e^-z))",
        "Odds Ratios, Log-Odds (Logit), and Binary Cross-Entropy",
        "Decision Tree Splitting Criteria: Gini Impurity and Shannon Entropy",
        "K-Nearest Neighbors (KNN) Distance Metrics and Curse of Dimensionality",
      ],
      bloomsTaxonomy: "UNDERSTAND",
      difficulty: "FOUNDATIONAL",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 150,
      isBossLevel: false,
    },
    {
      levelNumber: 3,
      name: "Intermediate Constructs: Bias-Variance & Metrics",
      rpgTitle: "Valley of the Bias-Variance Tradeoff",
      description:
        "Statistical error decomposition, overfitting vs underfitting symptoms, K-fold cross-validation, confusion matrices, and ROC-AUC curves.",
      academicTopics: [
        "Bias-Variance Decomposition of Generalization Error",
        "Overfitting (High Variance) vs Underfitting (High Bias) Diagnostics",
        "K-Fold and Stratified K-Fold Cross-Validation Schemes",
        "Confusion Matrix Metrics: Accuracy, Precision, Recall, Specificity, F1-Score",
        "Receiver Operating Characteristic (ROC) Curves and Area Under Curve (AUC)",
      ],
      bloomsTaxonomy: "APPLY",
      difficulty: "INTERMEDIATE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 200,
      isBossLevel: false,
    },
    {
      levelNumber: 4,
      name: "Advanced Systems: Gradient Descent & Regularization",
      rpgTitle: "Descent of the Convex Loss Surface",
      description:
        "Convex optimization theory, loss function landscapes, stochastic vs batch gradient descent, Adam optimizer momentum, and L1/L2 penalties.",
      academicTopics: [
        "Mean Squared Error (MSE) vs Cross-Entropy Loss Surfaces",
        "Batch Gradient Descent vs Stochastic Gradient Descent (SGD) vs Mini-Batch",
        "Adaptive Optimizers: Momentum, RMSProp, and Adam (First/Second Moments)",
        "L1 Lasso Regularization (L1 Norm, Feature Sparsity Induction)",
        "L2 Ridge Regularization (L2 Norm, Weight Decay Penalty)",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "ADVANCED",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 250,
      isBossLevel: false,
    },
    {
      levelNumber: 5,
      name: "Asymptotic Optimization: Neural Networks & Convolutions",
      rpgTitle: "Tower of the Multi-Layer Perceptrons",
      description:
        "Deep feedforward networks, non-linear activation functions, backpropagation calculus, vanishing gradients, and convolutional feature extractors.",
      academicTopics: [
        "Universal Approximation Theorem and Multi-Layer Perceptrons (MLPs)",
        "Non-Linear Activation Functions: Sigmoid, Tanh, ReLU, Leaky ReLU, Softmax",
        "Backpropagation via Multivariable Calculus Chain Rule",
        "Vanishing and Exploding Gradient Phenotypes and Weight Initialization (He/Xavier)",
        "Convolutional Neural Networks (CNNs): Kernels, Strides, Padding, and Max Pooling",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "EXPERT",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 300,
      isBossLevel: false,
    },
    {
      levelNumber: 6,
      name: "System Synthesis: Recurrent Networks & Attention",
      rpgTitle: "Sanctum of the Self-Attention Vectors",
      description:
        "Sequential modeling, vanishing gradients in recurrent networks, LSTM gating circuits, and scaled dot-product attention mechanics.",
      academicTopics: [
        "Recurrent Neural Networks (RNNs) and Hidden State Sequence Bottlenecks",
        "Long Short-Term Memory (LSTM) Architecture: Forget, Input, and Output Gates",
        "Gated Recurrent Units (GRUs) Reset and Update Mechanics",
        "Scaled Dot-Product Attention: Query, Key, and Value Matrix Projections (QK^T / sqrt(d_k))",
        "Multi-Head Attention Synthesis and Subspace Representation Learning",
      ],
      bloomsTaxonomy: "EVALUATE",
      difficulty: "MASTERY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 400,
      isBossLevel: false,
    },
    {
      levelNumber: 7,
      name: "Grand Mastery Crucible: Transformer Architectures & LLMs",
      rpgTitle: "Crucible of the Latent Singularity",
      description:
        "Capstone crucible on modern foundation models: full Transformer stacks, positional embeddings, self-supervised pretraining, and RLHF without hints.",
      academicTopics: [
        "Full Transformer Architecture: Encoder-Decoder vs Decoder-Only (GPT-style)",
        "Positional Embeddings: Sinusoidal Encodings vs Rotary Position Embeddings (RoPE)",
        "Self-Supervised Pretraining: Masked Language Modeling vs Next-Token Prediction",
        "Reinforcement Learning from Human Feedback (RLHF) and Reward Model Alignment",
        "Inference Decoding Strategies: Temperature, Top-k, and Nucleus (Top-p) Sampling",
      ],
      bloomsTaxonomy: "CREATE",
      difficulty: "CRUCIBLE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: false,
      hintUnlockSeconds: null,
      xpReward: 600,
      isBossLevel: true,
    },
  ],
};

// ============================================================================
// REALM 6: Cloud Spire Bastion (CS-302)
// ============================================================================
const CLOUD_SPIRE_BASTION: AcademicRealm = {
  id: "web-dev-and-devops",
  slug: "web-dev-and-devops",
  realmSlug: "cloud-spire-bastion",
  courseCode: "CS-302",
  academicTitle: "Web Development & DevOps",
    name: "Cloud Spire Bastion",
  realmTitle: "Cloud Spire Bastion",
  legacyTerritoryName: "The Cloud Spire Bastion",
  academicDomain: "CS-302: REST APIs, Security (CSP/CORS), Docker/K8s, Microservices, CI/CD Pipelines",
  rpgFlavor: "Cloud Spire, Gateway of Deployments",
  accentColor: "#f59e0b",
  icon: "Cloud",
  description:
    "Ascend the golden Cloud Spire Bastion: master RFC HTTP protocols, browser event loops, OWASP web application security, containerization, Kubernetes orchestration, and automated CI/CD.",
  totalQuestionsPerAttempt: 12,
  passingThresholdScore: 9,
  passingThresholdPercentage: 75,
  totalLevels: 7,
  theme: {
    primaryColor: "#f59e0b",
    secondaryColor: "#fbbf24",
    darkAccent: "#451a03",
    darkerBg: "#1f0c01",
    accentRgb: "245, 158, 11",
    borderClass: "border-amber-500/30 hover:border-amber-400/60",
    borderActiveClass: "border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]",
    bgLightClass: "bg-amber-500/10",
    bgMediumClass: "bg-amber-950/40",
    bgDarkClass: "bg-amber-950/80",
    textPrimaryClass: "text-amber-400",
    textSecondaryClass: "text-amber-300",
    textMutedClass: "text-amber-400/60",
    glowClass: "shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    glowStrongClass: "shadow-[0_0_35px_rgba(245,158,11,0.45)]",
    gradientBg: "bg-gradient-to-br from-amber-950/30 via-black to-zinc-950",
    gradientBorder: "from-amber-500/40 via-orange-500/20 to-transparent",
    badgeClass: "bg-amber-950/80 border border-amber-500/40 text-amber-300",
    progressBarClass: "bg-amber-500",
    iconName: "Cloud",
    secondaryIconName: "Server",
  },
  levels: [
    {
      levelNumber: 1,
      name: "Foundations: HTTP Protocols & REST Design",
      rpgTitle: "Gate of the RESTful Verb",
      description:
        "RFC 7231 HTTP verbs, safe vs idempotent operations, HTTP status code families, and REST architectural constraints.",
      academicTopics: [
        "HTTP Methods: GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS",
        "Idempotent vs Safe HTTP Method Invariants",
        "HTTP Status Code Families: 2xx Success, 3xx Redirect, 4xx Client Error, 5xx Server Error",
        "HTTP Headers: Content-Type, Accept, Authorization, and Cache-Control Directives",
        "REST Architectural Constraints: Statelessness, Uniform Interface, and Client-Server",
      ],
      bloomsTaxonomy: "REMEMBER",
      difficulty: "INTRODUCTORY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 100,
      isBossLevel: false,
    },
    {
      levelNumber: 2,
      name: "Core Operations: The Browser Engine & Event Loop",
      rpgTitle: "Bastion of the Event Loop",
      description:
        "Browser layout and rendering pipeline, single-threaded JavaScript execution, microtask vs task queues, and Same-Origin Policy fundamentals.",
      academicTopics: [
        "Browser Rendering Pipeline: DOM, CSSOM, Render Tree, Layout, Paint, and Composite",
        "JavaScript Concurrency: Call Stack, Web APIs, and Single-Threaded Execution",
        "Microtask Queue (Promises, queueMicrotask) vs Task/Macrotask Queue (setTimeout, I/O)",
        "Same-Origin Policy (SOP) Invariant: Protocol, Host, and Port Matching",
        "Cross-Origin Resource Sharing (CORS): Preflight OPTIONS and Access-Control Headers",
      ],
      bloomsTaxonomy: "UNDERSTAND",
      difficulty: "FOUNDATIONAL",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 150,
      isBossLevel: false,
    },
    {
      levelNumber: 3,
      name: "Intermediate Constructs: AppSec, CSP & Web Vulnerabilities",
      rpgTitle: "Bulwark of the Content Security Policy",
      description:
        "OWASP Top 10 web vulnerabilities, Cross-Site Scripting (XSS), Content Security Policy defense-in-depth, CSRF tokens, and SQL injection defense.",
      academicTopics: [
        "Cross-Site Scripting (XSS): Stored, Reflected, and DOM-Based Injection Vectors",
        "Content Security Policy (CSP): Directives (script-src, default-src), Nonces, and Hashes",
        "Cross-Site Request Forgery (CSRF): Synchronizer Tokens and SameSite Cookie Attributes",
        "SQL Injection Vulnerabilities and Parameterized Prepared Statements",
        "HTTP Security Headers: Strict-Transport-Security (HSTS) and X-Content-Type-Options",
      ],
      bloomsTaxonomy: "APPLY",
      difficulty: "INTERMEDIATE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 200,
      isBossLevel: false,
    },
    {
      levelNumber: 4,
      name: "Advanced Systems: JWT, OAuth 2.0 & Session Security",
      rpgTitle: "Vault of the Bearer Tokens",
      description:
        "Stateful server-side sessions vs stateless JSON Web Tokens (JWT), token signing algorithms, OAuth 2.0 authorization grants, and RBAC.",
      academicTopics: [
        "Stateful Session Cookies (HttpOnly, Secure, SameSite) vs Stateless Bearer Tokens",
        "JSON Web Token (JWT) Structure: Header, Payload Claims, and Cryptographic Signatures",
        "Token Expiration, Refresh Token Rotation, and Replay Revocation",
        "OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE)",
        "Role-Based Access Control (RBAC) and Least Privilege Enforcement",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "ADVANCED",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 250,
      isBossLevel: false,
    },
    {
      levelNumber: 5,
      name: "Asymptotic Optimization: Docker & Container Packaging",
      rpgTitle: "Drydock of the OCI Containers",
      description:
        "Linux kernel isolation (namespaces and cgroups), OCI container images, Dockerfile optimization, multi-stage compilation, and layer caching.",
      academicTopics: [
        "Linux Kernel Isolation: Namespaces (PID, NET, MNT, IPC) and Control Groups (cgroups)",
        "Virtual Machines vs Containers: Hypervisor Overhead vs Shared OS Kernel",
        "Dockerfile Optimization: Ordered Layer Caching to Minimize Rebuild Latency",
        "Multi-Stage Build Pipelines for Minimal Production Runtime Images",
        "Container Security: Rootless Execution and Distroless/Alpine Minimal Base Images",
      ],
      bloomsTaxonomy: "ANALYZE",
      difficulty: "EXPERT",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 300,
      isBossLevel: false,
    },
    {
      levelNumber: 6,
      name: "System Synthesis: Kubernetes & Distributed Services",
      rpgTitle: "Citadel of the Kubernetes Ingress",
      description:
        "Container orchestration, Kubernetes control plane architecture, pods, deployments, service routing, ingress controllers, and resilience patterns.",
      academicTopics: [
        "Kubernetes Control Plane (kube-apiserver, etcd, kube-scheduler, kube-controller-manager)",
        "Worker Node Components: Kubelet, Container Runtime (CRI), and Kube-Proxy",
        "Workload Abstractions: Pods, ReplicaSets, and Deployments (RollingUpdate vs Recreate)",
        "Service Discovery & Networking: ClusterIP, NodePort, LoadBalancer, and Ingress",
        "Microservice Resilience Patterns: Circuit Breaker, Bulkhead, and Exponential Backoff Retry",
      ],
      bloomsTaxonomy: "EVALUATE",
      difficulty: "MASTERY",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: true,
      hintUnlockSeconds: 15,
      xpReward: 400,
      isBossLevel: false,
    },
    {
      levelNumber: 7,
      name: "Grand Mastery Crucible: Cloud SRE & Zero-Downtime Infrastructure",
      rpgTitle: "Crucible of the Cloud SRE Architect",
      description:
        "Capstone crucible on automated CI/CD deployment pipelines, Blue-Green / Canary releases, SRE observability pillars, and GitOps without hints.",
      academicTopics: [
        "Continuous Integration & Continuous Deployment (CI/CD) Automated Pipeline Stages",
        "Zero-Downtime Deployment Strategies: Blue/Green Swapping vs Canary Traffic Splitting",
        "SRE Observability Pillars: Prometheus Metrics, Distributed Tracing, and Structured Logging",
        "Service Level Indicators (SLIs), Service Level Objectives (SLOs), and Error Budgets",
        "Declarative GitOps Infrastructure Management and Continuous Reconciliation",
      ],
      bloomsTaxonomy: "CREATE",
      difficulty: "CRUCIBLE",
      questionCount: 12,
      totalQuestions: 12,
      passingScoreThreshold: 9,
      passingThreshold: 9,
      passingPercentage: 75,
      timeLimitPerQuestionSeconds: 35,
      timeLimitSeconds: 35,
      hintsAvailable: false,
      hintUnlockSeconds: null,
      xpReward: 600,
      isBossLevel: true,
    },
  ],
};

// ============================================================================
// CANONICAL REGISTRY & ALIAS DICTIONARIES
// ============================================================================

export const ACADEMIC_REALMS: readonly AcademicRealm[] = [
  ALGORITHMIC_CITADEL,
  RELATIONAL_VAULT,
  KERNEL_KEEP,
  NETWORK_NEXUS,
  NEURAL_SANCTUM,
  CLOUD_SPIRE_BASTION,
] as const;

/**
 * Fast lookup map indexing realms by both:
 * 1. Subject Slug (e.g. "data-structures-and-algorithms")
 * 2. Realm Slug (e.g. "algorithmic-citadel")
 * 3. Course Code (e.g. "CS-201")
 */
const REALM_LOOKUP_MAP: ReadonlyMap<string, AcademicRealm> = (() => {
  const map = new Map<string, AcademicRealm>();
  for (const realm of ACADEMIC_REALMS) {
    map.set(realm.slug, realm);
    map.set(realm.realmSlug, realm);
    map.set(realm.courseCode, realm);
    map.set(realm.id, realm);
  }
  return map;
})();

// ============================================================================
// HELPER FUNCTIONS & SELECTORS
// ============================================================================

/**
 * Retrieve all registered academic realms in canonical curriculum order (CS-201 to CS-302).
 */
export function getAllAcademicRealms(): AcademicRealm[] {
  return [...ACADEMIC_REALMS];
}

/**
 * Retrieve an Academic Realm by either its canonical subject slug, realm slug, or course code.
 * Case-insensitive and trimmed.
 *
 * Examples:
 * - getAcademicRealmBySlug("data-structures-and-algorithms")
 * - getAcademicRealmBySlug("algorithmic-citadel")
 * - getAcademicRealmBySlug("CS-201")
 */
export function getAcademicRealmBySlug(slugOrCode: string): AcademicRealm | undefined {
  if (!slugOrCode || typeof slugOrCode !== "string") return undefined;
  const normalized = slugOrCode.trim().toLowerCase();
  
  // Exact match
  const direct = REALM_LOOKUP_MAP.get(normalized);
  if (direct) return direct;

  // Case-insensitive fallback for uppercase course codes like "CS-201"
  for (const realm of ACADEMIC_REALMS) {
    if (
      realm.slug.toLowerCase() === normalized ||
      realm.realmSlug.toLowerCase() === normalized ||
      realm.courseCode.toLowerCase() === normalized ||
      realm.id.toLowerCase() === normalized
    ) {
      return realm;
    }
  }

  return undefined;
}

/**
 * Retrieve a specific level configuration (1 to 7) for a given realm.
 *
 * @param realmSlugOrSubjectSlug Canonical subject slug or realm slug
 * @param levelNumber Numeric level from 1 to 7
 */
export function getLevelConfig(
  realmSlugOrSubjectSlug: string,
  levelNumber: number
): AcademicRealmLevel | undefined {
  if (!isValidLevelNumber(levelNumber)) return undefined;
  const realm = getAcademicRealmBySlug(realmSlugOrSubjectSlug);
  if (!realm) return undefined;

  return realm.levels.find((lvl) => lvl.levelNumber === levelNumber);
}

/**
 * Retrieve theme styling tokens for a given realm.
 */
export function getRealmTheme(realmSlugOrSubjectSlug: string): RealmThemeTokens | undefined {
  const realm = getAcademicRealmBySlug(realmSlugOrSubjectSlug);
  return realm ? realm.theme : undefined;
}

/**
 * Type guard validating whether a numeric value is a valid level number (1 to 7).
 */
export function isValidLevelNumber(level: number): level is LevelNumber {
  return typeof level === "number" && Number.isInteger(level) && level >= 1 && level <= 7;
}

/**
 * Check whether a string matches any recognized realm slug, subject slug, or course code.
 */
export function isValidRealmSlug(slugOrCode: string): boolean {
  return getAcademicRealmBySlug(slugOrCode) !== undefined;
}

/**
 * List all recognized slug strings (both subject slugs and realm slugs).
 */
export function getAllRealmSlugs(): string[] {
  const slugs: string[] = [];
  for (const r of ACADEMIC_REALMS) {
    slugs.push(r.slug);
    slugs.push(r.realmSlug);
  }
  return slugs;
}

/**
 * Retrieve passing criteria and timer policy for a realm level.
 */
export function getPassingCriteria(
  realmSlugOrSubjectSlug: string,
  levelNumber: number
): {
  passingScoreThreshold: number;
  passingPercentage: number;
  totalQuestions: number;
  timeLimitPerQuestionSeconds: number;
  hintsAvailable: boolean;
  hintUnlockSeconds: number | null;
} | undefined {
  const level = getLevelConfig(realmSlugOrSubjectSlug, levelNumber);
  if (!level) return undefined;

  return {
    passingScoreThreshold: level.passingScoreThreshold,
    passingPercentage: level.passingPercentage,
    totalQuestions: level.questionCount,
    timeLimitPerQuestionSeconds: level.timeLimitPerQuestionSeconds,
    hintsAvailable: level.hintsAvailable,
    hintUnlockSeconds: level.hintUnlockSeconds,
  };
}
