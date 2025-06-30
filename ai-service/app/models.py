from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserContext(BaseModel):
    user_id: str
    age: Optional[int] = None
    monthly_income: Optional[float] = None
    financial_goals: Optional[List[str]] = None
    spending_preferences: Optional[Dict[str, Any]] = None
    risk_tolerance: Optional[str] = None
    last_interaction: Optional[datetime] = None

class ChatMessage(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    response: str
    data: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    confidence: float = 0.0