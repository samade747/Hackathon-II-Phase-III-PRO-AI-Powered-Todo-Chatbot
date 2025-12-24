import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.api.skills import skill_manager

def test(utterance):
    print(f"\nTesting: '{utterance}'")
    try:
        res = skill_manager.execute_skill("intent_extractor", {"utterance": utterance})
        print(f"Result: {res}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Initializing SkillManager...")
    # Test cases
    test("hi")
    test("add task buy oil")
    test("add buy groceries")
