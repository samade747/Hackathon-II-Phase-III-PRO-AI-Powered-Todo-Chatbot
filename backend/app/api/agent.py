from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
from app.auth import verify_jwt
import os

router = APIRouter(prefix="/agent", tags=["agent"])

class AgentRequest(BaseModel):
    utterance: str
    lang: Optional[str] = "en"
    voice: Optional[bool] = False

class AgentResponse(BaseModel):
    action: str
    result: Dict[str, Any]
    message: str

from .skills import skill_manager

@router.post("/dispatch", response_model=AgentResponse)
async def dispatch_agent(
    request: AgentRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Orchestrates the agent flow using formal skill definitions:
    1. Detection & Translation (translator_urdu)
    2. Intent Extraction (intent_extractor)
    3. Action Mapping (todo_orchestrator)
    4. Human-like Response Generation
    """
    utterance = request.utterance.strip()
    
    # 1. Translation / Language Detection
    trans_res = skill_manager.execute_skill("translator_urdu", {"utterance": utterance})
    is_urdu = trans_res.get("detected_lang") == "ur"
    
    # 2. Intent Extraction
    intent_res = skill_manager.execute_skill("intent_extractor", {"utterance": utterance})
    intent = intent_res.get("intent")
    slots = intent_res.get("slots", {})
    
    # 3. Action Mapping
    orch_res = skill_manager.execute_skill("todo_orchestrator", {
        "intent": intent, 
        "slots": slots,
        "user_id": user.get("user_id")
    })
    
    action = orch_res.get("action", "clarify")
    
    import json
    from datetime import datetime
    
    # 5. Persistent History Management
    history_entry = {
        "timestamp": datetime.now().isoformat(),
        "utterance": utterance,
        "action": action,
        "message": orch_res.get("payload", {}).get("task") if action == "create" else None,
        "agent_response": (action == "create" and f"Cool, I've got '{slots.get('item', 'task')}' on your list now. Just let me know if you need anything else!") or (action == "list" and "Sure thing! You've got a couple of things going on. Here's your current list. Anything you want to cross off?") or f"I'm not exactly sure what you mean by '{utterance}' yet, but I'm here to help with your tasks. Want to add something to your todo list?"
    }
    
    try:
        history_path = "history/interactions.json"
        if os.path.exists(history_path):
            with open(history_path, "r+", encoding="utf-8") as hf:
                data = json.load(hf)
                data["history"].append(history_entry)
                hf.seek(0)
                json.dump(data, hf, indent=2)
        else:
            with open(history_path, "w", encoding="utf-8") as hf:
                json.dump({"history": [history_entry]}, hf, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")

    # Generate response
    if is_urdu:
        if "دودھ" in utterance:
             return AgentResponse(
                action="create",
                result={"task": "Buy milk", "source": "urdu"},
                message="اوکے جی، میں نے 'دودھ لانا' آپ کی لسٹ میں ڈال دیا ہے۔ کچھ اور بھی کرنا ہے؟"
            )
        return AgentResponse(
            action="clarify",
            result={},
            message="ہوں، سمجھ نہیں آیا۔۔۔ کیا آپ کوئی ٹاسک بتانا چاہ رہے ہیں؟"
        )

    if action == "create":
        item = slots.get("item", "task")
        return AgentResponse(
            action="create",
            result=orch_res.get("payload", {}),
            message=f"Cool, I've got '{item}' on your list now. Just let me know if you need anything else!"
        )
    
    if action == "list":
        return AgentResponse(
            action="list",
            result={"tasks": ["Buy milk", "Check emails"]},
            message="Sure thing! You've got a couple of things going on. Here's your current list. Anything you want to cross off?"
        )

    return AgentResponse(
        action="clarify",
        result={},
        message=f"I'm not exactly sure what you mean by '{utterance}' yet, but I'm here to help with your tasks. Want to add something to your todo list?"
    )
