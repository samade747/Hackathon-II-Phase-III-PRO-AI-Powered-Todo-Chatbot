import pytest
import httpx
import os
from jose import jwt
from httpx import ASGITransport
from app.main import app
from httpx import ASGITransport

# We'll use a factory function or directly use httpx in tests
# Since TestClient(app) is failing with TypeError in this environment

SECRET = os.getenv("BETTER_AUTH_SECRET", "default-secret-change-me")

def create_token(user_id: str):
    return jwt.encode({"sub": user_id}, SECRET, algorithm="HS256")

@pytest.mark.asyncio
async def test_root():
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI-Powered Todo Chatbot API is running"}

@pytest.mark.asyncio
async def test_agent_dispatch_unauthorized():
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/agent/dispatch", json={"utterance": "hello"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_agent_dispatch_authorized():
    token = create_token("user123")
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/agent/dispatch",
            json={"utterance": "buy milk"},
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    assert "milk" in response.json()["message"].lower()

@pytest.mark.asyncio
async def test_agent_dispatch_urdu_authorized():
    token = create_token("user123")
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/agent/dispatch",
            json={"utterance": "دودھ خریدنا ہے"},
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    assert response.json()["action"] in ["create", "clarify"]
