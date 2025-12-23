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
        
        # Initialize OpenAI client if key is present
        api_key = os.getenv("OPENAI_API_KEY")
        api_base = os.getenv("OPENAI_API_BASE") # Support for OpenRouter/Gemini Proxy
        
        if api_key:
            try:
                self.client = OpenAI(api_key=api_key, base_url=api_base)
                print("🧠 SkillManager: World-Class Intelligence initialized (LLM ON)")
            except Exception as e:
                print(f"⚠️ SkillManager: Failed to initialize LLM client: {e}")
                self.client = None
        else:
            print("⚠️ SkillManager: OPENAI_API_KEY missing. Falling back to keyword logic.")
            self.client = None

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
        """Helper to get structured JSON from LLM"""
        if not self.client:
            return None
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a specialized AI Brain for a Todo Chatbot. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"❌ SkillManager: LLM Error: {e}")
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
            if self.client:
                prompt = f"""
                Analyze the following user utterance and extract the intent and slots.
                Intents: add_task, list_tasks, complete_task, delete_task, clarify.
                Slots for 'add_task': item (title of the task), priority (urgent, high, medium, low), recurrence (daily, weekly, monthly, none).
                Slots for 'complete_task': item (title or ID of the task).
                Slots for 'delete_task': item (title or ID of the task).

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
            u_low = utterance.lower()
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
                for k in ["add", "buy", "new", "create", "need", "remember"]:
                    if k in u_low:
                        item = u_low.split(k)[-1].strip()
                        break
                for k in ["urgent", "high", "low", "daily", "weekly", "monthly", "every day", "every week"]:
                    item = item.replace(k, "").strip()
                
                return {
                    "intent": "add_task", 
                    "slots": {
                        "item": item.capitalize(),
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
            
            if is_urdu and self.client:
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
