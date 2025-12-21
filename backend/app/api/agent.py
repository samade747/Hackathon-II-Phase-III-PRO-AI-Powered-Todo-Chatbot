from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
from app.auth import verify_jwt

router = APIRouter(prefix="/agent", tags=["agent"])

class AgentRequest(BaseModel):
    utterance: str
    lang: Optional[str] = "en"
    voice: Optional[bool] = False

class AgentResponse(BaseModel):
    action: str
    result: Dict[str, Any]
    message: str

@router.post("/dispatch", response_model=AgentResponse)
async def dispatch_agent(
    request: AgentRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Orchestrates the agent flow:
    1. Detect language (simulated)
    2. Extract intent and slots (simulated)
    3. Map to action
    4. Generate human-like response
    """
    utterance = request.utterance.strip()
    user_id = user.get("user_id")
    
    # Simple keyword-based intent extraction for Phase III MVP
    # In a real scenario, this would call specialized subagents or LLM APIs
    
    is_urdu = any("\u0600" <= char <= "\u06FF" for char in utterance)
    
    if is_urdu:
        # Simulate translator-urdu skill
        if "دودھ" in utterance: # 'milk' in Urdu
             return AgentResponse(
                action="create",
                result={"task": "Buy milk", "source": "urdu"},
                message="ٹھیک ہے! میں نے آپ کی فہرست میں 'دودھ خریدنا' شامل کر دیا ہے۔ کوئی اور کام؟"
            )
        return AgentResponse(
            action="clarify",
            result={},
            message="میں آپ کی مدد کیسے کر سکتا ہوں؟ آپ مجھے ٹاسک شامل کرنے یا مٹانے کے لیے کہہ سکتے ہیں۔"
        )

    # English human-like responses
    if "buy milk" in utterance.lower():
        return AgentResponse(
            action="create",
            result={"task": "Buy milk", "due": "soon"},
            message="Absolutely! I've added 'Buy milk' to your todo list. Anything else I can help you with?"
        )
    
    if "list" in utterance.lower() or "show" in utterance.lower():
        return AgentResponse(
            action="list",
            result={"tasks": ["Buy milk", "Finish report"]},
            message="Here are your current tasks. You've got 2 things to do today. Need me to prioritize any of them?"
        )

    return AgentResponse(
        action="clarify",
        result={},
        message=f"I hear you! You mentioned '{utterance}'. I'm still learning, but I can help you manage your tasks. Would you like to add a new one?"
    )
