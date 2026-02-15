import httpx
from fastapi import HTTPException

from app.core.config import settings


class CodeRunnerService:
    async def run_python(self, code: str, stdin: str = "") -> dict:
        payload = {"code": code, "stdin": stdin}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(f"{settings.code_runner_url}/run", json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail=f"Code runner error: {exc.response.text}") from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach code runner service") from exc


code_runner_service = CodeRunnerService()
