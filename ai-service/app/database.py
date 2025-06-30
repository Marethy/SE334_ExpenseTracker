# ai-service/app/database.py
from sqlalchemy import create_engine, MetaData, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv
from textwrap import dedent
import logging
from typing import Dict, List, Any, Optional
import pandas as pd
import re

load_dotenv()

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.database_url = self._get_database_url()
        
        self.engine = create_engine(
            self.database_url,
            poolclass=QueuePool,  # Changed from StaticPool for better performance
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,  # 1 hour
            echo=False,
            connect_args={
                "connect_timeout": 10,
                "application_name": "ai_financial_service"
            }
        )

        self.SessionLocal = sessionmaker(
            autocommit=False, 
            autoflush=False, 
            bind=self.engine
        )
        self.metadata = MetaData()

        # Load schema info with error handling
        self._schema_info = self._load_schema_info()

    def _get_database_url(self) -> str:
        """Get and fix database URL for SQLAlchemy compatibility"""
        url = os.getenv("DRIZZLE_DATABASE_URL")
        if not url:
            raise ValueError("DRIZZLE_DATABASE_URL environment variable is required")
        
        # Fix postgres:// to postgresql:// for SQLAlchemy 1.4+
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
            logger.info("Fixed database URL scheme from postgres:// to postgresql://")
        
        logger.info(f"Database URL: {self._mask_url(url)}")
        return url
    
    def _mask_url(self, url: str) -> str:
        """Mask sensitive information in URL for logging"""
        return re.sub(r'://([^:]+):([^@]+)@', r'://\1:***@', url)

    def get_db(self):
        """Get database session"""
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def get_connection(self):
        """Get database connection"""
        return self.engine.connect()

    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False

    def _load_schema_info(self) -> Dict[str, Any]:
        """Load database schema information for AI agent"""
        try:
            # Test connection first
            if not self.test_connection():
                logger.warning("Cannot load schema info - database connection failed")
                return {"tables": {}, "relationships": [], "indexes": {}}

            inspector = inspect(self.engine)
            tables = inspector.get_table_names()

            schema_info = {
                "tables": {},
                "relationships": [],
                "indexes": {}
            }

            for table_name in tables:
                try:
                    columns = inspector.get_columns(table_name)
                    foreign_keys = inspector.get_foreign_keys(table_name)
                    indexes = inspector.get_indexes(table_name)

                    schema_info["tables"][table_name] = {
                        "columns": [
                            {
                                "name": col["name"],
                                "type": str(col["type"]),
                                "nullable": col["nullable"],
                                "primary_key": col.get("primary_key", False)
                            }
                            for col in columns
                        ],
                        "foreign_keys": foreign_keys
                    }

                    schema_info["indexes"][table_name] = indexes

                    # Build relationships
                    for fk in foreign_keys:
                        if fk.get("constrained_columns") and fk.get("referred_columns"):
                            schema_info["relationships"].append({
                                "from_table": table_name,
                                "from_column": fk["constrained_columns"][0],
                                "to_table": fk["referred_table"],
                                "to_column": fk["referred_columns"][0]
                            })

                except Exception as e:
                    logger.warning(f"Error loading info for table {table_name}: {e}")
                    continue

            logger.info(f"✅ Loaded schema info for {len(schema_info['tables'])} tables")
            return schema_info

        except Exception as e:
            logger.error(f"Error loading schema info: {e}")
            return {"tables": {}, "relationships": [], "indexes": {}}

    def execute_query(self, query: str, params: Dict = None) -> pd.DataFrame:
        """Execute SQL query and return results as DataFrame"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                df = pd.DataFrame(result.fetchall(), columns=result.keys())
                logger.debug(f"Query executed successfully, returned {len(df)} rows")
                return df
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise

    def execute_query_safe(self, query: str, params: Dict = None) -> Optional[pd.DataFrame]:
        """Execute query with error handling, return None on failure"""
        try:
            return self.execute_query(query, params)
        except Exception as e:
            logger.error(f"Safe query execution failed: {e}")
            return None

    def get_user_financial_summary(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """Get comprehensive financial summary for user"""
        # Fixed SQL query with proper interval syntax
        query = """
        WITH user_accounts AS (
            SELECT id FROM accounts WHERE user_id = :user_id
        ),
        recent_transactions AS (
            SELECT t.* FROM transactions t
            JOIN user_accounts ua ON t.account_id = ua.id
            WHERE t.date >= CURRENT_DATE - INTERVAL '%s days'
        ),
        summary_stats AS (
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_income,
                SUM(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) ELSE 0 END) as total_expenses,
                SUM(CAST(amount AS DECIMAL)) as net_amount,
                AVG(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) END) as avg_expense
            FROM recent_transactions
        ),
        category_breakdown AS (
            SELECT 
                COALESCE(c.name, 'Uncategorized') as category_name,
                COUNT(*) as transaction_count,
                SUM(ABS(CAST(t.amount AS DECIMAL))) as total_amount
            FROM recent_transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE CAST(t.amount AS DECIMAL) < 0
            GROUP BY c.name
            ORDER BY total_amount DESC
            LIMIT 10
        )
        SELECT 
            s.total_transactions,
            s.total_income,
            s.total_expenses,
            s.net_amount,
            s.avg_expense,
            COALESCE(
                json_agg(
                    json_build_object(
                        'category', cb.category_name,
                        'amount', cb.total_amount,
                        'count', cb.transaction_count
                    )
                ) FILTER (WHERE cb.category_name IS NOT NULL),
                '[]'::json
            ) as top_categories
        FROM summary_stats s
        LEFT JOIN category_breakdown cb ON true
        GROUP BY s.total_transactions, s.total_income, s.total_expenses, s.net_amount, s.avg_expense
        """ % period_days

        try:
            result = self.execute_query_safe(query, {"user_id": user_id})
            if result is not None and not result.empty:
                return result.iloc[0].to_dict()
            return {
                "total_transactions": 0,
                "total_income": 0,
                "total_expenses": 0,
                "net_amount": 0,
                "avg_expense": 0,
                "top_categories": []
            }
        except Exception as e:
            logger.error(f"Error getting financial summary: {e}")
            return {}

    def get_schema_description(self) -> str:
        """Get detailed schema description for AI agent"""
        return dedent(f"""\
        Database Schema Information for Financial Analysis:
        
        TABLES:
        {self._format_tables_info()}
        
        RELATIONSHIPS:
        {self._format_relationships_info()}
        
        IMPORTANT NOTES:
        - Currency: Vietnamese Dong (VND)
        - Amount convention: Positive = Income, Negative = Expense
        - All tables are filtered by user_id for data isolation
        - Use CAST(amount AS DECIMAL) for numerical operations on amount column
        - Dates are stored as timestamps, use date functions for filtering
        - Category can be NULL (uncategorized transactions)
        - Always JOIN with accounts table to filter by user_id for security
        
        COMMON QUERY PATTERNS:
        - Total income: SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END)
        - Total expenses: SUM(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) ELSE 0 END)
        - Monthly filter: WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
        - User filter: JOIN accounts a ON t.account_id = a.id WHERE a.user_id = :user_id
        - Period filter: WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        
        SECURITY REQUIREMENTS:
        - ALWAYS filter by user_id through accounts table
        - Use parameterized queries to prevent SQL injection
        - Never expose data from other users
        """)

    def _format_tables_info(self) -> str:
        """Format table information for schema description"""
        if not self._schema_info.get("tables"):
            return "No table information available"
        
        info_parts = []
        for table_name, table_info in self._schema_info["tables"].items():
            columns_info = []
            for col in table_info["columns"]:
                col_desc = f"  - {col['name']} ({col['type']})"
                if col['primary_key']:
                    col_desc += " [PRIMARY KEY]"
                if not col['nullable']:
                    col_desc += " [NOT NULL]"
                columns_info.append(col_desc)
            
            info_parts.append(f"{table_name}:\n" + "\n".join(columns_info))
        
        return "\n\n".join(info_parts)

    def _format_relationships_info(self) -> str:
        """Format relationship information"""
        if not self._schema_info.get("relationships"):
            return "No relationship information available"
        
        relationships = []
        for rel in self._schema_info["relationships"]:
            relationships.append(
                f"- {rel['from_table']}.{rel['from_column']} -> {rel['to_table']}.{rel['to_column']}"
            )
        return "\n".join(relationships)

    def get_table_names(self) -> List[str]:
        """Get list of table names"""
        return list(self._schema_info.get("tables", {}).keys())

    def close(self):
        """Close database connections"""
        try:
            self.engine.dispose()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

# Create global database service instance
db_service = None

def get_db_service() -> DatabaseService:
    """Get database service instance with lazy initialization"""
    global db_service
    if db_service is None:
        try:
            db_service = DatabaseService()
        except Exception as e:
            logger.error(f"Failed to initialize database service: {e}")
            raise
    return db_service

# For backward compatibility
try:
    db_service = get_db_service()
except Exception as e:
    logger.warning(f"Database service initialization failed: {e}")
    db_service = None