#!/usr/bin/env python3
"""
Quick fix script to prioritize simple greeting detection before LLM calls.
This ensures "hi", "hello", etc. are handled by fast keyword matching instead of slow/unreliable LLM.
"""

import re

# Read the file
with open(r"d:\github\Hackathon-II-Phase-III-PRO-AI-Powered-Todo-Chatbot\backend\app\api\skills.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find the intent_extractor section and add early greeting check
# We need to add the check BEFORE the LLM call

old_code = '''        # --- WORLD-CLASS INTENT EXTRACTION ---
        if name == "intent_extractor":
            prompt = f"""
            Analyze the following user utterance and extract the intent and slots.'''

new_code = '''        # --- WORLD-CLASS INTENT EXTRACTION ---
        if name == "intent_extractor":
            # Quick check for simple greetings BEFORE calling expensive LLM
            u_low = utterance.lower().strip()
            simple_greetings = ["hi", "hello", "hey", "hola", "howdy", "sup", "yo"]
            if u_low in simple_greetings or any(u_low.startswith(g + " ") or u_low.endswith(" " + g) for g in simple_greetings):
                print(f"✅ Quick greeting detected: '{utterance}'")
                return {"intent": "greeting", "slots": {}}
            
            prompt = f"""
            Analyze the following user utterance and extract the intent and slots.'''

# Replace
if old_code in content:
    content = content.replace(old_code, new_code)
    
    # Write back
    with open(r"d:\github\Hackathon-II-Phase-III-PRO-AI-Powered-Todo-Chatbot\backend\app\api\skills.py", "w", encoding="utf-8") as f:
        f.write(content)
    
    print("✅ Added quick greeting check before LLM call!")
    print("Now 'hi', 'hello', 'hey' etc. will be detected instantly without calling LLM")
else:
    print("❌ Could not find the target code section")
    print("The file might have been modified already")
