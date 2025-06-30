import os
from langchain_openai import ChatOpenAI
from typing import Dict, Any, AsyncGenerator, List
import logging

logger = logging.getLogger(__name__)

class GrokService:
    def __init__(self):
        self.api_key = os.getenv("XAI_API_KEY")
        if not self.api_key:
            raise ValueError("XAI_API_KEY environment variable is required")

        self.llm = ChatOpenAI(
            model="grok-3-mini",
            api_key=self.api_key,
            base_url="https://api.x.ai/v1",
            temperature=0.2,
            max_tokens=1500,
            timeout=25,
            streaming=True,
            max_retries=2
        )

        self._message_cache: Dict[str, List[Dict]] = {}

    async def generate_response(
        self,
        context: Dict[str, Any],
        system_prompt: str,
        stream: bool = True,
        use_cache: bool = True
    ) -> AsyncGenerator[str, None]:
        """Generate response with caching and streaming"""
        try:
            messages = self._build_minimal_messages(context, system_prompt, use_cache)

            if stream:
                async for chunk in self._stream_response(messages):
                    yield chunk
            else:
                response = await self._complete_response(messages)
                yield response

        except Exception as e:
            logger.error(f"Optimized Grok service error: {e}")
            yield f"Xin lỗi, có lỗi xảy ra: {str(e)}"

    async def _stream_response(self, messages: List[Dict]) -> AsyncGenerator[str, None]:
        """Stream response efficiently"""
        try:
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    yield chunk.content

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"\n\nLỗi streaming: {str(e)}"

    async def _complete_response(self, messages: List[Dict]) -> str:
        """Generate complete response"""
        try:
            response = await self.llm.ainvoke(messages)
            return response.content

        except Exception as e:
            logger.error(f"Complete response error: {e}")
            return f"Lỗi tạo response: {str(e)}"

    def _build_minimal_messages(
        self,
        context: Dict[str, Any],
        system_prompt: str,
        use_cache: bool = True
    ) -> List[Dict]:
        """Build minimal messages without repetition"""

        context_key = f"{context.get('user_question', '')}_{hash(str(context.get('sql_data', {})))}"

        if use_cache and context_key in self._message_cache:
            cached_messages = self._message_cache[context_key]
            logger.info("Using cached messages")
            return cached_messages

        messages = []

        messages.append({
            "role": "system",
            "content": system_prompt
        })

        user_content = self._build_focused_user_message(context)
        messages.append({
            "role": "user",
            "content": user_content
        })

        if use_cache:
            self._message_cache[context_key] = messages

            if len(self._message_cache) > 100:
                oldest_key = list(self._message_cache.keys())[0]
                del self._message_cache[oldest_key]

        return messages

    def _build_focused_user_message(self, context: Dict[str, Any]) -> str:
        """Build focused user message without redundancy"""
        parts = [f"Câu hỏi: {context['user_question']}"]

        sql_data = context.get('sql_data', {})
        if sql_data:
            if sql_data.get('key_insights'):
                parts.append(f"Dữ liệu: {', '.join(sql_data['key_insights'][:3])}")
            elif sql_data.get('summary'):
                parts.append(f"Kết quả: {sql_data['summary'][:100]}...")

        preferences = context.get('user_preferences', {})
        if preferences.get('monthly_income'):
            parts.append(f"Thu nhập: {preferences['monthly_income']:,}VND")

        parts.append("Yêu cầu: Phân tích ngắn gọn, số liệu cụ thể, khuyến nghị thiết thực.")

        return "\n".join(parts)

    def clear_cache(self):
        """Clear message cache"""
        self._message_cache.clear()
        logger.info("Message cache cleared")

    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            "cached_messages": len(self._message_cache),
            "memory_usage_kb": len(str(self._message_cache)) // 1024
        }

# Global optimized service
grok_service = GrokService()