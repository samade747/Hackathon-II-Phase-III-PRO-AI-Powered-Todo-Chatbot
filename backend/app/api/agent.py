import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
from app.auth import verify_jwt
from .skills import skill_manager

router = APIRouter(prefix="/agent", tags=["agent"])

class AgentRequest(BaseModel):
    utterance: str
    lang: Optional[str] = "en"
    voice: Optional[bool] = False

class AgentResponse(BaseModel):
    action: str
    result: Dict[str, Any]
    message: str

def save_interaction(interaction_data: Dict[str, Any]):
    try:
        history_path = "history/interactions.json"
        os.makedirs(os.path.dirname(history_path), exist_ok=True)
        
        data = {"history": []}
        if os.path.exists(history_path):
            with open(history_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        
        data["history"].append(interaction_data)
        
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")

@router.post("/dispatch", response_model=AgentResponse)
async def dispatch_agent(
    request: AgentRequest,
    user: dict = Depends(verify_jwt)
):
    utterance = request.utterance.strip()
    user_id = user["user_id"]
    
    # 1. Translation / Language Detection
    trans_res = skill_manager.execute_skill("translator_urdu", {"utterance": utterance})
    working_utterance = trans_res.get("utterance_en", utterance)
    is_urdu = trans_res.get("detected_lang") == "ur"
    
    # 2. Intent Extraction
    intent_res = skill_manager.execute_skill("intent_extractor", {"utterance": working_utterance})
    intent = intent_res.get("intent")
    slots = intent_res.get("slots", {})
    
    # 3. Todo Orchestration via MCP
    from app.mcp_server import mcp
    
    action = "clarify"
    result = {}
    
    if intent == "add_task" or intent == "create":
        item = slots.get("item", "something")
        priority = slots.get("priority", "medium")
        recurrence = slots.get("recurrence", "none")
        tool_res = await mcp.call_tool("add_todo", {
            "title": item, 
            "user_id": user_id,
            "priority": priority,
            "recurrence": recurrence
        })
        action = "create"
        result = {"task": item, "priority": priority, "recurrence": recurrence, "response": tool_res}
    elif intent == "list_tasks":
        tool_res = await mcp.call_tool("list_todos", {"user_id": user_id})
        action = "list"
        result = {"items": [], "response": tool_res} 
    elif intent == "complete_task":
        item = slots.get("item", "something")
        tool_res = await mcp.call_tool("complete_todo", {"task_id": item, "user_id": user_id})
        action = "update"
        result = {"task": item, "response": tool_res}
    elif intent == "delete_task":
        item = slots.get("item", "something")
        tool_res = await mcp.call_tool("delete_todo", {"task_id": item, "user_id": user_id})
        action = "delete"
        result = {"task": item, "response": tool_res}
    else:
        action = "clarify"
        result = {}

    # 4. Agent Response Selection (Multilingual)
    if is_urdu:
        if action == "create":
            message = f"اوکے جی، میں نے '{result.get('task')}' آپ کی لسٹ میں شامل کر دیا ہے۔ 🚀"
        elif action == "update":
            message = f"زبردست! '{result.get('task')}' مکمل ہو گیا ہے۔ ✅"
        elif action == "delete":
            message = f"اوکے، میں نے '{result.get('task')}' آپ کی لسٹ سے حذف کر دیا ہے۔ 🗑️"
        else:
            message = "معذرت، میں سمجھ نہیں سکا۔ کیا آپ دوبارہ بتا سکتے ہیں؟ 🧠"
    else:
        if action == "create":
            message = f"Got it! I've added '{result.get('task')}' to your list. Mission started! 🚀"
        elif action == "update":
            message = f"Mission accomplished! '{result.get('task')}' is now marked as completed. ✅"
        elif action == "delete":
            message = f"Target eliminated! '{result.get('task')}' has been removed from your objectives. 🗑️"
        elif action == "list":
            message = "Accessing the archives... Here are your current objectives. 📋"
        else:
            message = "I'm not quite sure how to handle that objective. Could you rephrase it for AI Agentixz USA? 🧠"

    # 5. Save History
    save_interaction({
        "user_id": user_id,
        "utterance": utterance,
        "action": action,
        "agent_response": message,
        "timestamp": datetime.now().isoformat()
    })

    return AgentResponse(
        action=action,
        result=result,
        message=message
    )
