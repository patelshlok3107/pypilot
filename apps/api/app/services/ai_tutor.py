from __future__ import annotations

from openai import AsyncOpenAI
import hashlib
import json
import time
from collections import OrderedDict

from app.core.config import settings


class SimpleLRUCache:
    """A tiny in-memory LRU cache with optional TTL."""

    def __init__(self, maxsize: int = 200, ttl: int | None = 3600) -> None:
        self.maxsize = maxsize
        self.ttl = ttl
        self._data: OrderedDict[str, tuple[str, float]] = OrderedDict()

    def get(self, key: str) -> str | None:
        item = self._data.get(key)
        if not item:
            return None
        value, ts = item
        if self.ttl and (time.time() - ts) > self.ttl:
            try:
                del self._data[key]
            except KeyError:
                pass
            return None
        # mark as recently used
        self._data.move_to_end(key)
        return value

    def set(self, key: str, value: str) -> None:
        self._data[key] = (value, time.time())
        self._data.move_to_end(key)
        # evict oldest
        if len(self._data) > self.maxsize:
            self._data.popitem(last=False)

class AITutorService:
    """
    Primary AI Tutor Service - uses offline local model by default.
    Falls back to OpenRouter API if configured.
    Implements caching for faster responses.
    """

    def __init__(self) -> None:
        self._response_cache = SimpleLRUCache(maxsize=200, ttl=3600)  # Simple in-memory LRU cache
        self.use_offline = settings.use_offline_ai
        self.offline_client = None

        if self.use_offline:
            # Import here to avoid dependency issues if not needed
            from app.services.offline_ai_tutor import offline_ai_tutor_service

            self.offline_client = offline_ai_tutor_service
        else:
            self.online_client = AsyncOpenAI(
                api_key=settings.openai_api_key, base_url=settings.openai_base_url
            ) if settings.openai_api_key else None

    async def _generate_offline(self, system_prompt: str, user_prompt: str) -> str:
        """Use offline Ollama model"""
        if not self.offline_client:
            return "Offline AI not initialized"
        # build cache key
        cache_key = hashlib.md5(f"offline|{system_prompt}|{user_prompt}|{settings.ollama_model}".encode()).hexdigest()
        cached = self._response_cache.get(cache_key)
        if cached:
            print("Offline cache hit!")
            return cached

        result = await self.offline_client.chat(user_prompt, mode="general")
        # store in cache
        try:
            if result:
                self._response_cache.set(cache_key, result)
        except Exception:
            pass
        return result

    async def _generate_online(self, system_prompt: str, user_prompt: str) -> str:
        """Use online OpenRouter API with caching"""
        if not self.online_client:
            return (
                "AI tutor key is not configured. Add OPENAI_API_KEY in your environment to enable "
                "personalized explanations."
            )

        # Create cache key from prompts
        cache_key = hashlib.md5(f"online|{system_prompt}|{user_prompt}|{settings.openai_model}".encode()).hexdigest()
        # Check cache first
        cached = self._response_cache.get(cache_key)
        if cached:
            print("Online cache hit!")
            return cached

        try:
            response = await self.online_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.8,
                max_tokens=300,
                timeout=15.0,
            )
        except Exception as e:
            print(f"AI tutor error: {e}")
            return (
                "AI tutor is temporarily unavailable. Verify your API key and model settings, "
                "then try again."
            )

            if response.choices and len(response.choices) > 0:
                result = response.choices[0].message.content or "No response generated."
                # Cache the response
                try:
                    self._response_cache.set(cache_key, result)
                except Exception:
                    pass
                return result

        return "No response generated."

    async def _generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate response using configured backend"""
        if self.use_offline:
            return await self._generate_offline(system_prompt, user_prompt)
        else:
            return await self._generate_online(system_prompt, user_prompt)

    async def explain_concept(self, topic: str, level: str, context: str | None) -> str:
        system_prompt = "You are PyPilot. Give brief, clear Python explanations. Max 200 words."
        user_prompt = (
            f"Level: {level}\n"
            f"Topic: {topic}\n"
            f"Context: {context or 'None'}\n"
            "Explain concisely with example."
        )
        return await self._generate(system_prompt, user_prompt)

    async def debug_code(self, code: str, error_message: str) -> str:
        system_prompt = "You are a Python debugger. Brief cause, fix, and code. Max 200 words."
        user_prompt = (
            f"Code:\n{code}\n\n"
            f"Error:\n{error_message}\n\n"
            "Provide: cause, fix, code, prevention tip."
        )
        return await self._generate(system_prompt, user_prompt)

    async def generate_practice(self, topic: str, difficulty: str) -> dict[str, str]:
        system_prompt = "Create a Python coding exercise. Use exact format: Title: [task name]\nPrompt: [clear instructions]\nStarter Code: [code template]\nHint: [helpful tip]. Keep it simple and educational."
        user_prompt = f"Topic: {topic}\nDifficulty: {difficulty}"
        
        try:
            content = await self._generate(system_prompt, user_prompt)
            
            # Fallback content if AI fails
            parsed = {
                "title": f"{topic.title()} Practice",
                "prompt": f"Create a Python program that demonstrates {topic}. Write clean, working code.",
                "starter_code": "# TODO: Implement your solution here\n\n",
                "hint": f"Think about how {topic} works in Python and apply it step by step.",
            }
            
            # Parse AI response if available
            if content and not content.startswith("Error"):
                for section in ["Title", "Prompt", "Starter Code", "Hint"]:
                    marker = f"{section}:"
                    if marker in content:
                        start = content.find(marker) + len(marker)
                        end = len(content)
                        for other in ["Title:", "Prompt:", "Starter Code:", "Hint:"]:
                            if other == marker:
                                continue
                            next_pos = content.find(other, start)
                            if next_pos != -1:
                                end = min(end, next_pos)
                        value = content[start:end].strip()
                        if section == "Title" and value:
                            parsed["title"] = value
                        elif section == "Prompt" and value:
                            parsed["prompt"] = value
                        elif section == "Starter Code" and value:
                            parsed["starter_code"] = value
                        elif section == "Hint" and value:
                            parsed["hint"] = value
            
            return parsed
            
        except Exception as e:
            print(f"Practice generation error: {e}")
            # Return fallback content
            return {
                "title": f"{topic.title()} Exercise",
                "prompt": f"Practice working with {topic} in Python. Create a simple but functional program.",
                "starter_code": f"# {topic} practice exercise\n# TODO: Your implementation here\n\n",
                "hint": f"Start by understanding the basic concepts of {topic}, then build your solution incrementally.",
            }


ai_tutor_service = AITutorService()
