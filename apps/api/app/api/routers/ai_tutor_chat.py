"""
AI Tutor Chat Router - Supports offline local LLM
"""

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.ai import (
    AITutorResponse,
    DebugCodeRequest,
    ExplainConceptRequest,
    PracticeProblemRequest,
    PracticeProblemResponse,
)
from app.services.offline_ai_tutor import offline_ai_tutor_service
from app.core.config import settings
import tempfile
import os
import io
import base64
# import pyttsx3
# from pydub import AudioSegment
import smtplib
from email.message import EmailMessage
from app.services.product_growth import product_growth_service

router = APIRouter(prefix="/ai-tutor", tags=["ai-tutor"])


def _is_local_tutor_unavailable(content: str) -> bool:
    text = (content or "").lower()
    return (
        "local ai tutor is not available" in text
        or "local ai tutor unavailable" in text
        or "ollama is not running" in text
        or "confirm ollama is running" in text
        or "ollama serve" in text
    )


class ChatRequest(BaseModel):
    """Chat message request"""
    message: str
    mode: str = "general"  # general, explain, debug, practice
    language: str | None = None


class ChatResponse(BaseModel):
    """Chat message response"""
    role: str  # user or assistant
    content: str
    mode: str = "general"
    status: str = "success"


class SpeakReportRequest(BaseModel):
    report: dict
    language: str = "en"


class SpeakReportResponse(BaseModel):
    summary: str


# In-memory chat storage per user (can be replaced with database)
user_chats = {}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_tutor(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> ChatResponse:
    """
    Chat with the offline AI tutor.
    Modes: general, explain, debug, practice
    No API keys needed - runs 100% locally!
    """
    try:
        if not payload.message or not payload.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        if payload.mode not in ["general", "explain", "debug", "practice"]:
            raise HTTPException(status_code=400, detail="Invalid mode. Use: general, explain, debug, practice")

        # Pass optional current_user to service for personalization and per-user history
        user_name = None
        user_key = "global"
        if current_user is not None and hasattr(current_user, "full_name") and current_user.full_name:
            user_name = current_user.full_name
        elif current_user is not None and hasattr(current_user, "email"):
            user_name = current_user.email.split("@")[0]
        if current_user is not None and hasattr(current_user, "id"):
            user_key = str(current_user.id)

        response = await offline_ai_tutor_service.chat(
            payload.message.strip(),
            mode=payload.mode,
            language=payload.language,
            user_name=user_name,
            user_key=user_key,
        )

        if _is_local_tutor_unavailable(response):
            raise HTTPException(status_code=503, detail="Local AI tutor is currently unavailable")

        return ChatResponse(
            role="assistant",
            content=response,
            mode=payload.mode,
            status="success",
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Chat error: {error_msg}")
        return ChatResponse(
            role="assistant",
            content=f"Error: {error_msg}. Make sure Ollama is running and the model is loaded.",
            mode=payload.mode,
            status="error",
        )


@router.post("/chat-stream")
async def chat_stream_with_tutor(payload: ChatRequest, current_user: User | None = Depends(get_optional_current_user)):
    """
    Stream chat responses from the AI tutor (word-by-word, real-time).
    Much faster perceived response time!
    Modes: general, explain, debug, practice
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if payload.mode not in ["general", "explain", "debug", "practice"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Use: general, explain, debug, practice")

    async def generate():
        try:
            # Pass optional user name for personalization in streaming responses
            user_name = None
            user_key = "global"
            if current_user is not None and hasattr(current_user, "full_name") and current_user.full_name:
                user_name = current_user.full_name
            elif current_user is not None and hasattr(current_user, "email"):
                user_name = current_user.email.split("@")[0]
            if current_user is not None and hasattr(current_user, "id"):
                user_key = str(current_user.id)

            async for chunk in offline_ai_tutor_service.chat_stream(
                payload.message.strip(),
                mode=payload.mode,
                language=payload.language,
                user_name=user_name,
                user_key=user_key,
            ):
                if chunk:
                    yield chunk
        except Exception as e:
            yield f"Error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/event-stream")



@router.get("/history")
async def get_chat_history(current_user: User | None = Depends(get_optional_current_user)) -> list[dict]:
    """Get conversation history with AI tutor for the logged-in user"""
    if not current_user:
        return []
    user_key = str(current_user.id)
    return offline_ai_tutor_service.get_conversation_history(user_key=user_key)


@router.post("/clear-history")
async def clear_chat_history(current_user: User | None = Depends(get_optional_current_user)) -> dict:
    """Clear conversation history for the logged-in user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to clear history")
    user_key = str(current_user.id)
    offline_ai_tutor_service.clear_history(user_key=user_key)
    return {"status": "success", "message": "Conversation history cleared"}


@router.post("/explain", response_model=AITutorResponse)
async def explain_concept(
    payload: ExplainConceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AITutorResponse:
    """Explain a Python concept"""
    try:
        user_key = str(current_user.id) if current_user is not None else "global"
        response = await offline_ai_tutor_service.explain_concept(
            topic=payload.topic,
            level=payload.student_level,
            context=payload.context,
            user_key=user_key,
        )

        # Optional: get entitlements if needed
        # entitlements = product_growth_service.get_entitlements(db, current_user)
        # db.commit()

        return AITutorResponse(
            response=response,
            ai_credits_remaining=999,  # Unlimited in offline mode
        )

    except Exception as e:
        print(f"Explain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/debug", response_model=AITutorResponse)
async def debug_code(
    payload: DebugCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AITutorResponse:
    """Debug Python code"""
    try:
        user_key = str(current_user.id) if current_user is not None else "global"
        response = await offline_ai_tutor_service.debug_code(
            code=payload.code,
            error_message=payload.error_message,
            user_key=user_key,
        )

        return AITutorResponse(
            response=response,
            ai_credits_remaining=999,  # Unlimited in offline mode
        )

    except Exception as e:
        print(f"Debug error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/practice", response_model=PracticeProblemResponse)
async def generate_practice_problem(
    payload: PracticeProblemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PracticeProblemResponse:
    """Generate a practice problem"""
    try:
        user_key = str(current_user.id) if current_user is not None else "global"
        generated = await offline_ai_tutor_service.generate_practice(
            topic=payload.topic,
            difficulty=payload.difficulty,
            user_key=user_key,
        )

        return PracticeProblemResponse(
            **generated,
            ai_credits_remaining=999,  # Unlimited in offline mode
        )

    except Exception as e:
        print(f"Practice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def tutor_status() -> dict:
    """Check if AI tutor is online and ready"""
    # Perform a quick availability check against Ollama
    available = await offline_ai_tutor_service.is_available()
    return {
        "status": "online" if available else "offline",
        "mode": "offline-local",
        "model": offline_ai_tutor_service.model,
        "message": "AI tutor is running 100% locally - no API keys needed!" if available else "Ollama is not reachable. Run: ollama serve",
    }


@router.post("/test")
async def test_tutor() -> dict:
    """Test endpoint without authentication"""
    try:
        response = await offline_ai_tutor_service.chat("Say hello", mode="general")
        return {
            "status": "success",
            "response": response,
            "message": "AI tutor is working!",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "hint": "Make sure Ollama container is running: docker-compose logs ollama-server",
        }


    @router.post("/speak-report", response_model=SpeakReportResponse)
    async def speak_report(payload: SpeakReportRequest, current_user: User | None = Depends(get_optional_current_user)) -> SpeakReportResponse:
        """Generate a short parent-friendly report summary in the requested language using the offline tutor"""
        try:
            # Build a concise prompt for the model
            report_json = payload.report
            language = payload.language or "en"

            prompt = (
                f"You are an empathetic assistant. Given the student's monthly report (JSON):\n{report_json}\n"
                f"Write a short, parent-friendly spoken summary (2-4 sentences) in { 'English' if language.startswith('en') else 'Hindi' } that highlights strengths, one improvement action, and an encouraging closing."
            )

            summary = await offline_ai_tutor_service.chat(prompt, mode="general")

            return SpeakReportResponse(summary=summary)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


    # @router.post("/speak-report-audio")
    # async def speak_report_audio(payload: SpeakReportRequest):
    #     """Return TTS audio (MP3 if possible) for the given report and language and voice options.
#
    #     Request body: { report: dict, language: 'en'|'hi', voice: 'male'|'female', rate: int, volume: float }
    #     """
    #     try:
    #         report_json = payload.report
    #         language = payload.language or "en"
#
    #         prompt = f"You are an empathetic assistant. Given the student's monthly report (JSON):\n{report_json}\nWrite a short, parent-friendly spoken summary (2-4 sentences)."
    #         text = await offline_ai_tutor_service.chat(prompt, mode="general")
#
    #         # Use pyttsx3 to synthesize to WAV
    #         engine = pyttsx3.init()
    #         # Configure voice/rate/volume if provided via payload.report keys (we'll allow optional keys)
    #         opts = getattr(payload, "options", {}) if hasattr(payload, "options") else {}
    #         rate = int(opts.get("rate", 150))
    #         volume = float(opts.get("volume", 1.0))
    #         voice_pref = opts.get("voice", "male")
#
    #         engine.setProperty("rate", rate)
    #         engine.setProperty("volume", volume)
    #         voices = engine.getProperty("voices")
    #         # Choose a voice matching language and gender heuristically
    #         chosen = None
    #         for v in voices:
    #             vname = getattr(v, "name", "").lower()
    #             if language.startswith("hi") and ("hi" in getattr(v, "id", "") or "hindi" in vname):
    #                 chosen = v.id
    #                 break
    #         if not chosen:
    #             # try gender preference
    #             for v in voices:
    #                 vname = getattr(v, "name", "").lower()
    #                 if voice_pref == "female" and ("female" in vname or "woman" in vname or "zira" in vname):
    #                     chosen = v.id
    #                     break
    #                 if voice_pref == "male" and ("male" in vname or "man" in vname):
    #                     chosen = v.id
    #                     break
    #         if chosen:
    #             try:
    #                 engine.setProperty("voice", chosen)
    #             except Exception:
    #                 pass
#
    #         # Synthesize to temporary WAV file
    #         tmp_wav = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    #         tmp_wav.close()
    #         engine.save_to_file(text, tmp_wav.name)
    #         engine.runAndWait()
#
    #         # Try convert to MP3 using pydub (requires ffmpeg)
    #         try:
    #             audio = AudioSegment.from_wav(tmp_wav.name)
    #             mp3_io = io.BytesIO()
    #             audio.export(mp3_io, format="mp3")
    #             mp3_io.seek(0)
    #             os.unlink(tmp_wav.name)
    #             return StreamingResponse(mp3_io, media_type="audio/mpeg")
    #         except Exception:
    #             # Fallback: return WAV
    #             wav_f = open(tmp_wav.name, "rb")
    #             data = wav_f.read()
    #             wav_f.close()
    #             os.unlink(tmp_wav.name)
    #             return StreamingResponse(io.BytesIO(data), media_type="audio/wav")
#
    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=str(e))


    # @router.post("/send-parent-report-with-audio")
    # async def send_parent_report_with_audio(payload: dict):
    #     """Generate spoken summary audio and send parent report email with the audio attached.
#
    #     Expects: { parent_email, report, language, options }
    #     SMTP settings must be configured in environment (see settings.smtp_*).
    #     """
    #     try:
    #         parent_email = payload.get("parent_email")
    #         report = payload.get("report")
    #         language = payload.get("language", "en")
    #         options = payload.get("options", {})
#
    #         if not parent_email or not report:
    #             raise HTTPException(status_code=400, detail="parent_email and report are required")
#
    #         # Generate summary text
    #         prompt = f"You are an empathetic assistant. Given the student's monthly report (JSON):\n{report}\nWrite a short, parent-friendly spoken summary (2-4 sentences)."
    #         summary = await offline_ai_tutor_service.chat(prompt, mode="general")
#
    #         # Generate audio using pyttsx3 to WAV, convert to MP3 if possible
    #         engine = pyttsx3.init()
    #         engine.setProperty("rate", int(options.get("rate", 150)))
    #         engine.setProperty("volume", float(options.get("volume", 1.0)))
    #         tmp_wav = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    #         tmp_wav.close()
    #         engine.save_to_file(summary, tmp_wav.name)
    #         engine.runAndWait()
#
    #         # Convert to mp3 if possible
    #         attach_bytes = None
    #         attach_type = "audio/wav"
    #         try:
    #             audio = AudioSegment.from_wav(tmp_wav.name)
    #             mp3_io = io.BytesIO()
    #             audio.export(mp3_io, format="mp3")
    #             attach_bytes = mp3_io.getvalue()
    #             attach_type = "audio/mpeg"
    #         except Exception:
    #             with open(tmp_wav.name, "rb") as f:
    #                 attach_bytes = f.read()
    #             attach_type = "audio/wav"
#
    #         os.unlink(tmp_wav.name)
#
    #         # If SMTP configured, send email
    #         if settings.smtp_host and settings.smtp_from and settings.smtp_user and settings.smtp_password and settings.smtp_port:
    #             msg = EmailMessage()
    #             msg["Subject"] = "Monthly Progress Report"
    #             msg["From"] = settings.smtp_from
    #             msg["To"] = parent_email
    #             body = f"Dear Parent,\n\nPlease find attached a short spoken summary of your child's monthly progress.\n\nSummary:\n{summary}\n\nRegards\n{settings.app_env} Team"
    #             msg.set_content(body)
    #             # attach audio
    #             msg.add_attachment(attach_bytes, maintype=attach_type.split("/")[0], subtype=attach_type.split("/")[1], filename="report.mp3" if attach_type=="audio/mpeg" else "report.wav")
#
    #             with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
    #                 smtp.starttls()
    #                 smtp.login(settings.smtp_user, settings.smtp_password)
    #                 smtp.send_message(msg)
#
    #             return {"status": "sent", "message": "Parent report sent with audio attachment."}
    #         else:
    #             # SMTP not configured: return base64 audio and summary so caller can handle sending
    #             b64 = base64.b64encode(attach_bytes).decode("ascii")
    #             return {"status": "ok", "message": "SMTP not configured. Returning audio as base64.", "summary": summary, "audio_base64": b64, "audio_type": attach_type}
#
    #     except HTTPException:
    #         raise
    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=str(e))
