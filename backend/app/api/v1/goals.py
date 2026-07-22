from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.goal import Goal
from app.models.user import User
from app.api.v1.auth import get_current_user_email
from pydantic import BaseModel
class GoalUpdate(BaseModel):
    amount_to_add: float

router = APIRouter()

class GoalCreate(BaseModel):
    description: str
    target_amount: float
    current_amount: float = 0.0

@router.post("/add")
async def add_goal(data: GoalCreate, db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    new_goal = Goal(**data.dict(), user_id=user.id)
    db.add(new_goal)
    db.commit()
    return {"message": "Meta criada!"}

@router.get("/all")
async def list_goals(db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    return db.query(Goal).filter(Goal.user_id == user.id).all()

@router.delete("/delete/{goal_id}")
async def delete_goal(goal_id: int, db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal: raise HTTPException(status_code=404, detail="Meta não encontrada")
    db.delete(goal)
    db.commit()
    return {"message": "Meta removida"}
@router.patch("/update/{goal_id}")
async def update_goal_amount(goal_id: int, data: GoalUpdate, db: Session = Depends(get_db), email: str = Depends(get_current_user_email)):
    user = db.query(User).filter(User.email == email).first()
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    
    # Soma o valor novo ao que já tem
    goal.current_amount += data.amount_to_add
    db.commit()
    db.refresh(goal)
    return {"message": "Valor atualizado!", "current_amount": goal.current_amount}