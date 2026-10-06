import { prisma } from "../db";
import { awardUserXp } from "../game-mechanics";
import { getAIProvider } from "../ai/provider";
import { buildStudentContext } from "../ai/context";

// CR Tool Definitions and Handlers

export interface QuizQuestionGenerated {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  subtopic: string;
}

export interface QuizCreationResult {
  quizId: string;
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestionGenerated[];
}

export interface StudyPlanDay {
  day: number;
  dateStr?: string;
  topic: string;
  tasks: { timeMin: number; action: string; description: string }[];
}

export interface RevisionCard {
  id: string;
  front: string;
  back: string;
  category: string;
}

// 1. Tool: Generate and persist an adaptive quiz
export async function toolCreateQuiz(
  userId: string,
  topic: string,
  difficulty: string = "ADAPTIVE",
  count: number = 5
): Promise<QuizCreationResult> {
  const normalizedTopic = topic.toLowerCase();

  let questionsPool: QuizQuestionGenerated[] = [];

  try {
    const provider = getAIProvider();
    const context = await buildStudentContext(userId);
    const numDiff = difficulty === "HARD" ? 4 : difficulty === "EASY" ? 2 : 3;
    const aiQuestions = await provider.generateQuiz(
      { topic, difficulty: numDiff, questionCount: count },
      context
    );
    if (aiQuestions && aiQuestions.length > 0) {
      questionsPool = aiQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        answerIndex: q.answerIndex ?? 0,
        explanation: q.explanation,
        subtopic: q.subtopic || "Core Concept",
      }));
    }
  } catch (err) {
    console.warn("[toolCreateQuiz] AI generation failed, using local pool fallback:", err);
  }

  if (questionsPool.length === 0 && (normalizedTopic.includes("tree") || normalizedTopic.includes("binary") || normalizedTopic.includes("bst"))) {
    questionsPool = [
      {
        question: "What is the average time complexity of searching in a balanced Binary Search Tree?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        answerIndex: 1,
        explanation: "In a balanced BST, each comparison halves the search interval, yielding logarithmic complexity.",
        subtopic: "BST Complexity",
      },
      {
        question: "Which tree traversal visits the nodes in non-decreasing sorted order for a BST?",
        options: ["Pre-order", "In-order", "Post-order", "Level-order"],
        answerIndex: 1,
        explanation: "In-order traversal (Left, Root, Right) processes nodes in ascending order in a binary search tree.",
        subtopic: "Tree Traversals",
      },
      {
        question: "What is the worst-case time complexity of an un-balanced (skewed) binary search tree?",
        options: ["O(log n)", "O(n log n)", "O(n)", "O(1)"],
        answerIndex: 2,
        explanation: "When nodes are inserted in sorted order without balancing, the tree degenerates into a linked list with O(n) search.",
        subtopic: "Tree Balancing",
      },
      {
        question: "In an AVL tree, what is the maximum permissible balance factor difference between subtrees?",
        options: ["0", "1", "2", "3"],
        answerIndex: 1,
        explanation: "AVL trees strictly require that the height difference between left and right subtrees never exceeds 1.",
        subtopic: "AVL Balancing",
      },
      {
        question: "How many null pointers exist in a binary tree containing N nodes?",
        options: ["N", "N - 1", "N + 1", "2N"],
        answerIndex: 2,
        explanation: "A binary tree with N nodes always possesses exactly N + 1 null link pointers.",
        subtopic: "Tree Pointers",
      },
    ];
  } else if (normalizedTopic.includes("recursion") || normalizedTopic.includes("recursive")) {
    questionsPool = [
      {
        question: "What catastrophic runtime failure occurs if a recursive function lacks a base case?",
        options: ["NullPointerException", "StackOverflowError", "Segmentation Out of Bounds", "Deadlock"],
        answerIndex: 1,
        explanation: "Recursive frames accumulate on the call stack until memory is exhausted, causing a stack overflow.",
        subtopic: "Base Cases",
      },
      {
        question: "What is the primary optimization technique applied to tail-recursive functions by compilers?",
        options: ["Heap caching", "Tail-call elimination to loops", "Garbage collection freeze", "Parallel threading"],
        answerIndex: 1,
        explanation: "Tail-call optimization (TCO) reuses the current stack frame, converting recursion into O(1) space loops.",
        subtopic: "Tail Recursion",
      },
      {
        question: "What is the recurrence relation for the standard Tower of Hanoi puzzle with n discs?",
        options: ["T(n) = T(n-1) + 1", "T(n) = 2T(n-1) + 1", "T(n) = 2T(n/2) + n", "T(n) = T(n-2) + n"],
        answerIndex: 1,
        explanation: "Moving n discs requires moving n-1 discs twice plus the largest disc, giving 2^n - 1 operations.",
        subtopic: "Recurrence Relations",
      },
      {
        question: "What is the maximum recursion depth typically allocated to call frames in modern JavaScript engines?",
        options: ["~100 calls", "~10,000 calls", "~1,000,000 calls", "Infinite"],
        answerIndex: 1,
        explanation: "V8 typically limits execution stack depth to roughly 10,000 frames before throwing RangeError.",
        subtopic: "Call Stack Limits",
      },
      {
        question: "Which of the following problems is naturally suited to Divide and Conquer recursion?",
        options: ["Linear array search", "Merge Sort", "Bubble Sort", "Counting Sort"],
        answerIndex: 1,
        explanation: "Merge Sort repeatedly partitions arrays into subproblems, solves them recursively, and merges the results.",
        subtopic: "Divide and Conquer",
      },
    ];
  } else if (questionsPool.length === 0) {
    // General Algorithm & Core CS pool
    questionsPool = [
      {
        question: "Which of the following sorting algorithms guarantees O(n log n) worst-case time complexity?",
        options: ["Quick Sort", "Merge Sort", "Bubble Sort", "Insertion Sort"],
        answerIndex: 1,
        explanation: "Merge Sort guarantees O(n log n) in all cases (best, average, and worst) because splits are always halved.",
        subtopic: "Sorting Algorithms",
      },
      {
        question: "What is the space complexity of Depth-First Search on a graph with maximum depth D?",
        options: ["O(1)", "O(D)", "O(V²)", "O(V + E)"],
        answerIndex: 1,
        explanation: "DFS stores only the path from root to current node on the recursion stack, requiring O(D) auxiliary space.",
        subtopic: "Graph Traversal",
      },
      {
        question: "What does the 'P vs NP' question fundamentally ask?",
        options: [
          "Whether all problems can be solved in linear time",
          "Whether problems quickly verified (NP) can also be quickly solved (P)",
          "Whether quantum computers break encryption",
          "Whether sorting can be done in O(1)",
        ],
        answerIndex: 1,
        explanation: "P vs NP asks if any problem whose solution can be verified in polynomial time can also be solved in polynomial time.",
        subtopic: "Computational Complexity",
      },
      {
        question: "Which data structure implements LIFO (Last-In, First-Out) semantics?",
        options: ["Queue", "Stack", "Heap", "Hash Set"],
        answerIndex: 1,
        explanation: "A Stack pushes and pops elements from the same top extremity, honoring LIFO order.",
        subtopic: "Linear Data Structures",
      },
      {
        question: "In relational database theory, what anomaly is avoided by the Third Normal Form (3NF)?",
        options: ["Partial dependencies", "Transitive dependencies", "Null pointer leaks", "B-tree fragmentation"],
        answerIndex: 1,
        explanation: "3NF ensures all non-prime attributes depend only on the primary key, eliminating transitive dependencies.",
        subtopic: "Database Normalization",
      },
    ];
  }

  const selectedQuestions = questionsPool.slice(0, count);

  // Persist into database
  const createdQuiz = await prisma.cRQuiz.create({
    data: {
      userId,
      title: `${topic.toUpperCase()} BATTLE TRIAL`,
      topic,
      difficulty,
      totalQuestions: selectedQuestions.length,
      questions: {
        create: selectedQuestions.map((q, idx) => ({
          question: q.question,
          optionsJson: JSON.stringify(q.options),
          answerIndex: q.answerIndex,
          explanation: q.explanation,
          subtopic: q.subtopic,
          order: idx + 1,
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  return {
    quizId: createdQuiz.id,
    title: createdQuiz.title,
    topic: createdQuiz.topic,
    difficulty: createdQuiz.difficulty,
    questions: selectedQuestions,
  };
}

// 2. Tool: Evaluate an interactive quiz submission
export async function toolEvaluateQuiz(
  userId: string,
  quizId: string,
  answers: Record<string, number> // questionId or index -> selectedOptionIndex
) {
  const quiz = await prisma.cRQuiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!quiz) throw new Error("Quiz not found");

  let correctCount = 0;
  const weakSubtopicsSet = new Set<string>();
  const strongSubtopicsSet = new Set<string>();

  const evaluationDetails = quiz.questions.map((q, idx) => {
    // support key by question.id or index
    const userAns = answers[q.id] !== undefined ? answers[q.id] : answers[String(idx)];
    const isCorrect = userAns === q.answerIndex;

    if (isCorrect) {
      correctCount++;
      strongSubtopicsSet.add(q.subtopic);
    } else {
      weakSubtopicsSet.add(q.subtopic);
    }

    return {
      questionId: q.id,
      question: q.question,
      selectedAnswer: userAns,
      correctAnswer: q.answerIndex,
      isCorrect,
      explanation: q.explanation,
      subtopic: q.subtopic,
    };
  });

  const total = quiz.questions.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const isPerfect = correctCount === total && total > 0;

  // XP calculation validated and issued by backend
  let xpAwarded = 0;
  if (accuracy >= 60) {
    xpAwarded = 150;
    if (isPerfect) {
      xpAwarded += 100; // Perfect Run Bonus
    }
  } else {
    xpAwarded = 40; // Participation XP
  }

  const weakAreas = Array.from(weakSubtopicsSet);
  const strongAreas = Array.from(strongSubtopicsSet);

  let recommendation = "";
  if (weakAreas.length > 0) {
    recommendation = `CR recommends a 10-minute focus on ${weakAreas.join(", ")}, followed by a targeted rematch.`;
  } else {
    recommendation = `Flawless run! You have mastered ${quiz.topic}. Ready to advance to higher difficulty!`;
  }

  // Update Quiz record
  await prisma.cRQuiz.update({
    where: { id: quizId },
    data: {
      score: correctCount,
      accuracy,
      isCompleted: true,
      xpAwarded,
      weakAreasJson: JSON.stringify(weakAreas),
      recommendation,
    },
  });

  // Update TopicMastery for continuous learning telemetry
  try {
    const existingMastery = await prisma.topicMastery.findUnique({
      where: { studentId_topic: { studentId: userId, topic: quiz.topic } },
    });
    if (existingMastery) {
      const prevAcc = existingMastery.accuracy;
      const newAcc = Math.round((prevAcc * existingMastery.attemptsCount + accuracy) / (existingMastery.attemptsCount + 1));
      const trend = newAcc > prevAcc + 3 ? "IMPROVING" : newAcc < prevAcc - 3 ? "DECLINING" : "STABLE";
      await prisma.topicMastery.update({
        where: { id: existingMastery.id },
        data: {
          accuracy: newAcc,
          attemptsCount: existingMastery.attemptsCount + 1,
          trend,
          lastAssessed: new Date(),
        },
      });
    } else {
      await prisma.topicMastery.create({
        data: {
          studentId: userId,
          topic: quiz.topic,
          accuracy,
          attemptsCount: 1,
          trend: "STABLE",
          lastAssessed: new Date(),
        },
      });
    }
  } catch (e) {
    console.warn("[toolEvaluateQuiz] TopicMastery update notice:", e);
  }

  // Award user verified progression XP
  const xpResult = await awardUserXp(
    userId,
    xpAwarded,
    "CR_QUIZ",
    `CR Quiz Conquered: ${quiz.topic} (${correctCount}/${total} correct)`
  );

  // Check CR achievements
  if (xpResult) {
    // CR_FIRST_LESSON
    const firstAch = await prisma.achievement.findUnique({ where: { code: "CR_FIRST_LESSON" } });
    if (firstAch) {
      const exists = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: firstAch.id } },
      });
      if (!exists) {
        await prisma.userAchievement.create({ data: { userId, achievementId: firstAch.id } });
        xpResult.unlockedAchievements.push(firstAch.title);
      }
    }

    // CR_PERFECT_THINKER
    if (isPerfect) {
      const perfAch = await prisma.achievement.findUnique({ where: { code: "CR_PERFECT_THINKER" } });
      if (perfAch) {
        const exists = await prisma.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: perfAch.id } },
        });
        if (!exists) {
          await prisma.userAchievement.create({ data: { userId, achievementId: perfAch.id } });
          xpResult.unlockedAchievements.push(perfAch.title);
        }
      }
    }
  }

  return {
    quizId,
    score: correctCount,
    total,
    accuracy,
    isPerfect,
    xpAwarded,
    weakAreas,
    strongAreas,
    recommendation,
    evaluationDetails,
    xpResult,
  };
}

// 3. Tool: Generate a structured study plan
export async function toolCreateStudyPlan(
  userId: string,
  subject: string,
  days: number = 7,
  targetDate?: string
) {
  let planDays: StudyPlanDay[] = [];

  try {
    const provider = getAIProvider();
    const context = await buildStudentContext(userId);
    const aiPlan = await provider.generateStudyPlan(
      { subject, examDate: targetDate },
      context
    );
    if (aiPlan && aiPlan.schedule && aiPlan.schedule.length > 0) {
      planDays = aiPlan.schedule.map((d) => ({
        day: d.day,
        dateStr: d.dateStr || `Day ${d.day}`,
        topic: d.topic,
        tasks: d.tasks.map((t) => ({
          timeMin: t.timeMin,
          action: t.action,
          description: t.description,
        })),
      }));
    }
  } catch (err) {
    console.warn("[toolCreateStudyPlan] AI study plan failed, using fallback:", err);
  }

  if (planDays.length === 0) {
    planDays = [
      {
        day: 1,
        dateStr: "Day 1",
        topic: `${subject}: Foundations & Core Primitives`,
        tasks: [
          { timeMin: 15, action: "LEARN", description: "Review core definitions and architectural components." },
          { timeMin: 15, action: "PRACTICE", description: "Solve 3 foundational warm-up exercises." },
          { timeMin: 10, action: "QUIZ", description: "5-question CR diagnostic battle." },
          { timeMin: 5, action: "REVIEW", description: "Inspect misconceptions with CR." },
        ],
      },
    {
      day: 2,
      dateStr: "Day 2",
      topic: `${subject}: Key Invariants & Edge Cases`,
      tasks: [
        { timeMin: 20, action: "LEARN", description: "Study boundary conditions, null safety, and overflows." },
        { timeMin: 15, action: "PRACTICE", description: "Implement algorithms handling edge cases." },
        { timeMin: 10, action: "ARENA", description: "Timed battle against algorithm bosses." },
      ],
    },
    {
      day: 3,
      dateStr: "Day 3",
      topic: `${subject}: Weak Area Deep Dive`,
      tasks: [
        { timeMin: 25, action: "PRACTICE", description: "Targeted problem set on previously missed concepts." },
        { timeMin: 15, action: "REVIEW", description: "Active recall flashcard drill with CR." },
      ],
    },
    {
      day: 4,
      dateStr: "Day 4",
      topic: `${subject}: Mock Exam Simulation`,
      tasks: [
        { timeMin: 35, action: "MOCK_EXAM", description: "15-question comprehensive timed quiz trial." },
        { timeMin: 10, action: "ANALYSIS", description: "CR mastery score report & strategy revision." },
      ],
    },
  ];
}

  const created = await prisma.cRStudyPlan.create({
    data: {
      userId,
      subject,
      targetDate,
      planJson: JSON.stringify(planDays),
    },
  });

  return {
    planId: created.id,
    subject,
    targetDate,
    schedule: planDays,
  };
}

// 4. Tool: Generate an interactive revision pack
export async function toolCreateRevisionPack(
  userId: string,
  topic: string
) {
  let cards: RevisionCard[] = [];
  let summary = `Mastery pack for ${topic}. Contains high-yield formulas, trade-offs, and exam invariants.`;

  try {
    const provider = getAIProvider();
    const context = await buildStudentContext(userId);
    const aiRev = await provider.generateRevision(
      { topic, cardCount: 6 },
      context
    );
    if (aiRev && aiRev.cards && aiRev.cards.length > 0) {
      cards = aiRev.cards;
      if (aiRev.summary) summary = aiRev.summary;
    }
  } catch (err) {
    console.warn("[toolCreateRevisionPack] AI revision pack failed, using fallback:", err);
  }

  if (cards.length === 0) {
    cards = [
    {
      id: "rc-1",
      category: topic,
      front: `What is the core definition of ${topic}?`,
      back: `An essential mathematical or algorithmic primitive used to structure computations and optimize lookup and traversal times.`,
    },
    {
      id: "rc-2",
      category: "Complexity",
      front: `What is the typical time and space trade-off for ${topic}?`,
      back: `Often trades O(n) auxiliary memory (hash tables, memoization arrays, tree links) to achieve sub-linear or constant O(1)/O(log n) time access.`,
    },
    {
      id: "rc-3",
      category: "Pitfalls",
      front: `What are the most common exam traps in ${topic}?`,
      back: `Failing to verify base cases, neglecting duplicate values, and forgetting worst-case degradation on skewed inputs.`,
    },
    {
      id: "rc-4",
      category: "Rule of Thumb",
      front: `When should you select ${topic} over alternative strategies?`,
      back: `When input size N exceeds 10^4 and linear scans become computationally prohibitive in production or competitive arenas.`,
    },
  ];
}

  const pack = await prisma.cRRevisionPack.create({
    data: {
      userId,
      topic,
      summary,
      cardsJson: JSON.stringify(cards),
    },
  });

  return {
    packId: pack.id,
    topic,
    summary,
    cards,
  };
}