from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database.session import get_db
from app.models.user import User
from app.core import security
from app.core.security import SECRET_KEY, ALGORITHM
from pydantic import BaseModel

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Função para proteger as rotas
async def get_current_user_email(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Sessão expirada")

@router.post("/register")
async def register(data: UserCreate, db: Session = Depends(get_db)):
    user_exists = db.query(User).filter(User.email == data.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    
    new_user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=security.hash_password(data.password)
    )
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado com sucesso!"}

@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not security.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    token = security.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}