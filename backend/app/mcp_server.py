from datetime import datetime
from mcp.server.fastmcp import FastMCP
from app.auth import supabase_admin as supabase
import logging

# Initialize FastMCP server
mcp = FastMCP("TodoAgent")

@mcp.tool()
async def add_todo(
    title: str, 
    user_id: str, 
    priority: str = "medium", 
    recurrence: str = "none", 
    due_date: str | None = None,
    tags: list | None = None
) -> str:
    """
    Add a new todo task.
    """
    try:
        data = {
            "title": title,
            "user_id": user_id,
            "priority": priority,
            "recurrence": recurrence,
            "tags": tags or []
        }
        if due_date:
            data["due_date"] = due_date
            
        supabase.table("tasks").insert(data).execute()
        
        msg = f"Objective '{title}' deployed."
        if due_date:
            msg += f" Due at: {due_date}"
        return msg
    except Exception as e:
        return f"Deployment error: {str(e)}"

@mcp.tool()
async def add_todos_bulk(
    titles: list, 
    user_id: str, 
    priority: str = "medium", 
    recurrence: str = "none"
) -> str:
    """
    Add multiple todo tasks at once.
    """
    try:
        data = [{
            "title": t.strip(),
            "user_id": user_id,
            "priority": priority,
            "recurrence": recurrence
        } for t in titles if t.strip()]
        
        if not data:
            return "No objectives found in the list."
            
        supabase.table("tasks").insert(data).execute()
        return f"Bulk Deployment Complete: {len(data)} objectives synchronized."
    except Exception as e:
        return f"Bulk deployment error: {str(e)}"

@mcp.tool()
async def list_todos(user_id: str) -> str:
    """
    Retrieve a list of all todo tasks for the specified user.
    """
    try:
        response = supabase.table("tasks").select("*").eq("user_id", user_id).execute()
        tasks = response.data
        if not tasks:
            return "No current objectives in the archives."
        
        task_list = "\n".join([f"- [{t['status'].upper()}] {t['title']} (Priority: {t['priority']}, Recurrence: {t['recurrence']})" for t in tasks])
        return f"Current Objectives:\n{task_list}"
    except Exception as e:
        return f"Error listing tasks: {str(e)}"

@mcp.tool()
async def toggle_todo(task_id: str, user_id: str) -> str:
    """
    Toggle a task between pending and completed. Triggers Mission Respawn if completed.
    """
    try:
        task_res = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        if not task_res.data:
            return "Task not found."
        
        task = task_res.data[0]
        new_status = "completed" if task["status"] == "pending" else "pending"
        
        # 2. Update status
        now = datetime.now().isoformat()
        updates = {"status": new_status}
        if new_status == "completed":
            updates["last_completed_at"] = now
        
        supabase.table("tasks").update(updates).eq("id", task_id).execute()
        
        # 3. Mission Respawn
        if new_status == "completed" and task.get("recurrence") and task["recurrence"] != "none":
            from datetime import timedelta
            next_due = datetime.now()
            if task["recurrence"] == "daily": next_due += timedelta(days=1)
            elif task["recurrence"] == "weekly": next_due += timedelta(weeks=1)
            elif task["recurrence"] == "monthly": next_due = next_due.replace(month=next_due.month % 12 + 1)
            
            supabase.table("tasks").insert({
                "title": task["title"],
                "user_id": user_id,
                "priority": task["priority"],
                "recurrence": task["recurrence"],
                "due_date": next_due.isoformat(),
                "status": "pending"
            }).execute()
            return f"Status: {new_status}. Mission Respawned!"

        return f"Status: {new_status}. Objective updated."
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
async def complete_todo(task_id: str, user_id: str) -> str:
    """
    Mark a specific todo task as completed. Supports 'Mission Respawn' for recurring tasks.
    """
    try:
        # 1. Fetch the task to check for recurrence
        task_res = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        if not task_res.data:
            return f"Objective {task_id} not found in the archives."
        
        task = task_res.data[0]
        
        # 2. Mark current task as completed
        now = datetime.now().isoformat()
        supabase.table("tasks").update({
            "status": "completed",
            "last_completed_at": now
        }).eq("id", task_id).execute()
        
        # 3. Mission Respawn (Recurrence Logic)
        if task.get("recurrence") and task["recurrence"] != "none":
            from datetime import timedelta
            
            # Calculate next due date
            next_due = datetime.now()
            if task["recurrence"] == "daily":
                next_due += timedelta(days=1)
            elif task["recurrence"] == "weekly":
                next_due += timedelta(weeks=1)
            elif task["recurrence"] == "monthly":
                # Simple month jump
                next_due = next_due.replace(month=next_due.month % 12 + 1)
            
            supabase.table("tasks").insert({
                "title": task["title"],
                "user_id": user_id,
                "priority": task["priority"],
                "recurrence": task["recurrence"],
                "due_date": next_due.isoformat(),
                "tags": task.get("tags", []),
                "status": "pending"
            }).execute()
            return f"Mission Accomplished! '{task['title']}' completed. A new instance has been respawned for {next_due.strftime('%Y-%m-%d')}."

        return f"Mission Accomplished! Objective '{task['title']}' is marked as completed."
    except Exception as e:
        return f"Tactical Error during completion: {str(e)}"

@mcp.tool()
async def delete_todo(task_id: str, user_id: str) -> str:
    """
    Delete a specific todo task from the archives.
    """
    try:
        response = supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
        return f"Objective {task_id} eliminated from the archives."
    except Exception as e:
        return f"Error during elimination: {str(e)}"

@mcp.tool()
async def manage_timer(task_id: str, user_id: str, action: str) -> str:
    """
    Manage the mission clock for a task. Actions: 'start', 'stop'.
    """
    try:
        task_res = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        if not task_res.data:
            return "Task not found."
        
        task = task_res.data[0]
        now = datetime.now()
        
        if action == "start":
            supabase.table("tasks").update({"timer_started_at": now.isoformat()}).eq("id", task_id).execute()
            return f"Mission clock started for '{task['title']}'. ⏱️"
        
        elif action == "stop":
            if not task.get("timer_started_at"):
                return "Mission clock was not running."
            
            start_time = datetime.fromisoformat(task["timer_started_at"].replace('Z', '+00:00'))
            # Calculate elapsed time in seconds
            elapsed = int((now.astimezone() - start_time.astimezone()).total_seconds())
            new_total = (task.get("total_time_spent") or 0) + elapsed
            
            supabase.table("tasks").update({
                "total_time_spent": new_total,
                "timer_started_at": None
            }).eq("id", task_id).execute()
            
            return f"Mission clock stopped for '{task['title']}'. Total mission time: {new_total} seconds. 📊"
            
        return "Invalid timer action. Use 'start' or 'stop'."
    except Exception as e:
        return f"Timer Logic Error: {str(e)}"

if __name__ == "__main__":
    mcp.run()
