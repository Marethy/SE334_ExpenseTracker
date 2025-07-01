from langchain_openai import ChatOpenAI
from typing import Dict, Any, List, Optional
import logging
import pandas as pd
import re
from textwrap import dedent
import os

logger = logging.getLogger(__name__)

class FinancialSQLAgent:
    def __init__(self, api_key: str, base_url: str = "https://api.x.ai/v1"):
        """Initialize custom SQL agent for financial data analysis"""
        
        self.llm = ChatOpenAI(
            model="grok-3-mini",
            api_key=api_key,
            base_url=base_url,
            temperature=0,  # Deterministic for SQL generation
            max_tokens=600,  # Enough for SQL queries
            timeout=25,
            max_retries=2
        )
        
        # Import database service
        from app.database.database import db_service
        self.db_service = db_service
        
        # Test database connection
        if not self.db_service.test_connection():
            raise Exception("Database connection failed")
            
        logger.info("✅ Custom SQL Agent initialized successfully")

    async def execute_financial_query(
        self, 
        user_id: str, 
        question: str, 
        system_prompt: str = None
    ) -> Dict[str, Any]:
        """Execute financial query with custom logic"""
        try:
            logger.info(f"🔍 Processing question: {question}")
            
            # Step 1: Detect query type and generate appropriate SQL
            query_type = self._detect_query_type(question)
            sql_query = await self._generate_sql_query(user_id, question, query_type)
            
            logger.info(f"🔍 Generated SQL: {sql_query}")
            
            # Step 2: Execute SQL query safely
            results_df = await self._execute_sql_safely(sql_query, user_id)
            
            logger.info(f"🔍 Query returned {len(results_df)} rows")
            
            # Step 3: Format results based on query type
            formatted_response = self._format_results(results_df, question, query_type)
            
            # Step 4: Extract insights
            insights = self._extract_insights(results_df, query_type)
            
            return {
                "success": True,
                "data": {
                    "message": "SQL analysis completed successfully",
                    "markdown_response": formatted_response,
                    "summary": self._generate_summary(results_df, query_type),
                    "key_insights": insights,
                    "query_type": query_type,
                    "row_count": len(results_df)
                }
            }
            
        except Exception as e:
            logger.error(f"Custom SQL execution error for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": self._generate_fallback_response(user_id, question)
            }

    def _detect_query_type(self, question: str) -> str:
        """Detect the type of financial query"""
        question_lower = question.lower()
        
        if any(keyword in question_lower for keyword in ["chi tiêu", "danh mục", "category", "spending", "expense"]):
            return "spending_analysis"
        elif any(keyword in question_lower for keyword in ["thu nhập", "income", "earning"]):
            return "income_analysis" 
        elif any(keyword in question_lower for keyword in ["so sánh", "compare", "xu hướng", "trend"]):
            return "comparison_analysis"
        elif any(keyword in question_lower for keyword in ["tổng", "total", "summary", "overview"]):
            return "financial_summary"
        elif any(keyword in question_lower for keyword in ["tiết kiệm", "saving", "balance"]):
            return "savings_analysis"
        else:
            return "general_analysis"

    async def _generate_sql_query(self, user_id: str, question: str, query_type: str) -> str:
        """Generate SQL query based on question type"""
        
        # Use predefined queries for better reliability
        if query_type == "spending_analysis":
            return self._get_spending_analysis_query(user_id)
        elif query_type == "income_analysis":
            return self._get_income_analysis_query(user_id)
        elif query_type == "financial_summary":
            return self._get_financial_summary_query(user_id)
        elif query_type == "comparison_analysis":
            return self._get_comparison_query(user_id)
        elif query_type == "savings_analysis":
            return self._get_savings_analysis_query(user_id)
        else:
            # Use LLM for complex queries
            return await self._generate_custom_sql(user_id, question)

    def _get_spending_analysis_query(self, user_id: str) -> str:
        """Get spending analysis SQL query"""
        return f"""
        SELECT
            COALESCE(c.name, 'Uncategorized') as category_name,
            COUNT(*) as transaction_count,
            SUM(ABS(CAST(t.amount AS DECIMAL))) as total_amount,
            ROUND(
                SUM(ABS(CAST(t.amount AS DECIMAL))) * 100.0 / 
                NULLIF((
                    SELECT SUM(ABS(CAST(amount AS DECIMAL))) 
                    FROM transactions t2 
                    JOIN accounts a2 ON t2.account_id = a2.id 
                    WHERE a2.user_id = '{user_id}' 
                    AND CAST(t2.amount AS DECIMAL) < 0
                ), 0), 2
            ) as percentage,
            AVG(ABS(CAST(t.amount AS DECIMAL))) as avg_amount
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE a.user_id = '{user_id}'
            AND CAST(t.amount AS DECIMAL) < 0
        GROUP BY c.name
        ORDER BY total_amount DESC
        LIMIT 15;
        """

    def _get_income_analysis_query(self, user_id: str) -> str:
        """Get income analysis SQL query"""
        return f"""
        SELECT
            COALESCE(c.name, 'Income') as category_name,
            COUNT(*) as transaction_count,
            SUM(CAST(t.amount AS DECIMAL)) as total_amount,
            AVG(CAST(t.amount AS DECIMAL)) as avg_amount,
            DATE_TRUNC('month', t.date) as month
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE a.user_id = '{user_id}'
            AND CAST(t.amount AS DECIMAL) > 0
        GROUP BY c.name, DATE_TRUNC('month', t.date)
        ORDER BY total_amount DESC;
        """

    def _get_financial_summary_query(self, user_id: str) -> str:
        """Get financial summary SQL query"""
        return f"""
        SELECT
            COUNT(*) as total_transactions,
            SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_income,
            SUM(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) ELSE 0 END) as total_expenses,
            SUM(CAST(amount AS DECIMAL)) as net_amount,
            AVG(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) END) as avg_income,
            AVG(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) END) as avg_expense,
            COUNT(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN 1 END) as income_transactions,
            COUNT(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN 1 END) as expense_transactions,
            DATE_TRUNC('month', CURRENT_DATE) as analysis_period
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = '{user_id}'
            AND t.date >= DATE_TRUNC('month', CURRENT_DATE);
        """

    def _get_comparison_query(self, user_id: str) -> str:
        """Get comparison analysis query"""
        return f"""
        SELECT
            DATE_TRUNC('month', t.date) as month,
            SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END) as monthly_income,
            SUM(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) ELSE 0 END) as monthly_expenses,
            SUM(CAST(amount AS DECIMAL)) as monthly_net,
            COUNT(*) as monthly_transactions
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = '{user_id}'
            AND t.date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', t.date)
        ORDER BY month DESC;
        """

    def _get_savings_analysis_query(self, user_id: str) -> str:
        """Get savings analysis query"""
        return f"""
        SELECT
            DATE_TRUNC('month', t.date) as month,
            SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END) as income,
            SUM(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) ELSE 0 END) as expenses,
            SUM(CAST(amount AS DECIMAL)) as savings,
            ROUND(
                CASE 
                    WHEN SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END) > 0 
                    THEN SUM(CAST(amount AS DECIMAL)) * 100.0 / SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END)
                    ELSE 0 
                END, 2
            ) as savings_rate
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = '{user_id}'
        GROUP BY DATE_TRUNC('month', t.date)
        ORDER BY month DESC
        LIMIT 6;
        """

    async def _generate_custom_sql(self, user_id: str, question: str) -> str:
        """Generate custom SQL using LLM for complex queries"""
        prompt = f"""
        You are a PostgreSQL expert. Generate a SQL query for this financial question: "{question}"
        
        Database Schema:
        - accounts: id(TEXT), user_id(TEXT), name(TEXT)
        - transactions: id(TEXT), account_id(TEXT), amount(TEXT), date(TIMESTAMP), category_id(TEXT)
        - categories: id(TEXT), name(TEXT)
        
        Requirements:
        1. MUST filter by user_id = '{user_id}' through accounts JOIN
        2. Use CAST(amount AS DECIMAL) for calculations
        3. Negative amount = expense, positive = income
        4. Return ONLY the SQL query, no explanations
        5. Use Vietnamese column aliases when appropriate
        
        Query:
        """
        
        response = await self.llm.ainvoke([{"role": "user", "content": prompt}])
        sql = response.content.strip()
        
        # Clean SQL from markdown formatting
        if "```sql" in sql:
            sql = sql.split("```sql")[1].split("```")[0].strip()
        elif "```" in sql:
            sql = sql.split("```")[1].strip()
            
        return sql

    async def _execute_sql_safely(self, sql_query: str, user_id: str) -> pd.DataFrame:
        """Execute SQL with comprehensive safety checks"""
        # Security validations
        if user_id not in sql_query:
            raise ValueError(f"Query must filter by user_id '{user_id}' for security")
            
        if not sql_query.strip().upper().startswith('SELECT'):
            raise ValueError("Only SELECT queries are allowed")
            
        # Prevent dangerous operations
        dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
        sql_upper = sql_query.upper()
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                raise ValueError(f"Dangerous operation '{keyword}' not allowed")
        
        try:
            df = self.db_service.execute_query(sql_query)
            logger.info(f"✅ SQL executed successfully: {len(df)} rows returned")
            return df
        except Exception as e:
            logger.error(f"❌ SQL execution failed: {e}")
            logger.error(f"Query: {sql_query}")
            raise Exception(f"Database query failed: {str(e)}")

    def _format_results(self, df: pd.DataFrame, question: str, query_type: str) -> str:
        """Format query results as markdown based on type"""
        if df.empty:
            return self._format_no_data_response(query_type)
            
        if query_type == "spending_analysis":
            return self._format_spending_results(df)
        elif query_type == "income_analysis":
            return self._format_income_results(df)
        elif query_type == "financial_summary":
            return self._format_summary_results(df)
        elif query_type == "comparison_analysis":
            return self._format_comparison_results(df)
        elif query_type == "savings_analysis":
            return self._format_savings_results(df)
        else:
            return self._format_generic_results(df, question)

    def _format_spending_results(self, df: pd.DataFrame) -> str:
        """Format spending analysis results"""
        if df.empty:
            return "## ⚠️ Không có dữ liệu chi tiêu"
            
        total_amount = df['total_amount'].sum()
        total_transactions = df['transaction_count'].sum()
        top_category = df.iloc[0]
        
        markdown = f"""## 📊 Phân tích Chi tiêu Theo Danh mục

### 🎯 Tổng quan
- **Tổng chi tiêu:** {total_amount:,.0f} VND
- **Tổng giao dịch:** {total_transactions:,} giao dịch
- **Số danh mục:** {len(df)}
- **Danh mục lớn nhất:** {top_category['category_name']} ({top_category['percentage']:.1f}%)

### 📋 Chi tiết theo danh mục

| Xếp hạng | Danh mục | Số tiền (VND) | Giao dịch | Tỷ lệ | TB/giao dịch |
|----------|----------|---------------|-----------|-------|--------------|"""
        
        for i, row in df.head(10).iterrows():
            avg_amount = row.get('avg_amount', 0) or 0
            markdown += f"\n| {i+1} | **{row['category_name']}** | {row['total_amount']:,.0f} | {row['transaction_count']} | {row['percentage']:.1f}% | {avg_amount:,.0f} |"
        
        # Add insights
        markdown += f"""

### 💡 Phân tích & Khuyến nghị

**🔍 Nhận xét:**
- Danh mục **{top_category['category_name']}** chiếm tỷ lệ cao nhất ({top_category['percentage']:.1f}%)
- Trung bình mỗi giao dịch: {(total_amount/total_transactions):,.0f} VND

**🎯 Khuyến nghị:**
1. **Kiểm soát chi tiêu lớn:** Giảm 10-15% chi tiêu ở {top_category['category_name']}
2. **Theo dõi hàng tuần:** Đặt giới hạn ngân sách cho từng danh mục
3. **Tối ưu hóa:** Tìm cách tiết kiệm ở 3 danh mục chi tiêu cao nhất

> 📈 **Mẹo:** Sử dụng quy tắc 50/30/20 - 50% nhu cầu thiết yếu, 30% mong muốn, 20% tiết kiệm"""
        
        return markdown

    def _format_financial_summary_results(self, df: pd.DataFrame) -> str:
        """Format financial summary results"""
        if df.empty:
            return "## ⚠️ Không có dữ liệu tài chính"
            
        row = df.iloc[0]
        income = row.get('total_income', 0) or 0
        expenses = row.get('total_expenses', 0) or 0
        net = row.get('net_amount', 0) or 0
        transactions = row.get('total_transactions', 0) or 0
        
        savings_rate = (net / income * 100) if income > 0 else 0
        
        return f"""## 📊 Tổng quan Tài chính Tháng này

### 💰 Số liệu chính
- **Thu nhập:** {income:,.0f} VND
- **Chi tiêu:** {expenses:,.0f} VND  
- **Số dư ròng:** {net:,.0f} VND
- **Tổng giao dịch:** {transactions:,}

### 📈 Phân tích hiệu suất
- **Tỷ lệ tiết kiệm:** {savings_rate:.1f}%
- **Chi tiêu/Thu nhập:** {(expenses/income*100) if income > 0 else 0:.1f}%
- **TB chi tiêu/giao dịch:** {(expenses/row.get('expense_transactions', 1)):,.0f} VND
- **TB thu nhập/giao dịch:** {(income/row.get('income_transactions', 1)):,.0f} VND

### 🎯 Đánh giá tổng thể
{self._get_financial_health_assessment(savings_rate, net)}

### 💡 Khuyến nghị
{self._get_financial_recommendations(savings_rate, income, expenses)}
"""

    def _get_financial_health_assessment(self, savings_rate: float, net_amount: float) -> str:
        """Get financial health assessment"""
        if savings_rate >= 20:
            return "🟢 **Xuất sắc:** Tỷ lệ tiết kiệm rất tốt! Bạn đang quản lý tài chính hiệu quả."
        elif savings_rate >= 10:
            return "🟡 **Tốt:** Tỷ lệ tiết kiệm ổn định. Có thể cải thiện thêm một chút."
        elif savings_rate >= 0:
            return "🟠 **Cần cải thiện:** Tỷ lệ tiết kiệm thấp. Nên tăng cường kiểm soát chi tiêu."
        else:
            return "🔴 **Cảnh báo:** Chi tiêu vượt thu nhập! Cần điều chỉnh ngân sách ngay."

    def _get_financial_recommendations(self, savings_rate: float, income: float, expenses: float) -> str:
        """Get personalized financial recommendations"""
        recommendations = []
        
        if savings_rate < 10:
            recommendations.append("📉 **Tăng tỷ lệ tiết kiệm:** Mục tiêu 10-20% thu nhập")
            
        if expenses > income:
            recommendations.append("⚠️ **Giảm chi tiêu khẩn cấp:** Cắt giảm các khoản không thiết yếu")
            
        if savings_rate >= 15:
            recommendations.append("💎 **Đầu tư thông minh:** Xem xét đầu tư để tăng thu nhập thụ động")
            
        recommendations.extend([
            "📊 **Theo dõi chi tiết:** Phân tích chi tiêu theo danh mục hàng tuần",
            "🎯 **Đặt mục tiêu:** Lập kế hoạch tài chính ngắn hạn và dài hạn"
        ])
        
        return "\n".join(f"{i+1}. {rec}" for i, rec in enumerate(recommendations))

    def _format_comparison_results(self, df: pd.DataFrame) -> str:
        """Format comparison analysis results"""
        if df.empty:
            return "## ⚠️ Không có dữ liệu để so sánh"
            
        markdown = "## 📈 Phân tích So sánh Theo Tháng\n\n"
        markdown += "| Tháng | Thu nhập (VND) | Chi tiêu (VND) | Tiết kiệm (VND) | Giao dịch |\n"
        markdown += "|-------|----------------|----------------|-----------------|----------|\n"
        
        for _, row in df.iterrows():
            month = row['month'].strftime('%m/%Y') if pd.notnull(row['month']) else 'N/A'
            income = row.get('monthly_income', 0) or 0
            expenses = row.get('monthly_expenses', 0) or 0
            net = row.get('monthly_net', 0) or 0
            transactions = row.get('monthly_transactions', 0) or 0
            
            markdown += f"| {month} | {income:,.0f} | {expenses:,.0f} | {net:,.0f} | {transactions} |\n"
            
        return markdown

    def _format_savings_results(self, df: pd.DataFrame) -> str:
        """Format savings analysis results"""
        if df.empty:
            return "## ⚠️ Không có dữ liệu tiết kiệm"
            
        avg_savings_rate = df['savings_rate'].mean()
        
        markdown = f"""## 💰 Phân tích Tiết kiệm

### 📊 Tỷ lệ tiết kiệm trung bình: {avg_savings_rate:.1f}%

| Tháng | Thu nhập | Chi tiêu | Tiết kiệm | Tỷ lệ tiết kiệm |
|-------|----------|----------|-----------|-----------------|"""
        
        for _, row in df.iterrows():
            month = row['month'].strftime('%m/%Y') if pd.notnull(row['month']) else 'N/A'
            markdown += f"\n| {month} | {row['income']:,.0f} | {row['expenses']:,.0f} | {row['savings']:,.0f} | {row['savings_rate']:.1f}% |"
            
        return markdown

    def _format_generic_results(self, df: pd.DataFrame, question: str) -> str:
        """Format generic query results"""
        markdown = f"## 📊 Kết quả phân tích: {question}\n\n"
        
        # Convert DataFrame to markdown table
        if len(df.columns) <= 6:  # Reasonable table size
            markdown += df.to_markdown(index=False, floatfmt=".0f")
        else:
            # Show first few columns if too many
            markdown += df.iloc[:, :5].to_markdown(index=False, floatfmt=".0f")
            markdown += f"\n\n*Hiển thị 5/{len(df.columns)} cột đầu tiên*"
            
        return markdown

    def _format_no_data_response(self, query_type: str) -> str:
        """Format response when no data is found"""
        messages = {
            "spending_analysis": "## ⚠️ Không có dữ liệu chi tiêu\n\nChưa có giao dịch chi tiêu nào trong hệ thống.",
            "income_analysis": "## ⚠️ Không có dữ liệu thu nhập\n\nChưa có giao dịch thu nhập nào trong hệ thống.",
            "financial_summary": "## ⚠️ Không có dữ liệu tài chính\n\nChưa có giao dịch nào trong tháng này.",
            "default": "## ⚠️ Không tìm thấy dữ liệu\n\nKhông có dữ liệu phù hợp với yêu cầu của bạn."
        }
        
        base_message = messages.get(query_type, messages["default"])
        
        return f"""{base_message}

### 🚀 Để bắt đầu:
1. **Thêm tài khoản** - Kết nối ngân hàng hoặc ví điện tử
2. **Nhập giao dịch** - Thêm thu chi hàng ngày
3. **Phân loại danh mục** - Gán category cho từng giao dịch

> 💡 Sau khi có dữ liệu, AI sẽ phân tích chi tiết cho bạn!"""

    def _extract_insights(self, df: pd.DataFrame, query_type: str) -> List[str]:
        """Extract key insights from query results"""
        if df.empty:
            return ["Chưa có dữ liệu để phân tích"]
            
        insights = []
        
        if query_type == "spending_analysis" and 'category_name' in df.columns:
            top_categories = df.head(3)['category_name'].tolist()
            insights.extend([f"Top {i+1}: {cat}" for i, cat in enumerate(top_categories)])
            
        elif query_type == "financial_summary":
            row = df.iloc[0]
            if row.get('net_amount', 0) > 0:
                insights.append("Tình hình tài chính tích cực")
            else:
                insights.append("Cần kiểm soát chi tiêu")
                
        return insights[:5]  # Return max 5 insights

    def _generate_summary(self, df: pd.DataFrame, query_type: str) -> str:
        """Generate concise summary of results"""
        if df.empty:
            return "Không tìm thấy dữ liệu phù hợp"
            
        summaries = {
            "spending_analysis": f"Phân tích {len(df)} danh mục chi tiêu",
            "income_analysis": f"Phân tích thu nhập từ {len(df)} nguồn", 
            "financial_summary": "Tổng quan tài chính tháng hiện tại",
            "comparison_analysis": f"So sánh {len(df)} tháng gần đây",
            "savings_analysis": f"Phân tích tiết kiệm {len(df)} tháng",
            "general_analysis": f"Phân tích tổng quát với {len(df)} kết quả"
        }
        
        return summaries.get(query_type, f"Phân tích hoàn tất với {len(df)} kết quả")

    def _generate_fallback_response(self, user_id: str, question: str) -> Dict[str, Any]:
        """Generate fallback response when SQL execution fails"""
        return {
            "message": "Phân tích thất bại",
            "markdown_response": f"""## ❌ Không thể phân tích câu hỏi

**Câu hỏi:** {question}

### 🔄 Hãy thử:
1. **Đơn giản hóa câu hỏi** - VD: "Chi tiêu tháng này"
2. **Kiểm tra dữ liệu** - Đảm bảo có giao dịch trong hệ thống  
3. **Thử lại sau** - Hệ thống có thể đang bận

### 📞 Hỗ trợ
Nếu vấn đề tiếp tục, vui lòng liên hệ bộ phận hỗ trợ.""",
            "summary": "Không thể thực hiện phân tích",
            "key_insights": ["Lỗi hệ thống", "Cần thử lại"],
            "user_id": user_id
        }

# Global agent instance
sql_agent = None

def get_sql_agent() -> FinancialSQLAgent:
    """Get SQL agent instance with lazy initialization"""
    global sql_agent
    if sql_agent is None:
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        try:
            sql_agent = FinancialSQLAgent(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize SQL agent: {e}")
            raise
    return sql_agent