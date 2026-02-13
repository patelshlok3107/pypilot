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

async function mockSignedInCore(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUser),
    });
  });

  await page.route("**/api/onboarding/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ onboarding_complete: true }),
    });
  });

  await page.route("**/api/users/me/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total_lessons: 0,
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
      }),
    });
  });
}

test("ai tutor keeps old chat features and shows voice controls", async ({ page }) => {
  await mockSignedInCore(page);

  await page.route("**/api/ai-tutor/chat", async (route) => {
    const payload = route.request().postDataJSON() as { message?: string };
    const sourceMessage = payload.message || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        role: "assistant",
        mode: "general",
        status: "success",
        content: `Tutor reply: ${sourceMessage.slice(0, 80)}`,
      }),
    });
  });

  await page.goto("/ai-tutor");

  await expect(page.getByRole("button", { name: "New Chat", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Voice Input", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Voice Reply On", exact: true })).toBeVisible();

  await page.getByPlaceholder("Ask me anything about Python...").fill("Explain Python functions");
  await page.keyboard.press("Enter");

  await expect(page.locator("p.whitespace-pre-wrap", { hasText: /^Explain Python functions$/ })).toBeVisible();
  await expect(page.locator("p.whitespace-pre-wrap", { hasText: "Tutor reply:" })).toBeVisible();

  await page.getByRole("button", { name: "New Chat", exact: true }).click();
  await expect(page.getByRole("button", { name: "New Chat", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Voice Input", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explain Python functions" })).toBeVisible();
});

test("ai tutor falls back when local tutor reports Ollama unavailable", async ({ page }) => {
  await mockSignedInCore(page);

  await page.route("**/api/ai-tutor/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        role: "assistant",
        mode: "general",
        status: "success",
        content:
          "Local AI tutor is not available. Please start Ollama:\n1. Install: https://ollama.ai\n2. Run: ollama serve\n3. Download model: ollama pull mistral",
      }),
    });
  });

  await page.route("https://api.poe.com/v1/chat/completions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: "Fallback tutor reply is working.",
            },
          },
        ],
      }),
    });
  });

  await page.goto("/ai-tutor");
  await page.getByPlaceholder("Ask me anything about Python...").fill("What is recursion?");
  await page.keyboard.press("Enter");

  await expect(page.locator("p.whitespace-pre-wrap", { hasText: "Fallback tutor reply is working." })).toBeVisible();
});
