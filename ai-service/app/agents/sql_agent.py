from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain.agents.agent_types import AgentType
from typing import Dict, Any, List
import logging
from app.database import db_service
from textwrap import dedent
import os


logger = logging.getLogger(__name__)

class FinancialSQLAgent:
    def __init__(self, api_key: str, base_url: str = "https://api.x.ai/v1"):
        """Initialize SQL agent for financial data analysis"""

        # Setup Grok LLM
        self.llm = ChatOpenAI(
            model="grok-3-mini",
            api_key=api_key,
            base_url=base_url,
            temperature=0.1,
            max_tokens=800,
            timeout=30
        )

        # Create SQL database connection
        self.db = SQLDatabase.from_uri(
            db_service.database_url,
            include_tables=['accounts', 'categories', 'transactions', 'subscriptions'],
            sample_rows_in_table_info=2,
            view_support=False,
            max_string_length=100
        )

        # Create SQL toolkit
        self.toolkit = SQLDatabaseToolkit(db=self.db, llm=self.llm, reduce_k_below_max_tokens=True)

        # Create the SQL agent
        self.agent = create_sql_agent(
            llm=self.llm,
            toolkit=self.toolkit,
            agent_type=AgentType.OPENAI_FUNCTIONS,
            verbose=False,
            max_iterations=2,
            max_execution_time=20,
            early_stopping_method="generate",
            return_intermediate_steps=False
        )

        self._system_context = self._build_system_context()

    def _build_system_context(self) -> str:
        """Build system context"""
        return dedent(f"""\
            Database Schema: {db_service.get_schema_description()}
            Query Rules:
            1. ALWAYS filter by user_id through accounts table
            2. Use CAST(amount AS DECIMAL) for calculations
            3. Positive amount = income, negative = expense
            4. Return specific numbers, not estimates
            5. Use Vietnamese for descriptions
        """)

    async def execute_financial_query(
        self,
        user_id: str,
        question: str,
        system_prompt: str = None
    ) -> Dict[str, Any]:
        """Execute financial query using system prompt"""
        try:
            # Build minimal, focused query prompt
            focused_query = self._build_focused_query(user_id, question, system_prompt)

            # Execute with settings
            result = await self._execute_with_retry(focused_query)

            # Parse result efficiently
            parsed_result = self._parse_result_efficiently(result)

            return {
                "success": True,
                "data": parsed_result,
                "tokens_saved": True,
                "execution_time": "optimized"
            }
        except Exception as e:
            logger.error(f"SQL Agent error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }

    def _build_focused_query(self, user_id: str, question: str, system_prompt: str = None) -> str:
        """Build focused query"""
        # Use stored system context
        if not hasattr(self, '_context_used'):
            context_part = f"Context: {self._system_context}\n\n"
            self._context_used = True
        else:
            context_part = ""

        return dedent(f"""\
            {context_part}User: {user_id}
            Question: {question}
            Generate SQL query and analyze results. Focus on specific numbers from user's data only.
        """)

    async def _execute_with_retry(self, query: str, max_retries: int = 2) -> str:
        """Execute query with retry logic"""
        for attempt in range(max_retries):
            try:
                result = await self.agent.ainvoke({"input": query})
                return result.get("output", "")
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                logger.warning(f"Query attempt {attempt + 1} failed: {str(e)}")
                continue

    def _parse_result_efficiently(self, result: str) -> Dict[str, Any]:
        """Efficiently parse agent result"""
        if not result:
            return {"message": "No data found"}
        parsed = {
            "summary": result[:200] + "..." if len(result) > 200 else result,
            "key_insights": self._extract_key_numbers(result),
            "full_response": result
        }
        return parsed

    def _extract_key_numbers(self, text: str) -> List[str]:
        """Extract key numbers and insights quickly"""
        import re

        vnd_pattern = r'[\d,]+\s*VND'
        percent_pattern = r'\d+\.?\d*%'

        vnd_matches = re.findall(vnd_pattern, text)
        percent_matches = re.findall(percent_pattern, text)

        insights = []
        if vnd_matches:
            insights.extend([f"Amount: {match}" for match in vnd_matches[:3]])
        if percent_matches:
            insights.extend([f"Rate: {match}" for match in percent_matches[:2]])

        return insights

sql_agent = None

def get_sql_agent() -> FinancialSQLAgent:
    global sql_agent
    if sql_agent is None:
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        sql_agent = FinancialSQLAgent(api_key=api_key)
    return sql_agent


