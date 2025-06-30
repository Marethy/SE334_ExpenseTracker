from sqlalchemy import text
from app.database.database import db_service
import logging

logger = logging.getLogger(__name__)

def create_conversation_history_table():
    """Create conversation_history table"""
    try:
        create_table_sql = text("""
            CREATE TABLE IF NOT EXISTS conversation_history (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                question TEXT NOT NULL,
                response TEXT NOT NULL,
                analysis_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_conversation_user_created
            ON conversation_history (user_id, created_at DESC);
        """)

        with db_service.engine.connect() as conn:
            conn.execute(create_table_sql)
            conn.commit()

        logger.info("✅ conversation_history table created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating conversation_history table: {e}")
        return False

def run_migrations():
    """Run all database migrations"""
    try:
        logger.info("🔄 Running database migrations...")

        # Test connection first
        if not db_service.test_connection():
            logger.error("❌ Database connection failed, skipping migrations")
            return False

        # Create tables
        success = create_conversation_history_table()

        if success:
            logger.info("✅ All migrations completed successfully")
        else:
            logger.error("❌ Some migrations failed")

        return success
    except Exception as e:
        logger.error(f"❌ Migration error: {e}")
        return False

if __name__ == "__main__":
    run_migrations()