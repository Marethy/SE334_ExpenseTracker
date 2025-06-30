from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import os
import json
import torch
import numpy as np
from textwrap import dedent
from typing import List, Dict, Any
import asyncio


class VietnameseEmbeddings:
    def __init__(self):
        print("🔄 Loading Vietnamese embedding model...")

        # Loading embeddings model
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🖥️  Using device: {device}")
        try:
            self.model = SentenceTransformer(
                'dangvantuan/vietnamese-embedding',
                device=device,
                token=os.getenv('HF_TOKEN')
            )
            print("✅ Vietnamese embedding model loaded successfully")
        except Exception as e:
            print(f"❌ Error loading dangvantuan/vietnamese-embedding: {e}")
            exit()

        # Load Chroma to store embeddings
        self.chroma_client = chromadb.Client(
            Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory="./chroma_db"
            )
        )

        # Collection for user contexts
        self.user_contexts = self.chroma_client.get_or_create_collection(
            name="user_contexts",
            metadata={
                "description": "User financial contexts and preferences"
            }
        )

        # Collection for financial patterns
        self.financial_patterns = self.chroma_client.get_or_create_collection(
            name="financial_patterns",
            metadata={
                "description": "Common financial patterns and insights"
            }
        )

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text"""
        loop = asyncio.get_event_loop()

        # Preprocess text for Vietnamese
        processed_text = self._preprocess_vietnamese_text(text)

        # Tokenize text for Vietnamese
        tokenized_text = self._tokenize_vietnamese_text(processed_text)

        # Generate embedding
        embedding = await loop.run_in_executor(
            None,
            self._encode_text_sync,
            tokenized_text
        )

        return embedding.tolist()

    def _encode_text_sync(self, text: str) -> np.ndarray:
        """Synchronous encoding with proper parameters"""
        return self.model.encode(
            [text],
            convert_to_tensor=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False
        )

    def _preprocess_vietnamese_text(self, text: str) -> str:
        """Preprocess Vietnamese text for better embedding"""
        import unicodedata

        # Normalize unicode
        text = unicodedata.normalize('NFC', text)

        # Clean and normalize
        text = text.strip().lower()

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def _tokenize_vietnamese_text(self, text: str) -> str:
        """Tokenize Vietnamese text for better embedding"""
        from pyvi.ViTokenizer import tokenize

        # Tokenize text
        return tokenize(text)

    async def store_user_context(self, user_id: str, context: Dict[str, Any]):
        """Store user context with embedding"""
        # Create rich context text in Vietnamese
        context_text = self._create_context_text(user_id, context)

        # Generate embedding
        embedding = await self.embed_text(context_text)

        # Store with metadata
        metadata = {
            **context,
            "user_id": user_id,
            "created_at": context.get("last_interaction", ""),
            "context_type": "user_profile"
        }

        try:
            self.user_contexts.upsert(
                ids=[user_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[context_text]
            )
            print(f"✅ Stored context for user {user_id}")
        except Exception as e:
            print(f"Error storing user context: {e}")

    def _create_context_text(self, user_id: str, context: Dict[str, Any]) -> str:
        """Create rich Vietnamese context text for embedding"""

        # Build comprehensive context description
        context_parts = [f"Hồ sơ tài chính người dùng {user_id}:"]

        # Basic info
        if context.get('age'):
            context_parts.append(f"Tuổi: {context['age']} tuổi")
        if context.get('monthly_income'):
            context_parts.append(f"Thu nhập hàng tháng: {context['monthly_income']:,} VND")

        # Financial goals
        if context.get('financial_goals'):
            goals_text = ', '.join(context['financial_goals'])
            context_parts.append(f"Mục tiêu tài chính: {goals_text}")

        # Risk tolerance
        risk_mapping = {
            'low': 'thấp - ưa thích an toàn',
            'medium': 'trung bình - cân bằng rủi ro và lợi nhuận',
            'high': 'cao - sẵn sàng chấp nhận rủi ro để có lợi nhuận cao'
        }

        if context.get('risk_tolerance'):
            risk_desc = risk_mapping.get(context['risk_tolerance'], context['risk_tolerance'])
            context_parts.append(f"Mức độ chấp nhận rủi ro: {risk_desc}")

        # Spending preferences
        if context.get('spending_preferences'):
            prefs = context['spending_preferences']
            if isinstance(prefs, dict):
                pref_items = []
                for category, preference in prefs.items():
                    pref_items.append(f"{category}: {preference}")
                if pref_items:
                    context_parts.append(f"Ưu tiên chi tiêu: {', '.join(pref_items)}")

        # Conversation patterns
        if context.get('conversation_history'):
            recent_intents = []
            for conv in context['conversation_history'][-3:]:
                if conv.get('intent'):
                    recent_intents.append(conv['intent'])
            if recent_intents:
                context_parts.append(f"Quan tâm gần đây: {', '.join(set(recent_intents))}")

        if context.get('financial_habits'):
            habits = context['financial_habits']
            if isinstance(habits, list):
                context_parts.append(f"Thói quen tài chính: {', '.join(habits)}")

        return ' | '.join(context_parts)

    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Retrieve user context"""
        try:
            results = self.user_contexts.get(ids=[user_id])
            if results['metadatas'] and len(results['metadatas']) > 0:
                metadata = results['metadatas'][0]
                # Remove internal fields
                context = {k: v for k, v in metadata.items() if k not in ['user_id', 'created_at', 'context_type']}
                return context
        except Exception as e:
            print(f"Error retrieving user context: {e}")
        return {}

    async def find_similar_patterns(self, query: str, user_id: str = None, n_results: int = 3) -> List[Dict]:
        """Find similar financial patterns with Vietnamese semantic search"""
        # Enhance query for Vietnamese context
        enhanced_query = f"Tình huống tài chính: {query}"

        if user_id:
            enhanced_query += f" (người dùng {user_id})"

        embedding = await self.embed_text(enhanced_query)

        try:
            # Search in financial patterns
            results = self.financial_patterns.query(
                query_embeddings=[embedding],
                n_results=n_results,
                where={"user_id": user_id} if user_id else None
            )
            patterns = []

            if results['documents'] and results['documents'][0]:
                for i, (doc, meta, distance) in enumerate(zip(
                    results['documents'][0],
                    results['metadatas'][0] if results['metadatas'] else [],
                    results['distances'][0] if results['distances'] else []
                )):
                    patterns.append({
                        'text': doc,
                        'metadata': meta or {},
                        'similarity': max(0, 1 - distance),
                        'rank': i + 1
                    })

            return patterns
        except Exception as e:
            print(f"Error finding similar patterns: {e}")
            return []

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_name": getattr(self.model, 'model_name', 'dangvantuan/vietnamese-embedding'),
            "max_seq_length": getattr(self.model, 'max_seq_length', 512),
            "embedding_dimension": getattr(self.model, 'get_sentence_embedding_dimension', lambda: 384)(),
            "device": str(self.model.device) if hasattr(self.model, 'device') else 'unknown'
        }


embeddings_service = VietnameseEmbeddings()