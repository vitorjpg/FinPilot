from langchain_core.tools import tool
from app.database.session import SessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from sqlalchemy import func

@tool
def get_expense_summary(user_email: str):
    """
    Retorna o resumo de gastos totais por categoria para o usuário logado.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return "Erro: Usuário não encontrado."

        results = db.query(
            Transaction.category, 
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.type == 'despesa',
            Transaction.user_id == user.id
        ).group_by(Transaction.category).all()
        
        if not results:
            return "Nenhum gasto encontrado no banco de dados."
            
        summary = "RESUMO DE GASTOS POR CATEGORIA:\n"
        for cat, total in results:
            summary += f"- {cat}: R$ {total:.2f}\n"
        return summary
    finally:
        db.close()

@tool
def get_detailed_transactions(user_email: str, category: str = None):
    """
    Retorna os detalhes (descrição e valor) de cada gasto do usuário.
    Pode filtrar por uma categoria específica se fornecida.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return "Erro: Usuário não encontrado."

        query = db.query(Transaction).filter(Transaction.user_id == user.id, Transaction.type == 'despesa')
        
        if category:
            query = query.filter(Transaction.category.ilike(category))
            
        results = query.all()
        
        if not results:
            return f"Nenhuma transação detalhada encontrada."
            
        details = "DETALHES DOS GASTOS:\n"
        for t in results:
            details += f"- {t.description}: R$ {t.amount:.2f} ({t.category})\n"
        return details
    finally:
        db.close()

@tool
def get_goals_summary(user_email: str):
    """
    Retorna o progresso de todas as metas financeiras do usuário logado.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return "Usuário não encontrado."

        from app.models.goal import Goal # Import local para evitar conflito circular
        goals = db.query(Goal).filter(Goal.user_id == user.id).all()
        
        if not goals:
            return "O usuário ainda não possui metas cadastradas."
            
        summary = "PROGRESSO DAS METAS:\n"
        for g in goals:
            percent = (g.current_amount / g.target_amount) * 100
            summary += f"- {g.description}: R$ {g.current_amount:.2f} de R$ {g.target_amount:.2f} ({percent:.1f}% concluído)\n"
        return summary
    finally:
        db.close()