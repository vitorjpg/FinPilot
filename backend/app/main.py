from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# 1. Carrega as variáveis do .env primeiro de tudo
load_dotenv()

# 2. Importa as configurações do banco e modelos
from app.database.session import engine, Base
from app.models import user, transaction, goal  # Importamos todos para o banco criar as tabelas

# 3. Importa as rotas (routers)
from app.api.v1 import auth, finance, chat, goals

# 4. Cria as tabelas no banco de dados automaticamente se não existirem
Base.metadata.create_all(bind=engine)

# 5. Inicializa o FastAPI
app = FastAPI(title="FinPilot API - Gestão Financeira com IA")

# 6. CONFIGURAÇÃO DO CORS
# Isso permite que o seu Frontend (Vite/React) converse com o Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, mude para o link do seu site
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 7. Registra as rotas no sistema
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(finance.router, prefix="/finance", tags=["Finanças"])
app.include_router(chat.router, prefix="/chat", tags=["IA Chat"])
app.include_router(goals.router, prefix="/goals", tags=["Metas"])

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "message": "FinPilot API está rodando perfeitamente!",
        "version": "1.0.0"
    }