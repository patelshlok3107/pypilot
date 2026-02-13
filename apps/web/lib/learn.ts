import { Course, Lesson, Module } from "@/lib/types";

export type LearnNotebookPage = {
  type: "text" | "code" | "diagram";
  content: string;
  language?: string;
};

export type LearnChapter = {
  id: string;
  lessonId: number;
  title: string;
  objective: string;
  estimatedMinutes: number;
  xpReward: number;
  completed: boolean;
  isAdvanced: boolean;
  locked: boolean;
  lockReason: string | null;
  contentMd: string;
  starterCode: string | null;
};

export type LearnCategory = {
  id: string;
  title: string;
  description: string;
  color: string;
  chapters: number;
  completedLessons: number;
  progressPercent: number;
  isAdvanced: boolean;
  locked: boolean;
  lockReason: string | null;
  chaptersList: LearnChapter[];
};

export type ModuleGate = {
  module_id: number;
  unlocked: boolean;
  mastered: boolean;
  average_quiz_score: number;
  lessons_completed: number;
  total_lessons: number;
  challenges_passed: number;
};

const MODULE_COLORS = [
  "from-green-400 to-emerald-600",
  "from-cyan-400 to-blue-600",
  "from-indigo-400 to-violet-600",
  "from-orange-400 to-amber-600",
  "from-rose-400 to-red-600",
  "from-fuchsia-400 to-pink-600",
  "from-lime-400 to-green-600",
  "from-sky-400 to-indigo-600",
];

const ADVANCED_KEYWORDS = [
  "advanced",
  "internals",
  "metaclass",
  "concurrency",
  "async",
  "decorator",
  "generator",
  "profiling",
  "optimization",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isAdvancedModule(module: Module): boolean {
  const moduleTitle = normalize(module.title);
  if (ADVANCED_KEYWORDS.some((keyword) => moduleTitle.includes(keyword))) {
    return true;
  }

  return module.xp_reward >= 220;
}

function isAdvancedLesson(module: Module, lesson: Lesson): boolean {
  if (isAdvancedModule(module)) {
    return true;
  }

  const lessonTitle = normalize(lesson.title);
  if (ADVANCED_KEYWORDS.some((keyword) => lessonTitle.includes(keyword))) {
    return true;
  }

  return lesson.coding_challenges.some((challenge) => normalize(challenge.difficulty) === "hard");
}

function lessonXp(lesson: Lesson): number {
  const challengeXp = lesson.coding_challenges.reduce((max, challenge) => Math.max(max, challenge.xp_reward), 0);
  return challengeXp > 0 ? challengeXp : 60;
}

function starterCode(lesson: Lesson): string | null {
  const firstChallenge = lesson.coding_challenges[0];
  if (!firstChallenge || !firstChallenge.starter_code) {
    return null;
  }
  return firstChallenge.starter_code;
}

export function buildLearnCategories(
  courses: Course[],
  completedLessonIds: number[],
  canAccessAdvancedTopics: boolean,
  moduleGates: Record<number, ModuleGate> = {}
): LearnCategory[] {
  const completedSet = new Set(completedLessonIds);
  const categories: LearnCategory[] = [];
  let colorIndex = 0;

  const sortedCourses = [...courses].sort((a, b) => a.order_index - b.order_index);
  for (const course of sortedCourses) {
    const sortedModules = [...course.modules].sort((a, b) => a.order_index - b.order_index);
    for (const module of sortedModules) {
      const moduleAdvanced = isAdvancedModule(module);
      const gate = moduleGates[module.id];
      const moduleLockedByAdvanced = moduleAdvanced && !canAccessAdvancedTopics;
      const moduleLockedByMastery = gate ? !gate.unlocked : false;
      const moduleLocked = moduleLockedByAdvanced || moduleLockedByMastery;
      let moduleLockReason: string | null = null;
      if (moduleLockedByAdvanced) {
        moduleLockReason = "Advanced module lock";
      } else if (moduleLockedByMastery) {
        moduleLockReason = "Mastery gate lock";
      }
      const sortedLessons = [...module.lessons].sort((a, b) => a.order_index - b.order_index);

      const chaptersList: LearnChapter[] = sortedLessons.map((lesson) => {
        const lessonAdvanced = isAdvancedLesson(module, lesson);
        const lessonLockedByAdvanced = lessonAdvanced && !canAccessAdvancedTopics;
        const lessonLocked = moduleLocked || lessonLockedByAdvanced;
        const lessonLockReason = lessonLockedByAdvanced
          ? "Advanced lesson lock"
          : moduleLockReason;
        return {
          id: lesson.id.toString(),
          lessonId: lesson.id,
          title: lesson.title,
          objective: lesson.objective,
          estimatedMinutes: lesson.estimated_minutes,
          xpReward: lessonXp(lesson),
          completed: completedSet.has(lesson.id),
          isAdvanced: lessonAdvanced,
          locked: lessonLocked,
          lockReason: lessonLockReason,
          contentMd: lesson.content_md,
          starterCode: starterCode(lesson),
        };
      });

      const completedLessons = chaptersList.filter((chapter) => chapter.completed).length;
      const totalLessons = chaptersList.length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      categories.push({
        id: module.id.toString(),
        title: module.title,
        description: module.description,
        color: MODULE_COLORS[colorIndex % MODULE_COLORS.length],
        chapters: totalLessons,
        completedLessons,
        progressPercent,
        isAdvanced: moduleAdvanced,
        locked: moduleLocked,
        lockReason: moduleLockReason,
        chaptersList,
      });

      colorIndex += 1;
    }
  }

  return categories;
}

export function parseNotebookPages(
  contentMd: string,
  objective: string,
  codeSample: string | null
): LearnNotebookPage[] {
  const pages: LearnNotebookPage[] = [];
  const markdown = contentMd?.trim() ?? "";
  const codeRegex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;

  let cursor = 0;
  let match = codeRegex.exec(markdown);
  while (match) {
    const textChunk = markdown.slice(cursor, match.index).trim();
    if (textChunk) {
      pages.push({ type: "text", content: textChunk });
    }

    const language = match[1]?.trim() || "python";
    const codeChunk = match[2]?.trim();
    if (codeChunk) {
      pages.push({ type: "code", language, content: codeChunk });
    }

    cursor = match.index + match[0].length;
    match = codeRegex.exec(markdown);
  }

  const trailingText = markdown.slice(cursor).trim();
  if (trailingText) {
    pages.push({ type: "text", content: trailingText });
  }

  if (codeSample?.trim()) {
    pages.push({
      type: "code",
      language: "python",
      content: codeSample.trim(),
    });
  }

  if (objective.trim()) {
    pages.push({
      type: "text",
      content: `## Lesson Goal\n${objective}`,
    });
  }

  if (pages.length === 0) {
    return [
      {
        type: "text",
        content: "# Lesson\nThis lesson content is not available yet.",
      },
    ];
  }

  return pages;
}
