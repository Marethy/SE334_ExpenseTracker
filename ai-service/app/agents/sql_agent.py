from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain.agents.agent_types import AgentType
from typing import Dict, Any, List
import logging
from app.database.database import db_service
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
            max_tokens=1200,  # Increase for better analysis
            timeout=30
        )

        # Create SQL database connection
        self.db = SQLDatabase.from_uri(
            db_service.database_url,
            include_tables=['accounts', 'categories', 'transactions', 'subscriptions'],
            sample_rows_in_table_info=3,  # Increase samples
            view_support=False,
            max_string_length=150
        )

        # Create SQL toolkit
        self.toolkit = SQLDatabaseToolkit(db=self.db, llm=self.llm, reduce_k_below_max_tokens=True)

        # Create the SQL agent with better parameters
        self.agent = create_sql_agent(
            llm=self.llm,
            toolkit=self.toolkit,
            agent_type=AgentType.OPENAI_FUNCTIONS,
            verbose=False,
            max_iterations=3,  # Allow more iterations
            max_execution_time=30,
            early_stopping_method="generate",
            return_intermediate_steps=False
        )

        self._system_context = self._build_system_context()

    def _build_system_context(self) -> str:
        """Build comprehensive system context"""
        return dedent(f"""\
            ## Hệ thống Phân tích Tài chính Tiếng Việt

            **Schema Database:**
            {db_service.get_schema_description()}

            **Quy tắc SQL QUAN TRỌNG:**
            1. **LUÔN LUÔN** filter theo user_id:
                ```sql
                JOIN accounts a ON t.account_id = a.id
                WHERE a.user_id = 'USER_ID_HERE'
                ```
            2. **Xử lý số tiền:** CAST(amount AS DECIMAL) cho tính toán
            3. **Quy ước:** amount > 0 = thu nhập, amount < 0 = chi tiêu
            4. **Format output:** Tiếng Việt, số tiền có đơn vị VND
            5. **Trả về:** Markdown format với headers, tables, lists

            **Template Response Markdown:**
            ```markdown
            ## 📊 Phân tích Chi tiêu Tháng này

            ### Tổng quan
            - **Tổng chi tiêu:** 5,200,000 VND
            - **So với tháng trước:** +15% ⬆️

            ### Top 5 Danh mục Chi tiêu
            | Danh mục | Số tiền | Số giao dịch | Tỷ lệ |
            |----------|---------|--------------|-------|
            | Ăn uống | 2,100,000 VND | 45 | 40% |
            | Di chuyển | 800,000 VND | 22 | 15% |

            ### 💡 Khuyến nghị
            1. **Tối ưu chi tiêu ăn uống** - Tiết kiệm 500,000 VND
            2. **Sử dụng giao thông công cộng** - Giảm 30% chi phí di chuyển
            ```
        """)

    async def execute_financial_query(
        self,
        user_id: str,
        question: str,
        system_prompt: str = None
    ) -> Dict[str, Any]:
        """Execute financial query with enhanced user context"""
        try:
            # Build comprehensive query with user context
            enhanced_query = self._build_enhanced_query(user_id, question)

            # Execute with error handling
            result = await self._execute_with_enhanced_retry(enhanced_query)

            # Parse and format result
            parsed_result = self._parse_result_with_markdown(result, user_id)

            return {
                "success": True,
                "data": parsed_result,
                "tokens_saved": True,
                "execution_time": "optimized",
                "user_id": user_id
            }
        except Exception as e:
            logger.error(f"SQL Agent error for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": self._generate_fallback_response(user_id, question),
                "user_id": user_id
            }

    def _build_enhanced_query(self, user_id: str, question: str) -> str:
        """Build enhanced query with user context and examples"""
        return dedent(f"""\
            {self._system_context}

            **User ID:** {user_id}
            **Câu hỏi:** {question}

            **Yêu cầu cụ thể:**
            1. Tạo SQL query với filter user_id = '{user_id}'
            2. Phân tích dữ liệu thực từ database
            3. Trả về response bằng Markdown format
            4. Bao gồm số liệu cụ thể và thống kê
            5. Đưa ra khuyến nghị thiết thực

            **Ví dụ SQL đúng:**
                ```sql
                SELECT
                    c.name as category_name,
                    COUNT(*) as transaction_count,
                    SUM(ABS(CAST(t.amount AS DECIMAL))) as total_amount
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE a.user_id = '{user_id}'
                    AND CAST(t.amount AS DECIMAL) < 0
                    AND t.date >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY c.name
                ORDER BY total_amount DESC;
                ```

            Hãy phân tích và trả lời câu hỏi với dữ liệu thực từ database.
        """)

    async def _execute_with_enhanced_retry(self, query: str, max_retries: int = 2) -> str:
        """Execute query with enhanced retry logic"""
        last_error = None

        for attempt in range(max_retries):
            try:
                logger.info(f"Executing SQL agent query (attempt {attempt + 1})")
                result = await self.agent.ainvoke({"input": query})

                output = result.get("output", "")
                if output and len(output.strip()) > 20:  # Valid response
                    return output

                logger.warning(f"Empty or short response on attempt {attempt + 1}")

            except Exception as e:
                last_error = e
                logger.warning(f"Query attempt {attempt + 1} failed: {str(e)}")

                if attempt < max_retries - 1:
                    # Simplify query for retry
                    query = query.replace("comprehensive", "simple").replace("detailed", "basic")
                    continue

        # If all attempts failed, raise the last error
        if last_error:
            raise last_error
        else:
            raise Exception("SQL agent returned empty response after all retries")

    def _parse_result_with_markdown(self, result: str, user_id: str) -> Dict[str, Any]:
        """Parse result and ensure markdown formatting"""
        if not result or len(result.strip()) < 10:
            return {
                "message": "Không tìm thấy dữ liệu cho user này",
                "markdown_response": self._generate_no_data_markdown(user_id),
                "summary": "No data available",
                "key_insights": []
            }

        # Ensure result contains markdown formatting
        if not any(marker in result for marker in ["##", "**", "|", "-", "*", "1."]):
            # Convert plain text to markdown
            result = self._convert_to_markdown(result)

        return {
            "message": "Analysis completed",
            "markdown_response": result,
            "summary": result[:200] + "..." if len(result) > 200 else result,
            "key_insights": self._extract_key_insights(result),
            "user_id": user_id
        }

    def _convert_to_markdown(self, text: str) -> str:
        """Convert plain text response to markdown format"""
        lines = text.split('\n')
        markdown_lines = ["## 📊 Phân tích Tài chính\n"]

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Convert to markdown list if it looks like a point
            if line.startswith('-') or line.startswith('•'):
                markdown_lines.append(f"- {line[1:].strip()}")
            elif ':' in line and len(line) < 100:
                # Convert key-value pairs to bold
                parts = line.split(':', 1)
                markdown_lines.append(f"**{parts[0].strip()}:** {parts[1].strip()}")
            else:
                markdown_lines.append(line)

        return '\n'.join(markdown_lines)

    def _generate_no_data_markdown(self, user_id: str) -> str:
        """Generate markdown response when no data is found"""
        return dedent(f"""\
            ## 📊 Phân tích Tài chính
            ### ⚠️ Chưa có dữ liệu
            Hiện tại chưa có dữ liệu tài chính cho tài khoản của bạn.
            ### 💡 Để bắt đầu:
            1. **Thêm tài khoản ngân hàng** - Kết nối để đồng bộ giao dịch
            2. **Nhập giao dịch thủ công** - Thêm thu chi hàng ngày
            3. **Phân loại giao dịch** - Gán danh mục cho từng khoản chi
            ### 📱 Hướng dẫn
            - Truy cập **Tài khoản** để thêm nguồn tài chính
            - Sử dụng **Thêm giao dịch** để ghi lại thu chi
            - Xem **Báo cáo** để theo dõi xu hướng chi tiêu
            > Sau khi có dữ liệu, bạn sẽ nhận được phân tích chi tiết về tình hình tài chính!
        """)

    def _generate_fallback_response(self, user_id: str, question: str) -> Dict[str, Any]:
        """Generate fallback response when SQL agent fails"""
        return {
            "message": "SQL analysis failed",
            "markdown_response": dedent(f"""\
                ## ❌ Lỗi Phân tích
                Xin lỗi, có lỗi khi phân tích câu hỏi: **{question}**
                ### 🔄 Hãy thử:
                1. **Đặt câu hỏi đơn giản hơn** - VD: "Chi tiêu tháng này"
                2. **Kiểm tra dữ liệu** - Đảm bảo có giao dịch trong hệ thống
                3. **Thử lại sau** - Hệ thống có thể đang bận
                ### 📞 Hỗ trợ
                Nếu vấn đề tiếp tục, vui lòng liên hệ bộ phận hỗ trợ.
            """),
            "summary": "Analysis failed due to system error",
            "key_insights": ["Lỗi hệ thống", "Cần thử lại"],
            "user_id": user_id
        }

    def _extract_key_insights(self, text: str) -> List[str]:
        """Extract key insights from markdown text"""
        insights = []
        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            # Look for bold text (insights)
            if '**' in line:
                # Extract text between ** markers
                import re
                bold_matches = re.findall(r'\*\*(.*?)\*\*', line)
                insights.extend(bold_matches)
            # Look for list items with numbers
            elif line.startswith('- ') or line.startswith('* '):
                insights.append(line[2:].strip())

        return insights[:5]  # Return top 5 insights

# Global agent instance
sql_agent = None

def get_sql_agent() -> FinancialSQLAgent:
    global sql_agent
    if sql_agent is None:
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        sql_agent = FinancialSQLAgent(api_key=api_key)
    return sql_agent