import os
import yaml
import json
from typing import Dict, Any, List, Optional
from pathlib import Path
from openai import OpenAI

class SkillManager:
    def __init__(self, skills_dir: str = "skills"):
        self.skills_dir = Path(skills_dir)
        self.skills: Dict[str, Any] = {}
        self.load_skills()
        
        self.clients: List[Dict[str, Any]] = []
        
        # Initialize providers in order of preference
        # 1. OpenAI (Primary)
        self._add_provider("OPENAI_API_KEY", "OPENAI_API_BASE", "gpt-4o-mini", "OpenAI")
        
        # 2. OpenRouter (Secondary)
        self._add_provider("OPENROUTER_API_KEY", None, "qwen/qwen-2.5-72b-instruct", "OpenRouter", "https://openrouter.ai/api/v1")
        
        # 3. Groq (Tertiary)
        self._add_provider("GROQ_API_KEY", None, "llama-3.1-70b-versatile", "Groq", "https://api.groq.com/openai/v1")
        
        # 4. Gemini (Quaternary)
        self._add_provider("GEMINI_API_KEY", None, "gemini-1.5-flash", "Gemini", "https://generativelanguage.googleapis.com/v1beta/openai")

        if not self.clients:
            print("⚠️ SkillManager: All LLM keys missing. Falling back to keyword logic.")
        else:
            print(f"🧠 SkillManager: World-Class Intelligence initialized with {len(self.clients)} brains.")

    def _add_provider(self, env_key: str, base_env_key: Optional[str], model: str, name: str, default_base: Optional[str] = None):
        key = os.getenv(env_key)
        base = os.getenv(base_env_key) if base_env_key else default_base
        if key:
            try:
                client = OpenAI(api_key=key, base_url=base)
                self.clients.append({"name": name, "client": client, "model": model})
                print(f"✅ Brain Linked: {name}")
            except Exception as e:
                print(f"⚠️ SkillManager: Failed to link {name}: {e}")

    def load_skills(self):
        if not self.skills_dir.exists():
            return

        for yaml_file in self.skills_dir.glob("*.yaml"):
            try:
                with open(yaml_file, "r", encoding="utf-8") as f:
                    skill_data = yaml.safe_load(f)
                    if skill_data and "name" in skill_data:
                        self.skills[skill_data["name"]] = skill_data
            except Exception as e:
                print(f"Error loading skill {yaml_file}: {e}")

    def get_skill(self, name: str) -> Optional[Dict[str, Any]]:
        return self.skills.get(name)

    def _get_llm_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Helper to get structured JSON from LLM with automatic fallback"""
        if not self.clients:
            return None
            
        for provider in self.clients:
            try:
                print(f"📡 Brain {provider['name']} attempting extraction...")
                response = provider['client'].chat.completions.create(
                    model=provider['model'],
                    messages=[
                        {"role": "system", "content": "You are a specialized AI Brain for a Todo Chatbot. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=10 # Prevent hanging
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"⚠️ SkillManager: Brain {provider['name']} failed: {e}. Falling back...")
                continue
        
        print("❌ SkillManager: All brains failed to respond.")
        return None

    def execute_skill(self, name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a skill based on its YAML definition and inputs.
        """
        skill = self.get_skill(name)
        if not skill:
            return {"error": f"Skill '{name}' not found"}

        utterance = inputs.get("utterance", "").strip()
        
        # --- WORLD-CLASS INTENT EXTRACTION ---
        if name == "intent_extractor":
            prompt = f"""
            Analyze the following user utterance and extract the intent and slots.
            Intents: add_task, list_tasks, complete_task, delete_task, manage_timer, greeting, clarify.
            
            - Use 'greeting' for: hi, hello, hey, greetings, what's up, etc.
            - Use 'list_tasks' for: show tasks, what are my tasks, list todos, etc.
            - Use 'add_task' for: add, create, new task, buy, remember to, etc.
            
            Slots for 'add_task': item (title of the task), priority (urgent, high, medium, low), recurrence (daily, weekly, monthly, none).
            Slots for 'complete_task': item (title or ID of the task).
            Slots for 'delete_task': item (title or ID of the task).
            Slots for 'manage_timer': item (title or ID of the task), timer_action (start, stop).

            Utterance: "{utterance}"

            Response Format:
            {{
                "intent": "intent_name",
                "slots": {{ ... }}
            }}
            """
            llm_res = self._get_llm_json(prompt)
            if llm_res:
                return llm_res

            # --- FALLBACK KEYWORD LOGIC ---
            u_low = utterance.lower().strip()
            
            # Handle greetings
            if any(k in u_low for k in ["hi", "hello", "hey", "greetings", "what's up", "whats up", "sup"]):
                return {"intent": "greeting", "slots": {}}
            
            priority = "medium"
            if "urgent" in u_low or "asap" in u_low: priority = "urgent"
            elif "high" in u_low or "important" in u_low: priority = "high"
            elif "low" in u_low: priority = "low"

            recurrence = "none"
            if "every day" in u_low or "daily" in u_low: recurrence = "daily"
            elif "every week" in u_low or "weekly" in u_low: recurrence = "weekly"
            elif "every month" in u_low or "monthly" in u_low: recurrence = "monthly"

            if any(k in u_low for k in ["buy", "add", "new", "create", "need", "remember"]):
                item = utterance
                
                # Check for standalone commands like "add task", "new task", "create task"
                standalone_commands = ["add task", "new task", "create task", "add a task", "create a task", "new todo", "add todo"]
                if u_low.strip() in standalone_commands:
                    return {
                        "intent": "add_task",
                        "slots": {
                            "item": "",  # Empty item signals missing details
                            "priority": priority,
                            "recurrence": recurrence
                        }
                    }
                
                # Extract task name by removing command keywords
                for k in ["add", "buy", "new", "create", "need", "remember"]:
                    if k in u_low:
                        # Split and get everything after the keyword
                        parts = u_low.split(k, 1)
                        if len(parts) > 1:
                            item = parts[1].strip()
                        break
                
                # Remove articles and task-related words
                for word in ["a task", "task", "a todo", "todo", "a new", "the"]:
                    item = item.replace(word, "").strip()
                
                # Remove priority and recurrence keywords
                for k in ["urgent", "high", "low", "daily", "weekly", "monthly", "every day", "every week"]:
                    item = item.replace(k, "").strip()
                
                # If item is empty or too generic after cleaning, mark as incomplete
                if not item or item in ["task", "todo", "something", "it"]:
                    item = ""
                
                return {
                    "intent": "add_task", 
                    "slots": {
                        "item": item.capitalize() if item else "",
                        "priority": priority,
                        "recurrence": recurrence
                    }
                }
            elif any(k in u_low for k in ["list", "show", "what", "todos", "tasks"]):
                return {"intent": "list_tasks", "slots": {}}
            elif any(k in u_low for k in ["done", "finish", "complete", "check", "solved"]):
                item = u_low
                for k in ["done", "finish", "complete", "check", "solved"]:
                    if k in u_low:
                        item = u_low.split(k)[-1].strip()
                        break
                return {"intent": "complete_task", "slots": {"item": item}}
            return {"intent": "clarify", "slots": {}}

        # --- WORLD-CLASS URDU TRANSLATION ---
        if name == "translator_urdu":
            # Detect Urdu using unicode range
            is_urdu = any("\u0600" <= char <= "\u06FF" for char in utterance)
            
            if is_urdu:
                prompt = f"""
                Translate the following Urdu utterance into English for a task management system.
                Also detect the language correctly.
                
                Utterance: "{utterance}"
                
                Response Format:
                {{
                    "utterance_en": "English Translation",
                    "detected_lang": "ur",
                    "confidence": 1.0
                }}
                """
                llm_res = self._get_llm_json(prompt)
                if llm_res:
                    return llm_res

            if is_urdu:
                return {"utterance_en": "translated utterance", "detected_lang": "ur", "confidence": 0.50}
            return {"utterance_en": utterance, "detected_lang": "en", "confidence": 1.0}

        if name == "todo_orchestrator":
            intent = inputs.get("intent")
            slots = inputs.get("slots", {})
            if intent == "add_task":
                return {"action": "create", "payload": {"task": slots.get("item"), "status": "pending"}}
            elif intent == "list_tasks":
                return {"action": "list", "payload": {"items": ["Buy groceries", "Call mom", "Finish Phase III"]}}
            elif intent == "complete_task":
                return {"action": "update", "payload": {"task": slots.get("item"), "status": "completed"}}
            return {"action": "clarify", "payload": {}}

        return {"status": "unimplemented", "skill": name}

skill_manager = SkillManager()
