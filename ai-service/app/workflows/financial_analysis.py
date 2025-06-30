from typing import Dict, Any, List, Optional, TypedDict, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from app.agents.sql_agent import get_sql_agent
from app.services.grok_service import GrokService
from app.services.context_service import ContextService
from app.embeddings import embeddings_service
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class FinancialState(TypedDict):
    """State with system prompt caching"""
    user_id: str
    user_question: str

    # System context
    system_prompt: str
    user_context: Dict[str, Any]
    context_loaded: bool

    # Analysis results
    sql_analysis: Dict[str, Any]
    similar_patterns: List[Dict]

    # Response generation
    response_chunks: List[str]
    final_response: str

    # Optimization tracking
    tokens_used: int
    cache_hits: int
    error_message: Optional[str]

class FinancialWorkflow:
    def __init__(self):
        self.sql_agent = get_sql_agent()
        self.grok_service = GrokService()
        self.context_service = ContextService()

        self._prompt_cache: Dict[str, str] = {}
        self._context_cache: Dict[str, Dict] = {}

        self.workflow = self._create_workflow()

        # Use MemorySaver instead of SqliteSaver to avoid session conflicts
        memory = MemorySaver()
        self.app = self.workflow.compile(checkpointer=memory)

    def _create_workflow(self) -> StateGraph:
        """Create optimized workflow with minimal state transitions"""
        workflow = StateGraph(FinancialState)

        # Define nodes
        workflow.add_node("load_context_step", self._load_context_cached)
        workflow.add_node("execute_sql_step", self._sql_analysis)
        workflow.add_node("generate_response_step", self._generate_response_streaming)
        workflow.add_node("handle_error_step", self._handle_error_minimal)

        workflow.set_entry_point("load_context_step")

        workflow.add_conditional_edges(
            "load_context_step",
            self._check_context_loaded,
            {
                "loaded": "execute_sql_step",
                "error": "handle_error_step"
            }
        )

        workflow.add_conditional_edges(
            "execute_sql_step",
            self._check_analysis_success,
            {
                "success": "generate_response_step",
                "error": "handle_error_step"
            }
        )

        workflow.add_edge("generate_response_step", END)
        workflow.add_edge("handle_error_step", END)

        return workflow

    async def _load_context_cached(self, state: FinancialState) -> FinancialState:
        """Load context with caching to avoid repeated API calls"""
        try:
            user_id = state["user_id"]

            # Check cache first
            if user_id in self._context_cache:
                cached_time = self._context_cache[user_id].get("timestamp", 0)
                if datetime.now().timestamp() - cached_time < 300:  # 5 minute cache
                    state.update({
                        "user_context": self._context_cache[user_id]["data"],
                        "system_prompt": self._get_cached_system_prompt(user_id),
                        "context_loaded": True,
                        "cache_hits": state.get("cache_hits", 0) + 1
                    })
                    return state

            # Load fresh context
            try:
                if embeddings_service:
                    user_context = await embeddings_service.get_user_context(user_id)
                else:
                    user_context = {}
            except Exception as e:
                logger.warning(f"Embeddings service error: {e}")
                user_context = {}

            # Cache the context
            self._context_cache[user_id] = {
                "data": user_context,
                "timestamp": datetime.now().timestamp()
            }

            system_prompt = self._generate_system_prompt(user_context)
            self._prompt_cache[user_id] = system_prompt

            state.update({
                "user_context": user_context,
                "system_prompt": system_prompt,
                "context_loaded": True,
                "cache_hits": state.get("cache_hits", 0)
            })

            logger.info(f"Context loaded for user {user_id}")
        except Exception as e:
            logger.error(f"Context loading error: {e}")
            state["error_message"] = f"Context loading failed: {str(e)}"
            state["context_loaded"] = False

        return state

    async def _sql_analysis(self, state: FinancialState) -> FinancialState:
        """Optimized SQL analysis with minimal prompt overhead"""
        try:
            result = await self.sql_agent.execute_financial_query(
                user_id=state["user_id"],
                question=state["user_question"],
                system_prompt=state["system_prompt"]
            )

            state["sql_analysis"] = result

            if result["success"]:
                logger.info(f"SQL analysis completed for user {state['user_id']}")
            else:
                state["error_message"] = result.get("error", "SQL analysis failed")

        except Exception as e:
            logger.error(f"SQL analysis error: {e}")
            state["error_message"] = f"SQL analysis failed: {str(e)}"
            state["sql_analysis"] = {"success": False, "error": str(e)}

        return state

    async def _generate_response_streaming(self, state: FinancialState) -> FinancialState:
        """Generate response with streaming and cached context"""
        try:
            response_context = {
                "user_question": state["user_question"],
                "sql_data": state["sql_analysis"].get("data", {}),
                "user_preferences": state["user_context"]
            }

            response_stream = self.grok_service.generate_response(
                context=response_context,
                system_prompt=state["system_prompt"],
                stream=True,
                use_cache=True
            )

            response_chunks = []
            full_response = ""

            async for chunk in response_stream:
                response_chunks.append(chunk)
                full_response += chunk

            state.update({
                "response_chunks": response_chunks,
                "final_response": full_response,
                "tokens_used": state.get("tokens_used", 0) + len(full_response.split())
            })

            # Save conversation asynchronously
            asyncio.create_task(self._save_conversation_async(
                user_id=state["user_id"],
                question=state["user_question"],
                response=full_response,
                analysis_data=state["sql_analysis"]
            ))

            logger.info(f"Response generated with {len(response_chunks)} chunks")
        except Exception as e:
            logger.error(f"Response generation error: {e}")
            state["error_message"] = f"Response generation failed: {str(e)}"
            state["final_response"] = "Xin lỗi, có lỗi trong quá trình tạo phản hồi."

        return state

    async def _save_conversation_async(self, user_id: str, question: str, response: str, analysis_data: Dict):
        """Save conversation asynchronously without blocking"""
        try:
            await self.context_service.save_conversation(
                user_id=user_id,
                question=question,
                response=response,
                analysis_data=analysis_data
            )
        except Exception as e:
            logger.warning(f"Could not save conversation: {e}")

    async def _handle_error_minimal(self, state: FinancialState) -> FinancialState:
        """Minimal error handling"""
        error_msg = state.get("error_message", "Unknown error")
        logger.error(f"Workflow error for user {state.get('user_id', 'unknown')}: {error_msg}")

        state["final_response"] = f"Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."

        return state

    def _check_context_loaded(self, state: FinancialState) -> Literal["loaded", "error"]:
        """Check if context was loaded successfully"""
        return "loaded" if state.get("context_loaded", False) else "error"

    def _check_analysis_success(self, state: FinancialState) -> Literal["success", "error"]:
        """Check if SQL analysis was successful"""
        if state.get("error_message"):
            return "error"
        return "success" if state["sql_analysis"].get("success", False) else "error"

    def _get_cached_system_prompt(self, user_id: str) -> str:
        """Get cached system prompt or generate new one"""
        return self._prompt_cache.get(user_id, self._generate_system_prompt({}))

    def _generate_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Generate minimal, efficient system prompt"""
        base_prompt = "Chuyên gia tài chính AI - Phân tích dữ liệu thực, trả lời tiếng Việt, không bịa đặt."

        if user_context.get('monthly_income'):
            base_prompt += f" Thu nhập: {user_context['monthly_income']:,}VND."
        
        if user_context.get('financial_goals'):
            goals = user_context['financial_goals']
            if isinstance(goals, list) and goals:
                base_prompt += f" Mục tiêu: {goals[0]}."

        return base_prompt

    def clear_cache(self):
        """Clear internal caches"""
        self._prompt_cache.clear()
        self._context_cache.clear()
        logger.info("Workflow caches cleared")

# Initialize workflow with better error handling
workflow = None

def get_workflow():
    """Get workflow instance with lazy initialization"""
    global workflow
    if workflow is None:
        try:
            workflow = FinancialWorkflow()
            logger.info("✅ Financial workflow initialized successfully")
        except Exception as e:
            logger.error(f"❌ Error initializing workflow: {e}")
            raise
    return workflow

async def analyze_financial(user_id: str, question: str) -> Dict[str, Any]:
    """Optimized financial analysis entry point"""
    try:
        workflow_instance = get_workflow()
    except Exception as e:
        return {
            "response": "Xin lỗi, hệ thống chưa sẵn sàng. Vui lòng thử lại sau.",
            "analysis": {},
            "success": False,
            "error": str(e)
        }

    # Use a simpler config without thread_id complications
    config = {"configurable": {"thread_id": f"user_{user_id}_{hash(question) % 10000}"}}

    initial_state = {
        "user_id": user_id,
        "user_question": question,
        "system_prompt": "",
        "user_context": {},
        "context_loaded": False,
        "sql_analysis": {},
        "similar_patterns": [],
        "response_chunks": [],
        "final_response": "",
        "tokens_used": 0,
        "cache_hits": 0,
        "error_message": None
    }

    try:
        result = await workflow_instance.app.ainvoke(initial_state, config)

        return {
            "response": result["final_response"],
            "analysis": result["sql_analysis"],
            "optimization_stats": {
                "tokens_used": result["tokens_used"],
                "cache_hits": result["cache_hits"],
                "response_chunks": len(result["response_chunks"])
            },
            "success": not bool(result.get("error_message"))
        }
    except Exception as e:
        logger.error(f"Workflow execution error: {e}")
        return {
            "response": f"Xin lỗi, có lỗi trong quá trình xử lý: {str(e)}",
            "analysis": {},
            "optimization_stats": {},
            "success": False,
            "error": str(e)
        }