from pydantic import BaseModel, Field


class CreateSquadRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    weekly_goal_lessons: int = Field(default=4, ge=1, le=20)


class JoinSquadRequest(BaseModel):
    join_code: str = Field(min_length=4, max_length=20)


class LogSquadProgressRequest(BaseModel):
    lessons_completed: int = Field(default=1, ge=1, le=10)


class SquadMemberOut(BaseModel):
    user_id: str
    full_name: str
    role: str
    lessons_completed_week: int
    goal_target: int


class SquadOut(BaseModel):
    squad_id: str
    name: str
    join_code: str
    weekly_goal_lessons: int
    members: list[SquadMemberOut]


class SquadLeaderboardRow(BaseModel):
    squad_id: str
    squad_name: str
    total_lessons_week: int
    members_count: int
