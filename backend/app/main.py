from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import agent

app = FastAPI(title="AI-Powered Todo Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AI-Powered Todo Chatbot API is running"}

@app.get("/test-direct")
async def test_direct():
    return {"message": "Direct endpoint works!", "routes_count": len(app.routes)}

@app.on_event("startup")
async def startup_event():
    print("API Routes:")
    for route in app.routes:
        print(f"   {route.path} [{route.methods}]")
