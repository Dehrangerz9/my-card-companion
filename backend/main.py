from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from chatbot import CardVaultChatbot

app = FastAPI(title="CardVault Chatbot API")

# Allow the Vite dev server (port 5173) and any local origin to reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate and train (or load) the chatbot once at startup
chatbot = CardVaultChatbot()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    tag: str
    confidence: float
    action: str | None = None
    action_data: dict[str, Any] = {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    result = chatbot.respond(req.message)
    return ChatResponse(**result)


@app.post("/retrain")
def retrain():
    """Force a full retrain from training_data.json and save a new model."""
    chatbot.retrain()
    return {"status": "ok", "message": "Modelo retreinado com sucesso."}
