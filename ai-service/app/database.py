from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from textwrap import dedent

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
metadata = MetaData()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_connection():
    return engine.connect()

DATABASE_SCHEMA = dedent("""\
    Database Schema Information:
    1. Table: accounts
    - id (text, primary key)
    - name (text, not null) - Tên tài khoản
    - user_id (text, not null) - ID người dùng

    2. Table: categories
    - id (text, primary key)
    - name (text, not null) - Tên danh mục chi tiêu
    - user_id (text, not null) - ID người dùng

    3. Table: transactions
    - id (text, primary key)
    - amount (decimal(15,2), not null) - Số tiền (VND), âm = chi tiêu, dương = thu nhập
    - payee (text, not null) - Người/nơi nhận tiền
    - notes (text) - Ghi chú
    - date (timestamp, not null) - Ngày giao dịch
    - account_id (text, foreign key to accounts.id)
    - category_id (text, foreign key to categories.id)

    4. Table: subscriptions
    - id (text, primary key)
    - user_id (text, not null) - ID người dùng
    - plan (text) - Gói đăng ký (free/premium)
    - status (text) - Trạng thái
    - start_date (timestamp)
    - end_date (timestamp)

    Relationships:
    - transactions.account_id -> accounts.id
    - transactions.category_id -> categories.id
    - All tables are filtered by user_id for data isolation

    Currency: VND (Việt Nam Đồng)
    Amount convention: Positive = Income, Negative = Expense
""")
