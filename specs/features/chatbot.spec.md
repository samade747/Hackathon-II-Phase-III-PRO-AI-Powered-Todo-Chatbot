title: "AI Todo Chatbot"
id: chatbot
status: draft
phase: III

# Constitution
An AI-powered chatbot that can manage a user's tasks via natural language, support Urdu and voice commands. The chatbot is integrated into the Next.js frontend and will call backend agent endpoints (with JWT) to perform actions.

# Specification
## Summary
Implement a conversational UI in the frontend and an agent orchestration layer in the backend.

## Acceptance Criteria
- User can open chat UI and say: "Add task: buy milk tomorrow 9am" and the task is created under their account.
- User can ask in Urdu: "میری صبح کی میٹنگ کو 2 بجے کریں" and the bot translates/handles the intent.
- Voice commands via Web Speech API are supported.
- Agent actions require JWT token; backend verifies user.

## API / Data Model
- Endpoint: POST /api/agent/dispatch
  - Request: { user_id, utterance, lang?, voice?: boolean }
  - Response: { action: "create|update|delete|list", result: {...} }

## Agent Behavior
- Use skills: intent-extraction, todo-management, i18n-translator
- Use subagent: specify-subagent & implement-subagent for reusable routines

## UI Flows
- User clicks Chat icon -> Chat drawer appears
- User speaks or types -> message sent to /api/agent/dispatch
- Show messages and action results; link to task detail

## Edge Cases
- Ambiguous utterances -> ask clarifying question
- Multi-intent utterance -> ask confirm

## Test Cases
- Create via text
- Create via voice
- Urdu utterance processed
- JWT missing -> 401
