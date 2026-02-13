const TOKEN_KEY = "pypilot_access_token";
const USER_KEY = "pypilot_user";

export function setAuth(user: unknown): void {
  // Cookie-based auth: keep lightweight user cache for UI only.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network failures; local logout state is already cleared.
  }
}

export function getToken(): string | null {
  // Backward compatibility: no longer used for auth after cookie migration.
  return null;
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
