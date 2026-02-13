"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type {
  LearningTrack,
  OnboardingQuestionsResponse,
  OnboardingStatus,
} from "@/lib/types";

type CompletePayload = {
  learning_goal: string;
  selected_track_slug: string | null;
  parent_email: string | null;
  answers: number[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<OnboardingQuestionsResponse | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [learningGoal, setLearningGoal] = useState("");
  const [selectedTrackSlug, setSelectedTrackSlug] = useState<string>("");
  const [parentEmail, setParentEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [questionData, statusData, trackData] = await Promise.all([
          apiFetch<OnboardingQuestionsResponse>("/onboarding/questions"),
          apiFetch<OnboardingStatus>("/onboarding/status"),
          apiFetch<LearningTrack[]>("/tracks"),
        ]);

        setQuestions(questionData);
        setStatus(statusData);
        setTracks(trackData);
        setLearningGoal(statusData.learning_goal || questionData.goals[0] || "School/College Python");
        setSelectedTrackSlug(statusData.recommended_track_slug || "");
      } catch {
        setError("Unable to load onboarding form.");
      }
    }

    load();
  }, []);

  const orderedAnswers = useMemo(() => {
    if (!questions) return [];
    return questions.questions.map((question) => answers[question.id] ?? -1);
  }, [answers, questions]);

  async function submit() {
    if (!questions) return;

    if (!learningGoal.trim()) {
      setError("Please choose a learning goal.");
      return;
    }

    const unanswered = orderedAnswers.some((answer) => answer < 0);
    if (unanswered) {
      setError("Please answer all diagnostic questions.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: CompletePayload = {
        learning_goal: learningGoal,
        selected_track_slug: selectedTrackSlug || null,
        parent_email: parentEmail.trim() || null,
        answers: orderedAnswers,
      };

      const completion = await apiFetch<OnboardingStatus>("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (completion.recommended_track_slug) {
        await apiFetch("/tracks/enroll", {
          method: "POST",
          body: JSON.stringify({ track_slug: completion.recommended_track_slug }),
        }).catch(() => null);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding submission failed.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !questions) {
    return <p className="text-red-300">{error}</p>;
  }

  if (!questions || !status) {
    return <p className="text-slate-300">Loading onboarding...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-brand-500/20 via-slate-900/80 to-slate-900/80">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Welcome</p>
        <h1 className="mt-2 text-2xl font-semibold">Set up your Python learning profile</h1>
        <p className="mt-2 text-sm text-slate-200">
          We will personalize your lessons, AI hints, and milestone roadmap using this quick setup.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Learning Goal</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {questions.goals.map((goal) => (
            <button
              key={goal}
              onClick={() => setLearningGoal(goal)}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                learningGoal === goal
                  ? "border-brand-300/60 bg-brand-500/20 text-brand-100"
                  : "border-white/10 bg-slate-950/60 text-slate-200 hover:bg-white/10"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Recommended Track (Optional Override)</h2>
        <select
          value={selectedTrackSlug}
          onChange={(event) => setSelectedTrackSlug(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
        >
          <option value="">Auto recommend for me</option>
          {tracks.map((track) => (
            <option key={track.slug} value={track.slug}>
              {track.name} {track.premium_only ? "(Premium)" : "(Free)"}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Parent Email (Optional)</h2>
        <input
          type="email"
          value={parentEmail}
          onChange={(event) => setParentEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
          placeholder="parent@example.com"
        />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Diagnostic Quiz</h2>
        <div className="space-y-4">
          {questions.questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="mb-2 text-sm font-medium">Q{question.id}. {question.prompt}</p>
              <div className="grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const active = answers[question.id] === optionIndex;
                  return (
                    <button
                      key={`${question.id}-${option}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      className={`rounded-lg px-3 py-2 text-left text-sm ${
                        active
                          ? "bg-brand-500/20 text-brand-100"
                          : "bg-slate-900 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving profile..." : "Finish Onboarding"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
