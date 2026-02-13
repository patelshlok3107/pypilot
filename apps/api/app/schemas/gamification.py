from pydantic import BaseModel


class AchievementOut(BaseModel):
    id: int
    code: str
    name: str
    description: str
    xp_bonus: int
    icon: str
    unlocked: bool


class DailyMissionOut(BaseModel):
    mission_id: int
    title: str
    description: str
    xp_reward: int
    completed: bool


class GamificationSummary(BaseModel):
    xp: int
    level: int
    streak_days: int
    next_level_xp: int
    leaderboard_rank: int | None
