from __future__ import annotations

import ast
import os
import subprocess
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

try:
    import resource
except ImportError:  # pragma: no cover - Windows fallback for local dev.
    resource = None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    run_timeout_sec: int = 4
    run_memory_mb: int = 128


settings = Settings()

BLOCKED_IMPORTS = {
    "subprocess",
    "socket",
    "multiprocessing",
    "ctypes",
    "resource",
    "signal",
    "pathlib",
    "shutil",
}


class CodeRunRequest(BaseModel):
    code: str = Field(min_length=1, max_length=20000)
    stdin: str | None = Field(default="", max_length=4000)


class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int


app = FastAPI(title="PyPilot Code Runner", version="1.0.0")


def validate_code_safety(code: str) -> None:
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_module = alias.name.split(".")[0]
                if root_module in BLOCKED_IMPORTS:
                    raise HTTPException(status_code=400, detail=f"Import '{root_module}' is blocked")
        if isinstance(node, ast.ImportFrom):
            module_name = (node.module or "").split(".")[0]
            if module_name in BLOCKED_IMPORTS:
                raise HTTPException(status_code=400, detail=f"Import '{module_name}' is blocked")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/run", response_model=CodeRunResponse)
def run_code(payload: CodeRunRequest) -> CodeRunResponse:
    validate_code_safety(payload.code)

    with tempfile.TemporaryDirectory(prefix="runner-") as tmp_dir:
        script_path = Path(tmp_dir) / "main.py"
        script_path.write_text(payload.code, encoding="utf-8")

        def limit_resources() -> None:
            if resource is None:
                return
            memory_bytes = settings.run_memory_mb * 1024 * 1024
            resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
            resource.setrlimit(resource.RLIMIT_CPU, (settings.run_timeout_sec, settings.run_timeout_sec + 1))

        start = time.perf_counter()
        try:
            completed = subprocess.run(
                ["python", "-I", str(script_path)],
                input=payload.stdin or "",
                capture_output=True,
                text=True,
                timeout=settings.run_timeout_sec,
                cwd=tmp_dir,
                env={"PYTHONIOENCODING": "utf-8", "PATH": os.environ.get("PATH", "")},
                preexec_fn=limit_resources if resource is not None else None,
            )
        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return CodeRunResponse(
                stdout="",
                stderr="Execution timed out.",
                exit_code=124,
                execution_time_ms=elapsed_ms,
            )

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return CodeRunResponse(
            stdout=completed.stdout,
            stderr=completed.stderr,
            exit_code=completed.returncode,
            execution_time_ms=elapsed_ms,
        )
