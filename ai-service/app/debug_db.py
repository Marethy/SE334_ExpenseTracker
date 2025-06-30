import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import db_service

def check_database():
    print("🔍 Checking database connection and data...")
    
    # Test connection
    if not db_service.test_connection():
        print("❌ Database connection failed!")
        return False
    
    # Check tables exist
    tables = db_service.get_table_names()
    print(f"📋 Available tables: {tables}")
    
    # Check sample data for a specific user
    test_user_id = "user_2z9DHMW3UKpwza1orMSp2eYZWyK"
    
    try:
        # Check accounts
        accounts_query = """
        SELECT id, user_id, name FROM accounts 
        WHERE user_id = :user_id LIMIT 5
        """
        accounts_df = db_service.execute_query(accounts_query, {"user_id": test_user_id})
        print(f"\n👤 Accounts for user {test_user_id}:")
        print(accounts_df)
        
        if accounts_df.empty:
            print("❌ No accounts found for this user!")
            return False
        
        # Check transactions
        transactions_query = """
        SELECT t.id, t.amount, t.date, t.category_id, c.name as category_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE a.user_id = :user_id 
        ORDER BY t.date DESC LIMIT 10
        """
        transactions_df = db_service.execute_query(transactions_query, {"user_id": test_user_id})
        print(f"\n💰 Recent transactions for user {test_user_id}:")
        print(transactions_df)
        
        if transactions_df.empty:
            print("❌ No transactions found for this user!")
            print("\n💡 This explains why AI analysis returns generic response.")
            print("   User needs to add transactions first!")
            return False
        
        # Summary stats
        summary_query = """
        SELECT 
            COUNT(*) as total_transactions,
            SUM(CASE WHEN CAST(amount AS DECIMAL) > 0 THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_income,
            SUM(CASE WHEN CAST(amount AS DECIMAL) < 0 THEN ABS(CAST(amount AS DECIMAL)) ELSE 0 END) as total_expenses
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = :user_id
        """
        summary_df = db_service.execute_query(summary_query, {"user_id": test_user_id})
        print(f"\n📊 Financial summary for user {test_user_id}:")
        print(summary_df)
        
        return True
        
    except Exception as e:
        print(f"❌ Database query error: {e}")
        return False

if __name__ == "__main__":
    check_database()