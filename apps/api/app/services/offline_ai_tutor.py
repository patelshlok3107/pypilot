"""
Offline AI Tutor Service using Ollama (100% Local, No API Keys Required)
Runs models locally for complete privacy and offline capability
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

import httpx

from app.core.config import settings


@dataclass
class ConversationMessage:
    """Message in conversation history"""

    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime


class OfflineAITutorService:
    """
    Offline Python tutor using local Ollama model.
    No API keys, no internet required, 100% privacy.
    """

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        # Store histories per user key (user id or session key)
        self.conversation_histories: dict[str, list[ConversationMessage]] = {}
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """Build the tutor personality prompt - optimized for speed"""
        return """You are PyPilot, a Python tutor. Be helpful and practical.
    - Explain concepts with examples in code blocks.
    - When the user explicitly asks for a full runnable program, provide the complete code (no forced brevity).
    - Use ```python for code snippets.
    - Be encouraging."""

    def _build_language_instruction(self, language: str | None) -> str:
        """Create a strict response language instruction for the tutor."""
        if not language:
            return ""
        normalized = language.strip()
        if not normalized:
            return ""
        lowered = normalized.lower()
        if lowered in {"auto", "same language", "the same language used by the user"}:
            return "Respond in the same language used by the user's latest message."
        return (
            f"Always respond in {normalized}. "
            "If the user later asks in a different language, switch to that requested language."
        )

    async def _call_ollama(self, prompt: str, context: str = "", user_key: str = "global") -> str:
        """
        Call local Ollama model via HTTP API.
        No authentication needed - everything runs locally.
        """
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                # Quick availability check
                try:
                    tags_resp = await client.get(f"{self.base_url}/api/tags")
                    if tags_resp.status_code != 200:
                        return (
                            f"Local AI tutor unavailable (status {tags_resp.status_code}). "
                            "Confirm Ollama is running (ollama serve) and reachable at the configured URL."
                        )
                except Exception:
                    return (
                        "Local AI tutor is not available. Please start Ollama:\n"
                        "1. Install: https://ollama.ai\n"
                        "2. Run: ollama serve\n"
                        "3. Download model: ollama pull mistral"
                    )

                messages = []

                # Add conversation history for context (per-user)
                history = self.conversation_histories.get(user_key, [])
                for msg in history[-5:]:  # Last 5 messages for context
                    messages.append({"role": msg.role, "content": msg.content})

                # Add current message
                messages.append({"role": "user", "content": prompt})

                # Primary endpoint attempt
                # If a context (system prompt override) was provided, use it; otherwise use default system prompt
                system_field = context if context else self.system_prompt

                resp = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "system": system_field,
                        "options": {
                            "temperature": 0.6,
                            "num_predict": 1024,  # Allow longer outputs for full programs
                            "top_k": 40,
                            "top_p": 0.9,
                        },
                    },
                )

                # If 404, try a common alternative endpoint (/api/generate)
                if resp.status_code == 404:
                    try:
                        alt = await client.post(
                            f"{self.base_url}/api/generate",
                            json={
                                "model": self.model,
                                "prompt": self.system_prompt + "\n" + prompt,
                                "max_tokens": 512,
                            },
                        )
                        if alt.status_code == 200:
                            data = alt.json()
                            return data.get("text") or data.get("message", {}).get("content") or "No response generated."
                    except Exception:
                        pass

                if resp.status_code != 200:
                    # Include response body for easier debugging
                    body = None
                    try:
                        body = resp.text
                    except Exception:
                        body = "(unable to read response body)"

                    return (
                        f"Local AI tutor error: {resp.status_code}. Response: {body}\n"
                        "Make sure Ollama is running (ollama serve) and the model is available. "
                        "You can test with: curl http://<ollama_host>:<port>/api/tags"
                    )

                data = resp.json()
                # Ollama may return different shapes; try common locations
                if isinstance(data, dict):
                    return data.get("message", {}).get("content") or data.get("text") or json.dumps(data)
                return str(data)

        except httpx.ConnectError:
            return (
                "Local AI tutor is not available. Please start Ollama:\n"
                "1. Install: https://ollama.ai\n"
                "2. Run: ollama serve\n"
                "3. Download model: ollama pull mistral"
            )
        except Exception as e:
            return f"Error: {str(e)}"

    async def explain_concept(self, topic: str, level: str, context: str | None = None, user_key: str = "global") -> str:
        """Explain a Python concept with examples"""
        prompt = f"""Explain the Python concept: {topic}

Student level: {level} (beginner/intermediate/advanced)
{f'Student context: {context}' if context else ''}

Please:
1. Start with a simple explanation
2. Provide a code example
3. Explain what the code does
4. Give a real-world use case"""

        response = await self._call_ollama(prompt, user_key=user_key)
        self._add_to_history("user", prompt, user_key)
        self._add_to_history("assistant", response, user_key)
        return response

    async def debug_code(self, code: str, error_message: str, user_key: str = "global") -> str:
        """Debug Python code and explain the fix"""
        prompt = f"""Help me fix this Python code error:

Code:
```python
{code}
```

Error:
{error_message}

Please:
1. Identify what went wrong
2. Explain why it's wrong
3. Show the corrected code
4. Explain how to avoid this in the future"""

        response = await self._call_ollama(prompt, user_key=user_key)
        self._add_to_history("user", prompt, user_key)
        self._add_to_history("assistant", response, user_key)
        return response

    async def generate_practice(self, topic: str, difficulty: str, user_key: str = "global") -> dict[str, str]:
        """Generate a practice problem"""
        prompt = f"""Create a Python practice exercise:

Topic: {topic}
Difficulty: {difficulty} (easy/medium/hard)

Format your response exactly like this:

**Title:** [Exercise name]

**Problem:** [What the student should do]

**Starter Code:**
```python
[Code template]
```

**Hint:** [Helpful hint without spoiling the solution]

**Learning Goal:** [What they'll learn]"""

        content = await self._call_ollama(prompt, user_key=user_key)
        self._add_to_history("user", prompt, user_key)
        self._add_to_history("assistant", content, user_key)

        # Parse the response
        parsed = self._parse_practice_response(content)
        return parsed

    async def chat_stream(
        self,
        user_message: str,
        mode: str = "general",
        language: str | None = None,
        user_name: str | None = None,
        user_key: str = "global",
    ):
        """
        Stream chat responses from AI tutor.
        Yields chunks of text as they are generated.
        """
        import json
        
        mode_prompts = {
            "explain": "Explain this concept to me: ",
            "debug": "Help me debug this: ",
            "practice": "Give me a practice problem about: ",
            "general": "",
        }

        prompt = mode_prompts.get(mode, "") + user_message
        # If user_name provided, include it in the system prompt so assistant can personalize responses
        system_prompt = self.system_prompt
        language_instruction = self._build_language_instruction(language)
        if language_instruction:
            system_prompt = f"{system_prompt}\nResponse-Language: {language_instruction}"
        if user_name:
            system_prompt = f"{system_prompt}\nUser-Name: {user_name}"

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                # Quick availability check
                try:
                    tags_resp = await client.get(f"{self.base_url}/api/tags")
                    if tags_resp.status_code != 200:
                        yield f"Local AI tutor unavailable (status {tags_resp.status_code}). Confirm Ollama is running."
                        return
                except Exception:
                    yield "Local AI tutor is not available. Please start Ollama with: ollama serve"
                    return

                messages = []

                # Add conversation history for context (per-user)
                history = self.conversation_histories.get(user_key, [])
                for msg in history[-5:]:  # Last 5 messages for context
                    messages.append({"role": msg.role, "content": msg.content})

                # Add current message
                messages.append({"role": "user", "content": prompt})

                # Stream response from Ollama
                import json
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": True,
                        "system": system_prompt,
                        "options": {
                            "temperature": 0.6,
                            "num_predict": 1024,  # Allow longer outputs for full programs
                            "top_k": 40,
                            "top_p": 0.9,
                        },
                    },
                ) as resp:
                    if resp.status_code != 200:
                        yield f"Error: {resp.status_code}. Make sure Ollama is running."
                        return

                    full_response = ""
                    async for line in resp.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    chunk = data["message"]["content"]
                                    full_response += chunk
                                    yield chunk
                            except Exception:
                                pass

                    # Add to history after streaming completes (per-user)
                    self._add_to_history("user", user_message, user_key)
                    self._add_to_history("assistant", full_response, user_key)

        except httpx.ConnectError:
            yield "Connection error: Ollama is not running. Start it with: ollama serve"
        except Exception as e:
            yield f"Error: {str(e)}"

    async def chat(
        self,
        user_message: str,
        mode: str = "general",
        language: str | None = None,
        user_name: str | None = None,
        user_key: str = "global",
    ) -> str:
        """
        General chat with the AI tutor.
        Modes: general, explain, debug, practice
        """
        mode_prompts = {
            "explain": "Explain this concept to me: ",
            "debug": "Help me debug this: ",
            "practice": "Give me a practice problem about: ",
            "general": "",
        }

        prompt = mode_prompts.get(mode, "") + user_message

        # Include user_name in system prompt for personalization
        system_prompt = self.system_prompt
        language_instruction = self._build_language_instruction(language)
        if language_instruction:
            system_prompt = f"{system_prompt}\nResponse-Language: {language_instruction}"
        if user_name:
            system_prompt = f"{system_prompt}\nUser-Name: {user_name}"

        response = await self._call_ollama(prompt, context=system_prompt, user_key=user_key)
        self._add_to_history("user", user_message, user_key)
        self._add_to_history("assistant", response, user_key)
        return response

    def get_conversation_history(self, user_key: str = "global") -> list[dict]:
        """Get conversation history for a specific user key"""
        history = self.conversation_histories.get(user_key, [])
        return [{"role": msg.role, "content": msg.content} for msg in history]

    def clear_history(self, user_key: str = "global") -> None:
        """Clear conversation history for a specific user key"""
        if user_key in self.conversation_histories:
            self.conversation_histories[user_key] = []

    def _add_to_history(self, role: str, content: str, user_key: str = "global") -> None:
        """Add message to a user's history"""
        if user_key not in self.conversation_histories:
            self.conversation_histories[user_key] = []
        self.conversation_histories[user_key].append(
            ConversationMessage(role=role, content=content, timestamp=datetime.now())
        )

    def _parse_practice_response(self, content: str) -> dict[str, str]:
        """Parse practice problem response"""
        result = {
            "title": "Practice Problem",
            "prompt": content,
            "starter_code": "# Write your solution here\n",
            "hint": "Break the problem into small steps",
            "learning_goal": "Improve your Python skills",
        }

        # Try to extract structured sections
        sections = {
            "title": "**Title:**",
            "prompt": "**Problem:**",
            "starter_code": "**Starter Code:**",
            "hint": "**Hint:**",
            "learning_goal": "**Learning Goal:**",
        }

        for key, marker in sections.items():
            if marker in content:
                start = content.find(marker) + len(marker)
                end = len(content)

                # Find next section
                for other_marker in sections.values():
                    if other_marker == marker:
                        continue
                    pos = content.find(other_marker, start)
                    if pos != -1:
                        end = min(end, pos)

                value = content[start:end].strip()
                # Remove code block markers if present
                if "```python" in value:
                    value = value.split("```python")[1].split("```")[0].strip()
                if value:
                    result[key] = value

        return result

    async def is_available(self) -> bool:
        """Check if Ollama server is reachable and returning tags"""
        try:
            async with httpx.AsyncClient(timeout=6) as client:
                r = await client.get(f"{self.base_url}/api/tags")
                return r.status_code == 200
        except Exception:
            return False


# Global instance
offline_ai_tutor_service = OfflineAITutorService()
