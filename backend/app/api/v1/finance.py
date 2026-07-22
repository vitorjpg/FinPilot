from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.api.v1.auth import get_current_user_email
from pydantic import BaseModel
from typing import List

router = APIRouter()

class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str # 'receita' ou 'despesa'
    category: str

@router.post("/add")
async def add_transaction(data: TransactionCreate, db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    new_trans = Transaction(
        description=data.description,
        amount=data.amount,
        type=data.type,
        category=data.category,
        user_id=user.id
    )
    db.add(new_trans)
    db.commit()
    return {"message": "Salvo com sucesso!"}

# 1. ROTA PARA BUSCAR O SALDO GERAL (Resumo de Cards)
@router.get("/balance")
async def get_balance(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    
    receitas = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user.id, Transaction.type == 'receita').scalar() or 0
    despesas = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user.id, Transaction.type == 'despesa').scalar() or 0
    
    return {
        "total_receita": receitas,
        "total_despesa": despesas,
        "saldo": receitas - despesas
    }

# 2. ROTA PARA LISTAR TRANSAÇÕES (Para a tabela do Front)
@router.get("/all")
async def list_transactions(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    transactions = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).all()
    return transactions

# 3. ROTA PARA EXCLUIR
@router.delete("/delete/{trans_id}")
async def delete_transaction(trans_id: int, db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    trans = db.query(Transaction).filter(Transaction.id == trans_id, Transaction.user_id == user.id).first()
    
    if not trans:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    db.delete(trans)
    db.commit()
    return {"message": "Excluído com sucesso"}

@router.get("/summary-data")
async def get_summary_data(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    results = db.query(Transaction.category, func.sum(Transaction.amount).label('value')).filter(Transaction.type == 'despesa', Transaction.user_id == user.id).group_by(Transaction.category).all()
    return [{"name": cat, "value": val} for cat, val in results]