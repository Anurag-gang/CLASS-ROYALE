import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Class Royale University LMS database...');

  // Clean existing tables
  await prisma.clanActivity.deleteMany();
  await prisma.clanMember.deleteMany();
  await prisma.clan.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.importHistory.deleteMany();
  await prisma.studentIntervention.deleteMany();
  await prisma.classQuiz.deleteMany();
  await prisma.topicMastery.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.courseFaculty.deleteMany();
  await prisma.classCourse.deleteMany();
  await prisma.classFaculty.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicTerm.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.university.deleteMany();

  await prisma.xPTransaction.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.userQuest.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.cRQuizQuestion.deleteMany();
  await prisma.cRQuiz.deleteMany();
  await prisma.cRStudyPlan.deleteMany();
  await prisma.cRRevisionPack.deleteMany();
  await prisma.cRMessage.deleteMany();
  await prisma.cRConversation.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. UNIVERSITY HIERARCHY
  const univ = await prisma.university.create({
    data: {
      name: 'Apex University',
      code: 'APEX-UNIV',
    },
  });

  const deptCA = await prisma.department.create({
    data: {
      universityId: univ.id,
      name: 'Department of Computer Applications',
      code: 'CA',
    },
  });

  const deptCSE = await prisma.department.create({
    data: {
      universityId: univ.id,
      name: 'Department of Computer Science & Engineering',
      code: 'CSE',
    },
  });

  const deptIT = await prisma.department.create({
    data: {
      universityId: univ.id,
      name: 'Department of Information Technology',
      code: 'IT',
    },
  });

  const progBCA = await prisma.program.create({
    data: {
      departmentId: deptCA.id,
      name: 'Bachelor of Computer Applications',
      code: 'BCA',
      totalSemesters: 6,
    },
  });

  const progMCA = await prisma.program.create({
    data: {
      departmentId: deptCA.id,
      name: 'Master of Computer Applications',
      code: 'MCA',
      totalSemesters: 4,
    },
  });

  const progBTech = await prisma.program.create({
    data: {
      departmentId: deptCSE.id,
      name: 'B.Tech Computer Science & Engineering',
      code: 'BTECH_CSE',
      totalSemesters: 8,
    },
  });

  const term = await prisma.academicTerm.create({
    data: {
      name: 'Fall Semester 2026–27',
      year: '2026-2027',
      isCurrent: true,
    },
  });

  // 2. FACULTY & ADMIN USERS
  const drSharma = await prisma.user.create({
    data: {
      username: 'dr.sharma',
      email: 'r.sharma@apex.edu.in',
      passwordHash,
      role: 'FACULTY',
      profile: {
        create: {
          name: 'Dr. Rajesh Sharma',
          universityId: univ.id,
          facultyId: 'FAC-1001',
          department: 'Computer Applications',
          program: 'BCA',
          avatar: '👨‍🏫',
          title: 'Associate Professor & Lead Algorithmist',
          level: 40,
          xp: 25000,
          rank: 'Grandmaster Faculty',
        },
      },
    },
  });

  const profKapoor = await prisma.user.create({
    data: {
      username: 'prof.kapoor',
      email: 's.kapoor@apex.edu.in',
      passwordHash,
      role: 'FACULTY',
      profile: {
        create: {
          name: 'Prof. Sunita Kapoor',
          universityId: univ.id,
          facultyId: 'FAC-1002',
          department: 'Computer Applications',
          program: 'BCA',
          avatar: '👩‍🏫',
          title: 'Assistant Professor & Database Architect',
          level: 35,
          xp: 18000,
          rank: 'Senior Faculty',
        },
      },
    },
  });

  const drAnita = await prisma.user.create({
    data: {
      username: 'dr.anita',
      email: 'a.desai@apex.edu.in',
      passwordHash,
      role: 'FACULTY',
      profile: {
        create: {
          name: 'Dr. Anita Desai',
          universityId: univ.id,
          facultyId: 'FAC-1003',
          department: 'Computer Science & Engineering',
          program: 'BTECH_CSE',
          avatar: '🔬',
          title: 'Professor & Systems Specialist',
          level: 45,
          xp: 32000,
          rank: 'Distinguished Professor',
        },
      },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@apex.edu.in',
      passwordHash,
      role: 'ADMIN',
      profile: {
        create: {
          name: 'Academic Affairs Administrator',
          universityId: univ.id,
          facultyId: 'ADM-001',
          department: 'Office of Academic Affairs',
          avatar: '🏛️',
          title: 'Chief Academic Registrar',
          level: 50,
          xp: 50000,
          rank: 'Apex Administrator',
        },
      },
    },
  });

  // 3. CLASSES
  const classBCA5A = await prisma.class.create({
    data: {
      name: 'BCA — Semester 5A',
      code: 'BCA-SEM5-A',
      departmentId: deptCA.id,
      programId: progBCA.id,
      academicTermId: term.id,
      semester: 5,
      section: 'A',
    },
  });

  const classBCA5B = await prisma.class.create({
    data: {
      name: 'BCA — Semester 5B',
      code: 'BCA-SEM5-B',
      departmentId: deptCA.id,
      programId: progBCA.id,
      academicTermId: term.id,
      semester: 5,
      section: 'B',
    },
  });

  const classMCA1A = await prisma.class.create({
    data: {
      name: 'MCA — Semester 1A',
      code: 'MCA-SEM1-A',
      departmentId: deptCA.id,
      programId: progMCA.id,
      academicTermId: term.id,
      semester: 1,
      section: 'A',
    },
  });

  // Link Faculty to Classes
  await prisma.classFaculty.createMany({
    data: [
      { classId: classBCA5A.id, facultyId: drSharma.id, role: 'PRIMARY_INSTRUCTOR' },
      { classId: classMCA1A.id, facultyId: drSharma.id, role: 'PRIMARY_INSTRUCTOR' },
      { classId: classBCA5B.id, facultyId: profKapoor.id, role: 'PRIMARY_INSTRUCTOR' },
    ],
  });

  // 4. SUBJECTS & COURSES
  const subjectCS = await prisma.subject.create({
    data: {
      slug: 'computer-science',
      title: 'Computer Science & Software Engineering',
      description: 'Foundations of algorithms, databases, and network architectures.',
      icon: '💻',
      accentColor: '#de1659',
      order: 1,
    },
  });

  const courseDSA = await prisma.course.create({
    data: {
      subjectId: subjectCS.id,
      slug: 'data-structures-and-algorithms',
      title: 'Data Structures & Algorithms',
      description: 'Conquer binary trees, dynamic programming, sorting, and graph algorithms.',
      difficulty: 'Intermediate',
      xpReward: 500,
      order: 1,
      lessons: {
        create: [
          {
            slug: 'binary-search-trees',
            title: 'Binary Search Trees & Balancing',
            description: 'Traversals, node balancing, and logarithmic efficiency.',
            xpReward: 100,
            order: 1,
            content: '# Binary Search Trees\nBST nodes maintain left-child < node < right-child properties.',
          },
          {
            slug: 'dynamic-programming-memoization',
            title: 'Dynamic Programming: Tabulation vs Memoization',
            description: 'Overlapping subproblems and optimal substructure in computational complexity.',
            xpReward: 150,
            order: 2,
            content: '# Dynamic Programming\nCache subproblem solutions to reduce exponential time complexity to polynomial.',
          },
          {
            slug: 'graph-traversals-bfs-dfs',
            title: 'Graph Traversal: BFS vs DFS',
            description: 'Network path exploration with queues and call stacks.',
            xpReward: 100,
            order: 3,
            content: '# Graph Traversal\nBFS guarantees shortest path in unweighted graphs; DFS explores complete branch depths.',
          },
        ],
      },
      questions: {
        create: [
          {
            question: 'What is the average time complexity of searching an element in a balanced BST?',
            optionsJson: JSON.stringify(['O(1)', 'O(log n)', 'O(n)', 'O(n log n)']),
            answerIndex: 1,
            explanation: 'Halving the search space on each step yields logarithmic O(log n) time.',
            xpReward: 50,
            order: 1,
          },
          {
            question: 'Which paradigm caches results of subproblems to avoid redundant computation?',
            optionsJson: JSON.stringify(['Greedy', 'Divide and Conquer', 'Dynamic Programming', 'Backtracking']),
            answerIndex: 2,
            explanation: 'Dynamic Programming optimizes recursion via memoization or tabulation.',
            xpReward: 50,
            order: 2,
          },
        ],
      },
    },
  });

  const courseDBMS = await prisma.course.create({
    data: {
      subjectId: subjectCS.id,
      slug: 'database-management-systems',
      title: 'Database Management Systems',
      description: 'Relational algebra, SQL, normalization forms (1NF-BCNF), and ACID concurrency.',
      difficulty: 'Intermediate',
      xpReward: 450,
      order: 2,
      lessons: {
        create: [
          {
            slug: 'relational-normalization',
            title: 'Relational Normalization & Normal Forms',
            description: 'Eliminating anomalies via 1NF, 2NF, 3NF, and Boyce-Codd Normal Form.',
            xpReward: 120,
            order: 1,
            content: '# Normalization\nDecompose schemas to eliminate insertion, deletion, and update anomalies.',
          },
        ],
      },
    },
  });

  // Assign courses to classes
  await prisma.classCourse.createMany({
    data: [
      { classId: classBCA5A.id, courseId: courseDSA.id },
      { classId: classBCA5A.id, courseId: courseDBMS.id },
      { classId: classBCA5B.id, courseId: courseDSA.id },
      { classId: classMCA1A.id, courseId: courseDSA.id },
    ],
  });

  // 5. ACHIEVEMENTS
  const achievements = [
    { code: 'CR_FIRST_LESSON', title: 'Neural Link Established', description: 'Complete your first interactive study lesson with CR.', icon: '👑', xpReward: 250, rarity: 'COMMON' },
    { code: 'CR_QUIZMASTER', title: 'Arcade Quizmaster', description: 'Score 80%+ on any battle quiz.', icon: '⚔️', xpReward: 500, rarity: 'RARE' },
    { code: 'CR_PERFECT_THINKER', title: 'Flawless Mind', description: 'Achieve 100% accuracy on a 5-question challenge.', icon: '⚡', xpReward: 600, rarity: 'EPIC' },
    { code: 'STREAK_7', title: '7-Day Battle Presence', description: 'Log in and study 7 days consecutively.', icon: '🔥', xpReward: 400, rarity: 'RARE' },
  ];
  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }

  // 6. STUDENTS SEEDING
  // Primary Student: Anurag
  const anurag = await prisma.user.create({
    data: {
      username: 'anurag',
      email: 'anurag@apex.edu.in',
      passwordHash,
      role: 'STUDENT',
      profile: {
        create: {
          name: 'Anurag Sen',
          universityId: univ.id,
          studentId: '500120101',
          department: 'Computer Applications',
          program: 'BCA',
          semester: 5,
          section: 'A',
          level: 21,
          xp: 4850,
          rank: 'Knowledge Knight',
          streak: 12,
          questsCompleted: 38,
          achievementsUnlocked: 12,
          avatar: '⚔️',
          title: 'Master Algorithmist',
        },
      },
    },
  });

  await prisma.classMember.create({
    data: {
      classId: classBCA5A.id,
      studentId: anurag.id,
      status: 'ACTIVE',
    },
  });

  await prisma.courseEnrollment.create({
    data: { courseId: courseDSA.id, studentId: anurag.id, status: 'ENROLLED' },
  });

  // Roster of students for BCA 5A
  const bca5aStudents = [
    { studentId: '500120102', name: 'Rohit Kumar', username: 'rohit.kumar', mastery: 86, activity: 'HIGH', xp: 4200, level: 19, weak: false },
    { studentId: '500120103', name: 'Priya Sharma', username: 'priya.sharma', mastery: 92, activity: 'HIGH', xp: 5100, level: 23, weak: false },
    { studentId: '500120104', name: 'Vikram Aditya', username: 'vikram.aditya', mastery: 54, activity: 'LOW', xp: 1400, level: 8, weak: true, weakTopic: 'Algorithms' },
    { studentId: '500120105', name: 'Sneha Patel', username: 'sneha.patel', mastery: 79, activity: 'MEDIUM', xp: 3300, level: 15, weak: false },
    { studentId: '500120106', name: 'Aarav Mehta', username: 'aarav.mehta', mastery: 88, activity: 'HIGH', xp: 4600, level: 20, weak: false },
    { studentId: '500120107', name: 'Diya Nair', username: 'diya.nair', mastery: 58, activity: 'LOW', xp: 1600, level: 9, weak: true, weakTopic: 'Dynamic Programming' },
    { studentId: '500120108', name: 'Karan Singh', username: 'karan.singh', mastery: 74, activity: 'MEDIUM', xp: 2900, level: 14, weak: false },
    { studentId: '500120109', name: 'Tanvi Joshi', username: 'tanvi.joshi', mastery: 81, activity: 'HIGH', xp: 3700, level: 17, weak: false },
    { studentId: '500120110', name: 'Aman Gupta', username: 'aman.gupta', mastery: 63, activity: 'LOW', xp: 1950, level: 10, weak: true, weakTopic: 'Process Synchronization' },
    { studentId: '500120111', name: 'Ananya Roy', username: 'ananya.roy', mastery: 84, activity: 'HIGH', xp: 4100, level: 18, weak: false },
    { studentId: '500120112', name: 'Siddharth Rao', username: 'siddharth.rao', mastery: 77, activity: 'MEDIUM', xp: 3200, level: 15, weak: false },
    { studentId: '500120113', name: 'Neha Verma', username: 'neha.verma', mastery: 89, activity: 'HIGH', xp: 4700, level: 21, weak: false },
    { studentId: '500120114', name: 'Rahul Mishra', username: 'rahul.mishra', mastery: 68, activity: 'MEDIUM', xp: 2400, level: 12, weak: false },
    { studentId: '500120115', name: 'Pooja Iyer', username: 'pooja.iyer', mastery: 95, activity: 'HIGH', xp: 5400, level: 24, weak: false },
  ];

  const topicsList = ['Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks'];

  for (const s of bca5aStudents) {
    const studentUser = await prisma.user.create({
      data: {
        username: s.username,
        email: `${s.username}@apex.edu.in`,
        passwordHash,
        role: 'STUDENT',
        profile: {
          create: {
            name: s.name,
            universityId: univ.id,
            studentId: s.studentId,
            department: 'Computer Applications',
            program: 'BCA',
            semester: 5,
            section: 'A',
            level: s.level,
            xp: s.xp,
            rank: s.level >= 20 ? 'Code Paladin' : s.level >= 15 ? 'Pixel Squire' : 'Novice Apprentice',
            streak: s.weak ? 1 : Math.floor(Math.random() * 10) + 3,
            questsCompleted: Math.floor(s.xp / 120),
            achievementsUnlocked: Math.floor(s.level * 0.6),
            avatar: s.weak ? '🛡️' : '⚡',
            title: s.weak ? 'Apprentice Scholar' : 'Arena Contender',
          },
        },
      },
    });

    await prisma.classMember.create({
      data: {
        classId: classBCA5A.id,
        studentId: studentUser.id,
        status: 'ACTIVE',
      },
    });

    await prisma.courseEnrollment.create({
      data: {
        courseId: courseDSA.id,
        studentId: studentUser.id,
        status: 'ENROLLED',
      },
    });

    // Seed topic masteries
    for (const t of topicsList) {
      let accuracy = s.weak && t === (s.weakTopic || 'Algorithms') ? 48.0 : s.mastery + (Math.floor(Math.random() * 10) - 5);
      if (accuracy > 100) accuracy = 100;
      if (accuracy < 30) accuracy = 30;

      await prisma.topicMastery.create({
        data: {
          studentId: studentUser.id,
          topic: t,
          accuracy,
          attemptsCount: Math.floor(Math.random() * 8) + 2,
          trend: s.weak && t === (s.weakTopic || 'Algorithms') ? 'DECLINING' : accuracy >= 80 ? 'IMPROVING' : 'STABLE',
          lastAssessed: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5)),
        },
      });
    }

    // Seed quiz attempt
    await prisma.quizAttempt.create({
      data: {
        userId: studentUser.id,
        courseId: courseDSA.id,
        score: Math.floor((s.mastery / 100) * 5),
        total: 5,
        perfect: s.mastery >= 90,
        xpEarned: Math.floor(s.mastery * 2),
      },
    });
  }

  // Topic masteries for Anurag
  for (const t of topicsList) {
    const accuracy = t === 'Algorithms' ? 62.0 : t === 'Data Structures' ? 84.0 : 78.0;
    await prisma.topicMastery.create({
      data: {
        studentId: anurag.id,
        topic: t,
        accuracy,
        attemptsCount: 8,
        trend: t === 'Algorithms' ? 'DECLINING' : 'IMPROVING',
        lastAssessed: new Date(),
      },
    });
  }

  // Seed sample intervention from Dr. Sharma to Vikram Aditya
  const vikramUser = await prisma.user.findFirst({ where: { username: 'vikram.aditya' } });
  if (vikramUser) {
    await prisma.studentIntervention.create({
      data: {
        classId: classBCA5A.id,
        facultyId: drSharma.id,
        studentId: vikramUser.id,
        type: 'ASSIGN_QUEST',
        title: 'Targeted Practice: Binary Search Tree Traversals',
        message: 'Mastery in Algorithms dropped below 55%. Complete this 15-minute diagnostic drill.',
        status: 'PENDING',
      },
    });
  }

  // 7. IMPORT HISTORY RECORD
  await prisma.importHistory.create({
    data: {
      classId: classBCA5A.id,
      facultyId: drSharma.id,
      fileName: 'bca_semester_5a_batch_2026.csv',
      totalRecords: 15,
      successfulRecords: 15,
      failedRecords: 0,
      status: 'COMPLETED',
      reportJson: JSON.stringify({
        summary: 'All 15 student records successfully imported and provisioned.',
        valid: 15,
        duplicate: 0,
        invalid: 0,
      }),
    },
  });

  // 8. AUDIT LOGS
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: drSharma.id,
        action: 'CLASS_CREATED',
        targetType: 'Class',
        targetId: classBCA5A.id,
        metadataJson: JSON.stringify({ className: 'BCA — Semester 5A', code: 'BCA-SEM5-A' }),
      },
      {
        actorId: drSharma.id,
        action: 'STUDENT_IMPORTED',
        targetType: 'Class',
        targetId: classBCA5A.id,
        metadataJson: JSON.stringify({ batchSize: 15, fileName: 'bca_semester_5a_batch_2026.csv' }),
      },
    ],
  });

  // 9. CLANS (Classroom & Study Groups)
  const clanDevOps = await prisma.clan.create({
    data: {
      name: 'UPES — DevOps Batch 3',
      description: 'Official academic clan for third-year Cloud & DevOps engineering cohort.',
      category: 'CLASSROOM',
      joinCode: 'UPES-DO-B3',
      isPrivate: false,
      creatorId: drSharma.id,
      members: {
        create: [
          { userId: drSharma.id, role: 'LEADER' },
          { userId: anurag.id, role: 'MEMBER' },
        ],
      },
      activities: {
        create: [
          {
            title: 'Diagnostic Quiz: Docker vs Podman & Container Orchestration',
            description: 'Mandatory 10-question diagnostic drill before next lab session.',
            type: 'QUIZ',
            dueAt: new Date(Date.now() + 86400000 * 3),
          },
          {
            title: 'CI/CD GitHub Actions Pipeline Challenge',
            description: 'Peer code review and automated testing workflow configuration.',
            type: 'CHALLENGE',
            dueAt: new Date(Date.now() + 86400000 * 7),
          },
        ],
      },
    },
  });

  const clanDSA = await prisma.clan.create({
    data: {
      name: 'DSA Placement Crucible',
      description: 'Peer-led study clan focused on trees, dynamic programming, and system design interviews.',
      category: 'STUDY_GROUP',
      joinCode: 'DSA-ELITE-26',
      isPrivate: true,
      creatorId: anurag.id,
      members: {
        create: [
          { userId: anurag.id, role: 'LEADER' },
        ],
      },
      activities: {
        create: [
          {
            title: 'Weekly Sprint: 5 Hard Binary Tree Questions',
            description: 'Timed session covering lowest common ancestor and path sums.',
            type: 'QUIZ',
            dueAt: new Date(Date.now() + 86400000 * 2),
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
  console.log(`- University: ${univ.name}`);
  console.log(`- Faculty: Dr. Sharma (dr.sharma), Prof. Kapoor (prof.kapoor), Dr. Anita (dr.anita)`);
  console.log(`- Admin: Academic Administrator (admin)`);
  console.log(`- Classes: BCA 5A (15 students), BCA 5B, MCA 1A`);
  console.log(`- Primary Student: Anurag (anurag, ID: 500120101)`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });