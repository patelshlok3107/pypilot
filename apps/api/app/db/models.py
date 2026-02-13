from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(120))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # OAuth fields for social login
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)  # google, github, twitter, facebook
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Provider-specific user ID
    oauth_access_token: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lesson_progress: Mapped[list[LessonProgress]] = relationship(back_populates="user")
    submissions: Mapped[list[Submission]] = relationship(back_populates="user")
    achievements: Mapped[list[UserAchievement]] = relationship(back_populates="user")
    reports: Mapped[list[MonthlyReport]] = relationship(back_populates="user")
    subscriptions: Mapped[list[Subscription]] = relationship(back_populates="user")
    user_missions: Mapped[list[UserMission]] = relationship(back_populates="user")
    lesson_attempts: Mapped[list[LessonAttempt]] = relationship(back_populates="user")
    event_logs: Mapped[list[EventLog]] = relationship(back_populates="user")
    wallet: Mapped[UserWallet | None] = relationship(back_populates="user", uselist=False)
    economy_transactions: Mapped[list[EconomyTransaction]] = relationship(back_populates="user")
    referral_invites: Mapped[list[ReferralInvite]] = relationship(
        back_populates="inviter",
        foreign_keys="ReferralInvite.inviter_user_id",
    )
    premium_access_grants: Mapped[list[PremiumAccessGrant]] = relationship(back_populates="user")
    project_assessments: Mapped[list[ProjectAssessment]] = relationship(back_populates="user")
    tutor_memories: Mapped[list[AITutorMemory]] = relationship(back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(50))
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)

    modules: Mapped[list[Module]] = relationship(back_populates="course", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50)

    course: Mapped[Course] = relationship(back_populates="modules")
    lessons: Mapped[list[Lesson]] = relationship(back_populates="module", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    objective: Mapped[str] = mapped_column(String(300))
    content_md: Mapped[str] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=10)

    module: Mapped[Module] = relationship(back_populates="lessons")
    quiz_questions: Mapped[list[QuizQuestion]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    coding_challenges: Mapped[list[CodingChallenge]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    progress_records: Mapped[list[LessonProgress]] = relationship(back_populates="lesson")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str]] = mapped_column(JSON)
    correct_option: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str] = mapped_column(Text)

    lesson: Mapped[Lesson] = relationship(back_populates="quiz_questions")


class CodingChallenge(Base):
    __tablename__ = "coding_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    prompt: Mapped[str] = mapped_column(Text)
    starter_code: Mapped[str] = mapped_column(Text)
    tests_json: Mapped[list[dict]] = mapped_column(JSON)
    difficulty: Mapped[str] = mapped_column(String(50))
    xp_reward: Mapped[int] = mapped_column(Integer, default=100)

    lesson: Mapped[Lesson] = relationship(back_populates="coding_challenges")
    submissions: Mapped[list[Submission]] = relationship(back_populates="challenge")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_lesson_progress"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="not_started")
    quiz_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    challenge_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="lesson_progress")
    lesson: Mapped[Lesson] = relationship(back_populates="progress_records")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    challenge_id: Mapped[int | None] = mapped_column(
        ForeignKey("coding_challenges.id", ondelete="SET NULL"), nullable=True
    )
    code: Mapped[str] = mapped_column(Text)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="submissions")
    challenge: Mapped[CodingChallenge | None] = relationship(back_populates="submissions")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    xp_bonus: Mapped[int] = mapped_column(Integer, default=50)
    icon: Mapped[str] = mapped_column(String(30), default="trophy")

    users: Mapped[list[UserAchievement]] = relationship(back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"), index=True)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="achievements")
    achievement: Mapped[Achievement] = relationship(back_populates="users")


class DailyMission(Base):
    __tablename__ = "daily_missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mission_date: Mapped[date] = mapped_column(Date, index=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    xp_reward: Mapped[int] = mapped_column(Integer, default=20)

    user_missions: Mapped[list[UserMission]] = relationship(back_populates="mission")


class UserMission(Base):
    __tablename__ = "user_missions"
    __table_args__ = (UniqueConstraint("user_id", "mission_id", name="uq_user_mission"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    mission_id: Mapped[int] = mapped_column(ForeignKey("daily_missions.id", ondelete="CASCADE"), index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="user_missions")
    mission: Mapped[DailyMission] = relationship(back_populates="user_missions")


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    report_month: Mapped[str] = mapped_column(String(7), index=True)
    skill_score: Mapped[int] = mapped_column(Integer)
    strengths: Mapped[list[str]] = mapped_column(JSON)
    weaknesses: Mapped[list[str]] = mapped_column(JSON)
    improvement_plan: Mapped[list[str]] = mapped_column(JSON)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="reports")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    stripe_customer_id: Mapped[str] = mapped_column(String(120), index=True)
    stripe_subscription_id: Mapped[str] = mapped_column(String(120), unique=True)
    plan: Mapped[str] = mapped_column(String(50), default="pro")
    status: Mapped[str] = mapped_column(String(40), default="incomplete")
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="subscriptions")


class UserLearningProfile(Base):
    __tablename__ = "user_learning_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    learning_goal: Mapped[str | None] = mapped_column(String(80), nullable=True)
    diagnostic_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recommended_track_slug: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ai_credits_remaining: Mapped[int] = mapped_column(Integer, default=20)
    ai_credits_reset_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    parent_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship()


class LearningTrack(Base):
    __tablename__ = "learning_tracks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text)
    outcome: Mapped[str] = mapped_column(Text)
    target_audience: Mapped[str] = mapped_column(String(120))
    premium_only: Mapped[bool] = mapped_column(Boolean, default=True)
    order_index: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lessons: Mapped[list[TrackLesson]] = relationship(
        back_populates="track", cascade="all, delete-orphan"
    )
    milestones: Mapped[list[TrackMilestone]] = relationship(
        back_populates="track", cascade="all, delete-orphan"
    )


class TrackLesson(Base):
    __tablename__ = "track_lessons"
    __table_args__ = (UniqueConstraint("track_id", "lesson_id", name="uq_track_lesson"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    track_id: Mapped[int] = mapped_column(ForeignKey("learning_tracks.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=1)

    track: Mapped[LearningTrack] = relationship(back_populates="lessons")
    lesson: Mapped[Lesson] = relationship()


class UserTrackEnrollment(Base):
    __tablename__ = "user_track_enrollments"
    __table_args__ = (UniqueConstraint("user_id", "track_id", name="uq_user_track_enrollment"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    track_id: Mapped[int] = mapped_column(
        ForeignKey("learning_tracks.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(30), default="active")
    readiness_score: Mapped[int] = mapped_column(Integer, default=0)
    completed_milestones: Mapped[int] = mapped_column(Integer, default=0)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship()
    track: Mapped[LearningTrack] = relationship()


class TrackMilestone(Base):
    __tablename__ = "track_milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    track_id: Mapped[int] = mapped_column(ForeignKey("learning_tracks.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    required_lessons: Mapped[int] = mapped_column(Integer, default=1)
    required_avg_quiz_score: Mapped[int] = mapped_column(Integer, default=70)
    required_challenges_passed: Mapped[int] = mapped_column(Integer, default=1)
    reward_xp: Mapped[int] = mapped_column(Integer, default=120)
    order_index: Mapped[int] = mapped_column(Integer, default=1)

    track: Mapped[LearningTrack] = relationship(back_populates="milestones")


class UserMilestoneCompletion(Base):
    __tablename__ = "user_milestone_completions"
    __table_args__ = (UniqueConstraint("user_id", "milestone_id", name="uq_user_milestone_completion"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    milestone_id: Mapped[int] = mapped_column(
        ForeignKey("track_milestones.id", ondelete="CASCADE"), index=True
    )
    completion_score: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship()
    milestone: Mapped[TrackMilestone] = relationship()


class StudySquad(Base):
    __tablename__ = "study_squads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(120))
    join_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    weekly_goal_lessons: Mapped[int] = mapped_column(Integer, default=4)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship()
    members: Mapped[list[SquadMembership]] = relationship(
        back_populates="squad", cascade="all, delete-orphan"
    )


class SquadMembership(Base):
    __tablename__ = "squad_memberships"
    __table_args__ = (UniqueConstraint("squad_id", "user_id", name="uq_squad_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    squad_id: Mapped[str] = mapped_column(ForeignKey("study_squads.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(30), default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    squad: Mapped[StudySquad] = relationship(back_populates="members")
    user: Mapped[User] = relationship()


class SquadWeeklyProgress(Base):
    __tablename__ = "squad_weekly_progress"
    __table_args__ = (UniqueConstraint("squad_id", "user_id", "week_start", name="uq_squad_week_progress"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    squad_id: Mapped[str] = mapped_column(ForeignKey("study_squads.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    week_start: Mapped[date] = mapped_column(Date, index=True)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    goal_target: Mapped[int] = mapped_column(Integer, default=4)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    squad: Mapped[StudySquad] = relationship()
    user: Mapped[User] = relationship()


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(180), default="")
    discount_percent: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    max_redemptions: Mapped[int] = mapped_column(Integer, default=1000)
    redemptions_count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    student_only: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PromoRedemption(Base):
    __tablename__ = "promo_redemptions"
    __table_args__ = (UniqueConstraint("promo_code_id", "user_id", name="uq_promo_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    promo_code_id: Mapped[int] = mapped_column(ForeignKey("promo_codes.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    redeemed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    promo_code: Mapped[PromoCode] = relationship()
    user: Mapped[User] = relationship()


class LifecycleEvent(Base):
    __tablename__ = "lifecycle_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(80), index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship()


class CampaignMessage(Base):
    __tablename__ = "campaign_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    campaign_type: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(30), default="scheduled")
    channel: Mapped[str] = mapped_column(String(30), default="email")
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship()


class UserCertificate(Base):
    __tablename__ = "user_certificates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    track_id: Mapped[int | None] = mapped_column(
        ForeignKey("learning_tracks.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(180))
    verification_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship()
    track: Mapped[LearningTrack | None] = relationship()


class ParentReportDelivery(Base):
    __tablename__ = "parent_report_deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_email: Mapped[str] = mapped_column(String(255))
    report_month: Mapped[str] = mapped_column(String(7), index=True)
    status: Mapped[str] = mapped_column(String(30), default="queued")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship()


class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="started")
    dwell_seconds: Mapped[int] = mapped_column(Integer, default=0)
    quiz_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    challenge_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    anti_fake_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="lesson_attempts")
    lesson: Mapped[Lesson] = relationship()


class EventLog(Base):
    __tablename__ = "event_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    severity: Mapped[str] = mapped_column(String(20), default="info")
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped[User | None] = relationship(back_populates="event_logs")


class ModuleMastery(Base):
    __tablename__ = "module_mastery"
    __table_args__ = (UniqueConstraint("user_id", "module_id", name="uq_module_mastery"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    average_quiz_score: Mapped[int] = mapped_column(Integer, default=0)
    challenges_passed: Mapped[int] = mapped_column(Integer, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    mastery_threshold_met: Mapped[bool] = mapped_column(Boolean, default=False)
    unlocked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship()
    module: Mapped[Module] = relationship()


class UserWallet(Base):
    __tablename__ = "user_wallets"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_wallet"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    xp_credits: Mapped[int] = mapped_column(Integer, default=0)
    referral_credits: Mapped[int] = mapped_column(Integer, default=0)
    premium_unlock_tokens: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="wallet")


class EconomyTransaction(Base):
    __tablename__ = "economy_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source: Mapped[str] = mapped_column(String(80), index=True)
    currency: Mapped[str] = mapped_column(String(30), default="xp_credit")
    amount: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped[User] = relationship(back_populates="economy_transactions")


class ReferralInvite(Base):
    __tablename__ = "referral_invites"
    __table_args__ = (UniqueConstraint("code", name="uq_referral_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inviter_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    invited_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    invited_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    reward_xp: Mapped[int] = mapped_column(Integer, default=120)
    reward_credits: Mapped[int] = mapped_column(Integer, default=1)
    rewarded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    inviter: Mapped[User] = relationship(back_populates="referral_invites", foreign_keys=[inviter_user_id])


class WeeklyUnlockMission(Base):
    __tablename__ = "weekly_unlock_missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    week_start: Mapped[date] = mapped_column(Date, index=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    required_lessons: Mapped[int] = mapped_column(Integer, default=3)
    required_quiz_score: Mapped[int] = mapped_column(Integer, default=75)
    reward_credits: Mapped[int] = mapped_column(Integer, default=2)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class UserWeeklyUnlockMission(Base):
    __tablename__ = "user_weekly_unlock_missions"
    __table_args__ = (UniqueConstraint("user_id", "mission_id", name="uq_user_weekly_unlock_mission"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    mission_id: Mapped[int] = mapped_column(ForeignKey("weekly_unlock_missions.id", ondelete="CASCADE"), index=True)
    lessons_progress: Mapped[int] = mapped_column(Integer, default=0)
    best_quiz_score: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    mission: Mapped[WeeklyUnlockMission] = relationship()
    user: Mapped[User] = relationship()


class PremiumAccessGrant(Base):
    __tablename__ = "premium_access_grants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source: Mapped[str] = mapped_column(String(80), default="earned")
    granted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped[User] = relationship(back_populates="premium_access_grants")


class ProjectAssessment(Base):
    __tablename__ = "project_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(220))
    submission_md: Mapped[str] = mapped_column(Text)
    rubric_json: Mapped[dict] = mapped_column(JSON)
    score: Mapped[int] = mapped_column(Integer, default=0)
    feedback_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    portfolio_readme_md: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped[User] = relationship(back_populates="project_assessments")
    lesson: Mapped[Lesson | None] = relationship()


class AITutorMemory(Base):
    __tablename__ = "ai_tutor_memories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    topic: Mapped[str] = mapped_column(String(180), index=True)
    memory_text: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="tutor_memories")


class TrialFunnelEvent(Base):
    __tablename__ = "trial_funnel_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    funnel_stage: Mapped[str] = mapped_column(String(60), index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped[User] = relationship()


class PaymentRecoveryEvent(Base):
    __tablename__ = "payment_recovery_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subscription_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(40), default="pending", index=True)
    reason: Mapped[str | None] = mapped_column(String(220), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship()


class LessonTranslation(Base):
    __tablename__ = "lesson_translations"
    __table_args__ = (UniqueConstraint("lesson_id", "language", name="uq_lesson_translation"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(10), index=True)
    title: Mapped[str] = mapped_column(String(220))
    objective: Mapped[str] = mapped_column(String(320))
    content_md: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lesson: Mapped[Lesson] = relationship()


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    channel: Mapped[str] = mapped_column(String(20), default="email")
    template_code: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(30), default="queued", index=True)
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped[User] = relationship()
