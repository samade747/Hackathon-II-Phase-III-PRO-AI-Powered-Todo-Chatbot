title: "Reusable Intelligence: Subagents & Skills"
id: reusable-intelligence
status: draft
phase: III

# Constitution
Create a set of reusable subagents and skills for intent extraction, slot-filling, i18n, and action mapping. These must be versioned and stored under skills/ with prompt history under history/prompts/.

# Specification
## Skills
- intent_extractor: maps natural language to {intent, slots}
- todo_manager: maps {intent, slots} to backend API calls
- translator: detects Urdu and translates to canonical intent or English

## Acceptance Criteria
- Skills are defined as YAML manifests
- Claude Code generates sample prompts and prompt history

## Test Cases
- Urdu to intent translation
- Intent extractor correctness on sample utterances
