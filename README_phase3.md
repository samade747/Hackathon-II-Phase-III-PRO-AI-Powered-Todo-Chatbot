# Hackathon II — Phase III (PRO): AI-Powered Todo Chatbot

## Quick start
1. Unzip this archive into your repo root.
2. Use Git Bash / WSL or PowerShell to run the sp.* scripts.

## Recommended (Windows PowerShell)
# Create folders (if not present):
New-Item -ItemType Directory -Force -Path .spec-kit, specs, specs/features, specs/api, specs/ui, skills, history, history/prompts, frontend, backend

## Using Claude Code CLI
- Make scripts executable (Git Bash): chmod +x sp.*
- Run pipeline:
  ./sp.clarify specs/features/chatbot.spec.md
  ./sp.plan specs/features/chatbot.spec.md > specs/features/chatbot.plan.md
  ./sp.tasks specs/features/chatbot.plan.md > specs/features/chatbot.tasks.md
  ./sp.implement specs/features/chatbot.spec.md

If you don't have claude-code CLI, open CLAUDE_PROMPT_IMPLEMENT_PHASE3.txt and paste it into the Claude web UI.
