import os
import yaml
from typing import Dict, Any, List, Optional
from pathlib import Path

class SkillManager:
    def __init__(self, skills_dir: str = "skills"):
        self.skills_dir = Path(skills_dir)
        self.skills: Dict[str, Any] = {}
        self.load_skills()

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

    def execute_skill(self, name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a skill based on its YAML definition and inputs.
        """
        skill = self.get_skill(name)
        if not skill:
            return {"error": f"Skill '{name}' not found"}

        utterance = inputs.get("utterance", "").strip()
        
        # Enhanced simulation using YAML structure
        if name == "intent_extractor":
            u_low = utterance.lower()
            
            # Detect Priority
            priority = "medium"
            if "urgent" in u_low or "asap" in u_low: priority = "urgent"
            elif "high" in u_low or "important" in u_low: priority = "high"
            elif "low" in u_low: priority = "low"

            # Detect Recurrence
            recurrence = "none"
            if "every day" in u_low or "daily" in u_low: recurrence = "daily"
            elif "every week" in u_low or "weekly" in u_low: recurrence = "weekly"
            elif "every month" in u_low or "monthly" in u_low: recurrence = "monthly"

            if any(k in u_low for k in ["buy", "add", "new", "create", "need", "remember"]):
                # Simple extraction: take everything after the first trigger word
                item = utterance
                for k in ["add", "buy", "new", "create", "need", "remember"]:
                    if k in u_low:
                        item = u_low.split(k)[-1].strip()
                        break
                # Clean up priority/recurrence words from the item title
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

        if name == "translator_urdu":
            # Detect Urdu using unicode range
            is_urdu = any("\u0600" <= char <= "\u06FF" for char in utterance)
            if is_urdu:
                return {"utterance_en": "translated utterance", "detected_lang": "ur", "confidence": 0.98}
            return {"utterance_en": utterance, "detected_lang": "en", "confidence": 1.0}

        if name == "todo_orchestrator":
            intent = inputs.get("intent")
            slots = inputs.get("slots", {})
            if intent == "add_task":
                return {"action": "create", "payload": {"task": slots.get("item"), "status": "pending"}}
            elif intent == "list_tasks":
                # Simulated database fetch
                return {"action": "list", "payload": {"items": ["Buy groceries", "Call mom", "Finish Phase III"]}}
            elif intent == "complete_task":
                return {"action": "update", "payload": {"task": slots.get("item"), "status": "completed"}}
            return {"action": "clarify", "payload": {}}

        return {"status": "unimplemented", "skill": name}

skill_manager = SkillManager()
