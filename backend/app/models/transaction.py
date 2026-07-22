from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False) # Ex: "Almoço", "Salário"
    amount = Column(Float, nullable=False)      # Ex: 50.50
    type = Column(String, nullable=False)        # "receita" ou "despesa"
    category = Column(String, default="Outros")  # "Alimentação", "Lazer", etc.
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Liga a transação ao usuário que está logado
    user_id = Column(Integer, ForeignKey("users.id"))