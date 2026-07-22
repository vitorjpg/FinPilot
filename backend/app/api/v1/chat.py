from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_agent import FinPilotAgent
from app.api.v1.auth import get_current_user_email

router = APIRouter()
agent = FinPilotAgent()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

@router.post("/send")
async def send_message(data: ChatRequest, email: str = Depends(get_current_user_email)):
    # Transformamos os objetos do Pydantic em dicionários simples
    history_dict = [m.model_dump() for m in data.history]
    
    response = await agent.chat(data.message, email, history_dict)
    return {"response": response}