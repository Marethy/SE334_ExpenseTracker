import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy import text
from ..database import db_service
import logging

logger = logging.getLogger(__name__)

class ContextService:
    def __init__(self):
        self.db_service = db_service

    async def save_conversation(
        self,
        user_id: str,
        question: str,
        response: str,
        analysis_data: Dict[str, Any] = None
    ):
        """Save conversation to database"""
        try:
            query = text("""
                INSERT INTO conversation_history (
                    user_id, question, response, analysis_data, created_at
                ) VALUES (
                    :user_id, :question, :response, :analysis_data, :created_at
                )
            """)

            await self._execute_query(query, {
                "user_id": user_id,
                "question": question,
                "response": response,
                "analysis_data": json.dumps(analysis_data) if analysis_data else None,
                "created_at": datetime.now()
            })

            logger.info(f"Saved conversation for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")

    async def get_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get conversation history for user"""
        try:
            await self._ensure_conversation_table_exists()

            query = text("""
                SELECT question, response, analysis_data, created_at
                FROM conversation_history
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit
            """)

            result = await self._execute_query(query, {
                "user_id": user_id,
                "limit": limit
            })

            conversations = []
            for row in result:
                conv = {
                    "question": row[0],
                    "response": row[1],
                    "analysis_data": json.loads(row[2]) if row[2] else None,
                    "created_at": row[3].isoformat() if row[3] else None
                }
                conversations.append(conv)

            return conversations
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []

    async def get_user_patterns(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Analyze user conversation patterns"""
        try:
            conversations = await self.get_conversation_history(user_id, limit=50)

            patterns = {
                "frequent_topics": [],
                "common_questions": [],
                "user_interests": [],
                "interaction_frequency": 0
            }

            if not conversations:
                return patterns

            recent_conversations = [
                c for c in conversations 
                if c["created_at"] and 
                datetime.fromisoformat(c["created_at"]) > datetime.now() - timedelta(days=days)
            ]

            patterns["interaction_frequency"] = len(recent_conversations) / days

            questions = [c["question"] for c in recent_conversations if c["question"]]

            keywords = {}
            for question in questions:
                words = question.lower().split()
                for word in words:
                    if len(word) > 3:
                        keywords[word] = keywords.get(word, 0) + 1

            sorted_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)
            patterns["frequent_topics"] = [kw[0] for kw in sorted_keywords[:5]]

            patterns["common_questions"] = questions[:5]

            return patterns
        except Exception as e:
            logger.error(f"Error analyzing user patterns: {e}")
            return {}

    async def _ensure_conversation_table_exists(self):
        """Ensure conversation history table exists"""
        try:
            create_table_query = text("""
                CREATE TABLE IF NOT EXISTS conversation_history (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    question TEXT NOT NULL,
                    response TEXT NOT NULL,
                    analysis_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_created (user_id, created_at DESC)
                )
            """)

            await self._execute_query(create_table_query)
        except Exception as e:
            logger.error(f"Error creating conversation table: {e}")

    async def _execute_query(self, query, params=None):
        """Execute database query"""
        try:
            with self.db_service.engine.connect() as conn:
                if params:
                    result = conn.execute(query, params)
                else:
                    result = conn.execute(query)
                conn.commit()
                return result.fetchall() if result.returns_rows else None
        except Exception as e:
            logger.error(f"Database query error: {e}")
            raise