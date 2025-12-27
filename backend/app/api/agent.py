import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Any, Dict
from app.auth import verify_jwt, supabase
from .skills import skill_manager

router = APIRouter(prefix="/agent", tags=["agent"])

@router.get("/ping")
async def ping():
    return {"message": "Agent is online", "timestamp": datetime.now().isoformat()}

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
        from app.auth import supabase_admin
        # Ensure timestamp is set
        if "timestamp" not in interaction_data:
            interaction_data["timestamp"] = datetime.now().isoformat()
            
        supabase_admin.table("interactions").insert(interaction_data).execute()
    except Exception as e:
        print(f"Error saving history: {e}")

@router.post("/dispatch", response_model=AgentResponse)
async def dispatch_agent(
    request: AgentRequest,
    user: dict = Depends(verify_jwt)
):
    print(f"-------- DISPATCH AGENT CALL --------")
    utterance = request.utterance.strip()
    print(f"User: {user['user_id']} | Utterance: {utterance}")
    user_id = user["user_id"]
    
    # 1. Translation / Language Detection
    trans_res = skill_manager.execute_skill("translator_urdu", {"utterance": utterance})
    working_utterance = trans_res.get("utterance_en", utterance)
    is_urdu = trans_res.get("detected_lang") == "ur"
    print(f"Working Utterance (EN): {working_utterance} | Is Urdu: {is_urdu}")
    
    # 2. Intent Extraction
    intent_res = skill_manager.execute_skill("intent_extractor", {"utterance": working_utterance})
    intent = intent_res.get("intent")
    slots = intent_res.get("slots", {})
    print(f"Detected Intent: {intent} | Slots: {slots}")
    
    # 3. Todo Orchestration via MCP
    from app.mcp_server import mcp
    
    action = "clarify"
    result = {}
    
    if intent == "add_task" or intent == "create":
        item = slots.get("item") or "something"
        priority = slots.get("priority") or "medium"
        recurrence = slots.get("recurrence") or "none"
        
        # Check if item is missing or too generic
        if not item or item.lower() in ["something", "task", "todo", "it", ""]:
            action = "clarify_add_task"
            result = {"missing": "task_details", "priority": priority, "recurrence": recurrence}
        else:
            due_date = slots.get("due_date") # Can be None, mcp_server now handles str | None
            tool_res = await mcp.call_tool("add_todo", {
                "title": item, 
                "user_id": user_id,
                "priority": priority,
                "recurrence": recurrence,
                "due_date": due_date
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
    elif intent == "manage_timer":
        item = slots.get("item", "something")
        action_timer = slots.get("timer_action", "start")
        tool_res = await mcp.call_tool("manage_timer", {"task_id": item, "user_id": user_id, "action": action_timer})
        action = "timer"
        result = {"task": item, "timer_action": action_timer, "response": tool_res}
    elif intent == "greeting":
        # Respond to greetings by showing task list
        tool_res = await mcp.call_tool("list_todos", {"user_id": user_id})
        action = "greeting"
        result = {"response": tool_res}
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
        elif action == "timer":
            message = f"اوکے، '{result.get('task')}' کے لیے کلاک {result.get('timer_action') == 'start' and 'شروع' or 'بند'} ہو گیا ہے۔ ⏱️"
        elif action == "list":
            message = "Accessing the archives... یہ رہی آپ کی موجودہ لسٹ۔ 📋"
        elif action == "greeting":
            message = "السلام علیکم! میں آپ کی خدمت میں حاضر ہوں۔ یہ رہے آپ کے اہداف۔ 🫡"
        elif action == "clarify_add_task":
            message = "کون سا کام آپ شامل کرنا چاہتے ہیں؟ براہ کرم تفصیل بتائیں۔ 📝"
        else:
            message = "معذرت، میں سمجھ نہیں سکا۔ کیا آپ دوبارہ بتا سکتے ہیں؟ 🧠"
    else:
        if action == "create":
            message = f"Got it! I've added '{result.get('task')}' to your list. Mission started!"
        elif action == "update":
            message = f"Mission accomplished! '{result.get('task')}' is now marked as completed."
        elif action == "delete":
            message = f"Target eliminated! '{result.get('task')}' has been removed from your objectives."
        elif action == "timer":
            message = f"Mission clock {result.get('timer_action')}ed for '{result.get('task')}'."
        elif action == "list":
            message = "Accessing the archives... Here are your current objectives."
        elif action == "greeting":
            message = "Greetings, Commander! Ready to tackle your objectives. Here's your mission briefing."
        elif action == "clarify_add_task":
            message = "Roger that! What task would you like to add to your mission objectives? Please provide the details."
        else:
            message = "I'm not quite sure how to handle that objective. Could you rephrase it for AI Agentixz USA?"

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

@router.get("/tasks")
async def get_tasks(user_data: dict = Depends(verify_jwt)):
    """
    Get raw task list for UI rendering.
    """
    try:
        user_id = user_data["user_id"]
        from app.auth import supabase_admin
        response = supabase_admin.table("tasks").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tool")
async def call_tool_direct(request: Request, user_data: dict = Depends(verify_jwt)):
    """
    Directly call an MCP tool. Used for UI interactions (clicks) to ensure consistency.
    """
    body = await request.json()
    tool_name = body.get("name")
    arguments = body.get("arguments", {})
    
    # Force user_id for security
    # user_data is {"user_id": "uuid"} from verify_jwt
    arguments["user_id"] = user_data["user_id"]
    
    try:
        from app.mcp_server import mcp
        print(f"Direct Tool Call: {tool_name} with args {arguments}")
        result = await mcp.call_tool(tool_name, arguments)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(user_data: dict = Depends(verify_jwt)):
    user_id = user_data["user_id"]
    response = supabase.table("interactions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
    return response.data
