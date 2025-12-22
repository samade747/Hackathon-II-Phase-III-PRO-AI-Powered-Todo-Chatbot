from mcp.server.fastmcp import FastMCP
from app.auth import supabase
import logging

# Initialize FastMCP server
mcp = FastMCP("TodoAgent")

@mcp.tool()
async def add_todo(title: str, user_id: str, status: str = "pending") -> str:
    """
    Add a new todo task for the specified user.
    """
    try:
        response = supabase.table("tasks").insert({
            "title": title,
            "user_id": user_id,
            "status": status
        }).execute()
        return f"Task '{title}' created successfully."
    except Exception as e:
        return f"Error creating task: {str(e)}"

@mcp.tool()
async def list_todos(user_id: str) -> str:
    """
    Retrieve a list of all todo tasks for the specified user.
    """
    try:
        response = supabase.table("tasks").select("*").eq("user_id", user_id).execute()
        tasks = response.data
        if not tasks:
            return "No tasks found."
        
        task_list = "\n".join([f"- [{t['status']}] {t['title']} (ID: {t['id']})" for t in tasks])
        return f"Current Objectives:\n{task_list}"
    except Exception as e:
        return f"Error listing tasks: {str(e)}"

@mcp.tool()
async def complete_todo(task_id: str, user_id: str) -> str:
    """
    Mark a specific todo task as completed.
    """
    try:
        response = supabase.table("tasks").update({"status": "completed"}).eq("id", task_id).eq("user_id", user_id).execute()
        if response.data:
            return f"Task {task_id} marked as completed."
        return f"Task {task_id} not found."
    except Exception as e:
        return f"Error completing task: {str(e)}"

@mcp.tool()
async def delete_todo(task_id: str, user_id: str) -> str:
    """
    Delete a specific todo task.
    """
    try:
        response = supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
        return f"Task {task_id} deleted successfully."
    except Exception as e:
        return f"Error deleting task: {str(e)}"
