import { expect, test, type Page } from "@playwright/test";

const mockUser = {
  id: "user-1",
  email: "learner@example.com",
  full_name: "Learner One",
  xp: 120,
  level: 2,
  streak_days: 3,
  is_admin: false,
};

const mockDashboard = {
  total_lessons: 2,
  completed_lessons: 0,
  completion_rate: 0,
  xp: 120,
  level: 2,
  streak_days: 3,
  daily_xp: 0,
  weekly_xp: 0,
  weekly_goal_progress: 0,
  completed_lesson_ids: [],
  active_track: null,
  completed_milestones: 0,
  squad_name: null,
  subscription_status: "free",
  earned_advanced_access: false,
  can_access_advanced_topics: true,
  advanced_unlock_xp_required: 1800,
  advanced_unlock_lessons_required: 12,
};

const mockCourses = [
  {
    id: 1,
    slug: "python-core",
    title: "Python Core",
    description: "Core track",
    difficulty: "beginner",
    order_index: 1,
    modules: [
      {
        id: 1,
        title: "Foundations",
        description: "Core basics",
        order_index: 1,
        xp_reward: 100,
        lessons: [
          {
            id: 1,
            title: "Variables",
            objective: "Understand variables",
            content_md:
              "Variables store values.\n\n```python\nx = 1\nprint(x)\n```",
            order_index: 1,
            estimated_minutes: 1,
            quiz_questions: [],
            coding_challenges: [
              {
                id: 10,
                title: "Variables Challenge",
                prompt: "Write a variable",
                starter_code: "x = 1\nprint(x)",
                difficulty: "easy",
                xp_reward: 50,
              },
            ],
          },
        ],
      },
    ],
  },
];

const mockGates = [
  {
    module_id: 1,
    unlocked: true,
    mastered: false,
    average_quiz_score: 0,
    lessons_completed: 0,
    total_lessons: 1,
    challenges_passed: 0,
  },
];

const mockRecommendation = {
  lesson_id: 1,
  lesson_title: "Variables",
  lesson_objective: "Understand variables",
  module_id: 1,
  module_title: "Foundations",
  reason: "Recommended due to weak quiz/challenge performance.",
  unlock_reason: null,
};

async function mockSignedInCore(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockUser) });
  });
  await page.route("**/api/onboarding/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        onboarding_complete: true,
        learning_goal: null,
        diagnostic_score: null,
        recommended_track_slug: null,
        ai_credits_remaining: 20,
      }),
    });
  });
  await page.route("**/api/users/me/dashboard", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockDashboard) });
  });
}

async function mockLearnApis(page: Page) {
  await mockSignedInCore(page);
  await page.route("**/api/courses/catalog", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockCourses) });
  });
  await page.route("**/api/learning/gates", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockGates) });
  });
  await page.route("**/api/learning/recommendation", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockRecommendation) });
  });
}

test("signup redirects to dashboard", async ({ page }) => {
  await mockSignedInCore(page);
  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "httpOnly-cookie",
        token_type: "bearer",
        user: mockUser,
      }),
    });
  });

  await page.goto("/signup");
  await page.getByPlaceholder("Full Name").fill("Learner One");
  await page.getByPlaceholder("Email Address").fill("learner@example.com");
  await page.getByPlaceholder("Password").fill("StrongPass123");
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test("login redirects to learn and loads recommendation", async ({ page }) => {
  await mockLearnApis(page);
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "httpOnly-cookie",
        token_type: "bearer",
        user: mockUser,
      }),
    });
  });

  await page.goto("/login?next=%2Flearn");
  await page.getByPlaceholder("Email Address").fill("learner@example.com");
  await page.getByPlaceholder("Password").fill("StrongPass123");
  await page.getByRole("button", { name: "Log In" }).click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByText("Recommended Next Lesson")).toBeVisible();
  await expect(page.getByText("Variables")).toBeVisible();
});

test("lesson completion sends real attempt metadata", async ({ page }) => {
  await mockLearnApis(page);

  let startPayload: Record<string, unknown> | null = null;
  const heartbeatPayloads: Record<string, unknown>[] = [];
  let completionPayload: Record<string, unknown> | null = null;

  await page.route("**/api/learning/lessons/1/attempts/start", async (route) => {
    startPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        attempt_id: 101,
        lesson_id: 1,
        status: "started",
        dwell_seconds: 0,
        challenge_passed: false,
        anti_fake_passed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  });

  await page.route("**/api/learning/lessons/1/attempts/heartbeat", async (route) => {
    heartbeatPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        attempt_id: 101,
        lesson_id: 1,
        status: "in_progress",
        dwell_seconds: 60,
        challenge_passed: false,
        anti_fake_passed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  });

  await page.route("**/api/progress/lessons/1/complete", async (route) => {
    completionPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        lesson_id: 1,
        status: "completed",
        xp_awarded: 60,
        level: 2,
        total_xp: 180,
      }),
    });
  });

  await page.goto("/learn/1/1");
  await expect(page.getByRole("heading", { name: "Variables" })).toBeVisible();

  for (let i = 0; i < 6; i += 1) {
    const nextButton = page.getByRole("button", { name: /Next Page|Finish/ });
    await expect(nextButton).toBeVisible();
    const label = (await nextButton.textContent()) || "";
    await nextButton.click();
    if (label.includes("Finish")) {
      break;
    }
  }

  await expect(page).toHaveURL(/\/learn\/1$/);

  expect(startPayload).not.toBeNull();
  expect(completionPayload).not.toBeNull();
  const capturedCompletion = completionPayload as
    | { attempt_id?: number; dwell_seconds?: number }
    | null;
  if (!capturedCompletion) {
    throw new Error("Completion payload was not captured");
  }
  expect(capturedCompletion.attempt_id).toBe(101);
  expect(Number(capturedCompletion.dwell_seconds ?? 0)).toBeGreaterThanOrEqual(0);
  expect(heartbeatPayloads.length).toBeGreaterThan(0);
});
