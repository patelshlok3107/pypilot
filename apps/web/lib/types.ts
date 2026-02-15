export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  xp: number;
  level: number;
  streak_days: number;
  is_admin: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type DashboardStats = {
  total_lessons: number;
  completed_lessons: number;
  completion_rate: number;
  xp: number;
  level: number;
  streak_days: number;
  weekly_goal_progress: number;
  active_track: string | null;
  completed_milestones: number;
  squad_name: string | null;
  subscription_status: string | null;
};

export type UserEntitlements = {
  plan_tier: string;
  subscription_status: string;
  can_access_premium: boolean;
  ai_credits_remaining: number;
  priority_debug_queue: boolean;
};

export type QuizQuestion = {
  id: number;
  prompt: string;
  options: string[];
  correct_option: number;
  explanation: string;
};

export type CodingChallenge = {
  id: number;
  title: string;
  prompt: string;
  starter_code: string;
  difficulty: string;
  xp_reward: number;
};

export type Lesson = {
  id: number;
  title: string;
  objective: string;
  content_md: string;
  order_index: number;
  estimated_minutes: number;
  quiz_questions: QuizQuestion[];
  coding_challenges: CodingChallenge[];
};

export type Module = {
  id: number;
  title: string;
  description: string;
  order_index: number;
  xp_reward: number;
  lessons: Lesson[];
};

export type Course = {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  order_index: number;
  modules: Module[];
};

export type LessonPremiumCompanyUse = {
  concept: string;
  project_example: string;
  architecture: string[];
  career_relevance: string;
  salary_relevance: string;
  tools: string[];
};

export type LessonPremiumInsight = {
  lesson_id: number;
  topic: string;
  analogy: string;
  mental_model: string;
  step_reasoning: string[];
  level_breakdown: string[];
  professional_care: string;
  expert_insights: string[];
  case_study: string;
  pro_tips: string[];
  performance_tricks: string[];
  production_scenarios: string[];
  company_use: LessonPremiumCompanyUse;
  summary: string;
};

export type GamificationSummary = {
  xp: number;
  level: number;
  streak_days: number;
  next_level_xp: number;
  leaderboard_rank: number | null;
};

export type Achievement = {
  id: number;
  code: string;
  name: string;
  description: string;
  xp_bonus: number;
  icon: string;
  unlocked: boolean;
};

export type DailyMission = {
  mission_id: number;
  title: string;
  description: string;
  xp_reward: number;
  completed: boolean;
};

export type MonthlyReport = {
  id: string;
  report_month: string;
  skill_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_plan: string[];
  generated_at: string;
};

export type PremiumReportInsight = {
  report_month: string;
  generated_at: string;
  diagnostics: string[];
  risk_flags: string[];
  career_actions: string[];
  tools_used_in_companies: string[];
  next_30_day_blueprint: string[];
  company_benchmark_note: string;
};

export type CodeRunResponse = {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  ai_error_explanation: string | null;
};

export type OnboardingQuestion = {
  id: number;
  prompt: string;
  options: string[];
};

export type OnboardingQuestionsResponse = {
  goals: string[];
  questions: OnboardingQuestion[];
};

export type OnboardingStatus = {
  onboarding_complete: boolean;
  learning_goal: string | null;
  diagnostic_score: number | null;
  recommended_track_slug: string | null;
  ai_credits_remaining: number;
};

export type LearningTrack = {
  id: number;
  slug: string;
  name: string;
  description: string;
  outcome: string;
  target_audience: string;
  premium_only: boolean;
  enrolled: boolean;
  readiness_score: number;
};

export type TrackMilestone = {
  id: number;
  title: string;
  description: string;
  required_lessons: number;
  required_avg_quiz_score: number;
  required_challenges_passed: number;
  reward_xp: number;
  order_index: number;
  completed: boolean;
};

export type MilestoneCompleteResponse = {
  milestone_id: number;
  completed: boolean;
  completion_score: number;
  xp_awarded: number;
};

export type TranscriptOut = {
  total_lessons_completed: number;
  average_quiz_score: number;
  challenges_passed: number;
  current_level: number;
  total_xp: number;
  enrolled_tracks: string[];
};

export type PlanPriceOut = {
  code: string;
  label: string;
  amount_usd: number;
  billing_cycle: string;
  features: string[];
};

export type PricingPreviewResponse = {
  base_amount_usd: number;
  discount_percent: number;
  final_amount_usd: number;
  applied_promo_code: string | null;
};

export type SquadMember = {
  user_id: string;
  full_name: string;
  role: string;
  lessons_completed_week: number;
  goal_target: number;
};

export type SquadOut = {
  squad_id: string;
  name: string;
  join_code: string;
  weekly_goal_lessons: number;
  members: SquadMember[];
};

export type SquadLeaderboardRow = {
  squad_id: string;
  squad_name: string;
  total_lessons_week: number;
  members_count: number;
};

export type CampaignMessageOut = {
  id: number;
  campaign_type: string;
  status: string;
  channel: string;
  scheduled_for: string;
};

export type CertificateVerificationResponse = {
  valid: boolean;
  certificate_title?: string;
  learner_name?: string;
  issued_at?: string;
};
