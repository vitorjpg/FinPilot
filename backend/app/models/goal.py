from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database.session import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False) # Ex: "Viagem Japão"
    target_amount = Column(Float, nullable=False) # Quanto quer juntar (5000)
    current_amount = Column(Float, default=0.0)   # Quanto já tem (500)
    user_id = Column(Integer, ForeignKey("users.id"))