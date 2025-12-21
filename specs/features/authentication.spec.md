title: "Authentication (Better Auth + JWT)"
id: authentication
status: draft
phase: II-III

# Constitution
Use Better Auth on frontend; enable JWT signing with shared secret. Backend (FastAPI) must verify JWT tokens on every protected endpoint.

# Specification
## Summary
Implement signup/signin flows with Better Auth. Configure JWT issuance on login. Backend will verify JWT using BETTER_AUTH_SECRET.

## Acceptance Criteria
- Frontend uses Better Auth for login; receives JWT
- Frontend attaches JWT to Authorization header for API calls
- Backend rejects requests without valid token
- User isolation enforced on CRUD endpoints

## Test Cases
- Sign up, receive token, call GET /api/{user_id}/tasks -> returns only user's tasks
- Missing token -> 401
