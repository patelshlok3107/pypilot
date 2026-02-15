from pydantic import BaseModel, Field


class CodeRunRequest(BaseModel):
    code: str = Field(min_length=1, max_length=20000)
    stdin: str | None = Field(default="", max_length=4000)


class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    ai_error_explanation: str | None = None
