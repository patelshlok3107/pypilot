"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type {
  LearningTrack,
  MilestoneCompleteResponse,
  TrackMilestone,
  TranscriptOut,
  UserEntitlements,
} from "@/lib/types";

type CertificateResponse = {
  certificate_id: string;
  title: string;
  verification_code: string;
  issued_at: string;
};

export default function TracksPage() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [milestones, setMilestones] = useState<TrackMilestone[]>([]);
  const [transcript, setTranscript] = useState<TranscriptOut | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [trackData, entitlementData, transcriptData] = await Promise.all([
        apiFetch<LearningTrack[]>("/tracks"),
        apiFetch<UserEntitlements>("/users/me/entitlements"),
        apiFetch<TranscriptOut>("/trust/transcript/me"),
      ]);
      setTracks(trackData);
      setEntitlements(entitlementData);
      setTranscript(transcriptData);
      if (!selectedTrack && trackData.length > 0) {
        setSelectedTrack(trackData[0].slug);
      }
    } catch {
      setError("Unable to load tracks.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    async function loadMilestones() {
      if (!selectedTrack) return;
      try {
        setError("");
        setMessage("");
        const data = await apiFetch<TrackMilestone[]>(`/tracks/${selectedTrack}/milestones`);
        setMilestones(data);
      } catch (err) {
        setMilestones([]);
        if (err instanceof Error && err.message.toLowerCase().includes("upgrade")) {
          setMessage("Premium milestone map is locked. Upgrade to unlock full track execution guidance.");
        }
      }
    }
    loadMilestones();
  }, [selectedTrack]);

  const selectedTrackData = useMemo(
    () => tracks.find((track) => track.slug === selectedTrack) || null,
    [selectedTrack, tracks],
  );
  const selectedTrackLocked = Boolean(
    selectedTrackData?.premium_only && !entitlements?.can_access_premium,
  );

  async function enroll(trackSlug: string) {
    setError("");
    setMessage("");
    try {
      await apiFetch("/tracks/enroll", {
        method: "POST",
        body: JSON.stringify({ track_slug: trackSlug }),
      });
      setMessage("Track enrolled successfully.");
      await load();
      setSelectedTrack(trackSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enroll in track.");
    }
  }

  async function completeMilestone(milestoneId: number) {
    setError("");
    setMessage("");
    try {
      const result = await apiFetch<MilestoneCompleteResponse>(`/tracks/milestones/${milestoneId}/complete`, {
        method: "POST",
      });
      setMessage(`Milestone completed. +${result.xp_awarded} XP`);
      if (selectedTrack) {
        const refreshed = await apiFetch<TrackMilestone[]>(`/tracks/${selectedTrack}/milestones`);
        setMilestones(refreshed);
      }
      const refreshedTranscript = await apiFetch<TranscriptOut>("/trust/transcript/me");
      setTranscript(refreshedTranscript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete milestone.");
    }
  }

  async function generateCertificate() {
    if (!selectedTrack) return;
    setError("");
    setMessage("");
    try {
      const certificate = await apiFetch<CertificateResponse>("/trust/certificates/generate", {
        method: "POST",
        body: JSON.stringify({ track_slug: selectedTrack }),
      });
      setMessage(`Certificate issued: ${certificate.verification_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate certificate.");
    }
  }

  if (error && tracks.length === 0) return <p className="text-red-300">{error}</p>;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-semibold">Learning Tracks</h1>
        <p className="mt-1 text-sm text-slate-300">
          Follow focused roadmaps with milestones, readiness scores, and completion certificates.
        </p>
        {entitlements && (
          <p className="mt-2 text-sm text-brand-200">
            Plan: {entitlements.plan_tier} | AI credits today: {entitlements.ai_credits_remaining}
          </p>
        )}
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {tracks.map((track) => (
            <Card key={track.slug} className={track.slug === selectedTrack ? "border-brand-300/40" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{track.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">{track.description}</p>
                  <p className="mt-2 text-xs text-slate-400">Outcome: {track.outcome}</p>
                  <p className="mt-1 text-xs text-slate-400">Audience: {track.target_audience}</p>
                  <p className="mt-1 text-xs text-slate-400">Readiness: {track.readiness_score}%</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSelectedTrack(track.slug)}>
                    View
                  </Button>
                  <Button
                    onClick={() => enroll(track.slug)}
                    disabled={track.enrolled}
                    variant={track.premium_only ? "secondary" : "primary"}
                  >
                    {track.enrolled ? "Enrolled" : track.premium_only ? "Enroll (Premium)" : "Enroll"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold">Milestones</h3>
            {selectedTrackData ? (
              <p className="mb-3 mt-1 text-sm text-slate-300">{selectedTrackData.name}</p>
            ) : null}
            {selectedTrackLocked ? (
              <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-50">
                  Premium milestones include readiness checkpoints, scoring standards, and project-grade completion criteria.
                </p>
                <div className="mt-2 space-y-1 text-xs text-amber-100">
                  <p>- Hiring-focused rubric checkpoints</p>
                  <p>- Architecture review milestones</p>
                  <p>- Certificate path linked to real execution quality</p>
                </div>
                <Button className="mt-3" variant="secondary" onClick={() => window.location.assign("/settings")}>
                  Unlock Premium Track Map
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{milestone.title}</p>
                        <span className="text-xs text-brand-200">+{milestone.reward_xp} XP</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{milestone.description}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Requires {milestone.required_lessons} lessons, {milestone.required_avg_quiz_score}% avg quiz,{" "}
                        {milestone.required_challenges_passed} challenge passes.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          className="px-3 py-1 text-xs"
                          disabled={milestone.completed}
                          onClick={() => completeMilestone(milestone.id)}
                        >
                          {milestone.completed ? "Completed" : "Claim Milestone"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="mt-3" variant="secondary" onClick={generateCertificate} disabled={!selectedTrack}>
                  Generate Certificate
                </Button>
              </>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Transcript Snapshot</h3>
            {transcript ? (
              <div className="mt-2 space-y-1 text-sm text-slate-200">
                <p>Total lessons completed: {transcript.total_lessons_completed}</p>
                <p>Average quiz score: {transcript.average_quiz_score}%</p>
                <p>Challenges passed: {transcript.challenges_passed}</p>
                <p>Current level: {transcript.current_level}</p>
                <p>Total XP: {transcript.total_xp}</p>
                <p>Tracks: {transcript.enrolled_tracks.join(", ") || "None yet"}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No transcript yet.</p>
            )}
          </Card>
        </div>
      </section>

      {message && <p className="text-sm text-brand-200">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
