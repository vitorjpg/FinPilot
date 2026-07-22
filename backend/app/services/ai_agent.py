import os
from langchain_groq import ChatGroq
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.tools.db_queries import get_expense_summary, get_detailed_transactions, get_goals_summary

class FinPilotAgent:
    def __init__(self):
        # Usando o modelo Llama 3.3 70B para análise de alto nível
        self.llm = ChatGroq(
            temperature=0.2,
            model_name="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY")
        )

        # Registrando as 3 ferramentas
        self.tools = [get_expense_summary, get_detailed_transactions, get_goals_summary]
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """Você é o FinPilot, o analista financeiro pessoal de {user_email}.
            
            SUAS FERRAMENTAS:
            1. 'get_expense_summary': Totais de gastos por categoria.
            2. 'get_detailed_transactions': Detalhes/nomes de cada gasto.
            3. 'get_goals_summary': Progresso das metas financeiras (sonhos).
            
            REGRAS:
            - Se o usuário perguntar sobre metas ou progresso, use 'get_goals_summary'.
            - Se houver dinheiro sobrando no saldo, sugira quanto falta para bater a meta.
            - NUNCA invente dados. Seja motivador e analítico.
            
            Email do usuário atual: {user_email}"""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.executor = AgentExecutor(
            agent=agent, 
            tools=self.tools, 
            verbose=True, 
            handle_parsing_errors=True
        )

    async def chat(self, user_input: str, user_email: str, history: list = []):
        formatted_history = []
        for msg in history:
            role = msg.get('role')
            content = msg.get('content')
            if role == 'user':
                formatted_history.append(HumanMessage(content=content))
            else:
                formatted_history.append(AIMessage(content=content))

        try:
            response = await self.executor.ainvoke({
                "input": user_input,
                "user_email": user_email,
                "chat_history": formatted_history
            })
            return response["output"]
        except Exception as e:
            print(f"Erro no Agente: {e}")
            return "Tive um problema ao processar sua análise. Pode repetir a pergunta?"