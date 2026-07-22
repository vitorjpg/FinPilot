import React, { useState, useEffect } from 'react';
import { Send, Bot, LayoutDashboard, MessageSquare, LogOut, User, Lock, Mail, PlusCircle, DollarSign, Trash2, TrendingUp, TrendingDown, Wallet, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de Dados
  const [balance, setBalance] = useState({ total_receita: 0, total_despesa: 0, saldo: 0 });
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  // Login/Formulários
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Novo Gasto
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salário');
  const [type, setType] = useState('receita');

  // Nova Meta
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  // Chat
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Olá! Sou o FinPilot. Vamos organizar suas finanças e metas hoje?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Sincronização de Dados
  const fetchData = async () => {
    if (!token) return;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const [resBal, resTrans, resChart, resGoals] = await Promise.all([
        axios.get(`${API_URL}/finance/balance`, config),
        axios.get(`${API_URL}/finance/all`, config),
        axios.get(`${API_URL}/finance/summary-data`, config),
        axios.get(`${API_URL}/goals/all`, config)
      ]);
      setBalance(resBal.data);
      setTransactions(resTrans.data);
      setChartData(resChart.data);
      setGoals(resGoals.data);
    } catch (err) { 
        if (err.response?.status === 401) handleLogout(); 
    }
  };

  useEffect(() => { fetchData(); }, [token, activeTab]);

  // Ações de Autenticação
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) { alert('E-mail ou senha inválidos.'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { full_name: fullName, email, password });
      alert('Conta criada!'); setIsRegistering(false);
    } catch (err) { alert('Erro ao cadastrar.'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); };

  // Ações de Finanças
  const handleAddFinance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/finance/add`, 
        { description: desc, amount: parseFloat(amount), type, category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDesc(''); setAmount(''); fetchData();
      alert('Lançamento realizado!');
    } catch (err) { alert('Erro ao lançar.'); }
  };

  const deleteTrans = async (id) => {
    if (!window.confirm("Excluir transação?")) return;
    try {
      await axios.delete(`${API_URL}/finance/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Erro ao excluir.'); }
  };

  // NOVO: Ações de Metas (Incluindo Update/Aporte)
  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/goals/add`, 
        { description: goalDesc, target_amount: parseFloat(goalTarget), current_amount: parseFloat(goalCurrent || 0) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoalDesc(''); setGoalTarget(''); setGoalCurrent('');
      fetchData();
    } catch (err) { alert('Erro ao criar meta.'); }
  };

  const handleUpdateGoal = async (id, amountToAdd) => {
    if (!amountToAdd || amountToAdd <= 0) return;
    try {
      await axios.patch(`${API_URL}/goals/update/${id}`, 
        { amount_to_add: parseFloat(amountToAdd) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) { alert('Erro ao atualizar valor da meta.'); }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("Remover esta meta?")) return;
    try {
      await axios.delete(`${API_URL}/goals/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Erro ao excluir.'); }
  };

  // Ações de Chat
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/chat/send`, 
        { message: input, history: messages.map(m => ({ role: m.role, content: m.content })).slice(-5) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão com a IA.' }]); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3F5F9] font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg">FP</div>
            <h2 className="text-3xl font-black">{isRegistering ? 'Criar Conta' : 'FinPilot'}</h2>
            <p className="text-gray-400 text-sm font-medium mt-1">Seu analista financeiro com IA</p>
          </div>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && <input type="text" placeholder="Nome Completo" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all" value={fullName} onChange={(e) => setFullName(e.target.value)} required/>}
            <input type="email" placeholder="E-mail" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            <input type="password" placeholder="Senha" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-500 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-gray-400 font-bold text-sm hover:text-blue-600 transition-all">{isRegistering ? 'Já tenho conta. Login' : 'Não tem conta? Comece grátis'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12 font-black text-2xl text-blue-600 tracking-tighter italic">FinPilot</div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutDashboard size={22} /> Painel Geral</button>
          <button onClick={() => setActiveTab('goals')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'goals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}><Target size={22} /> Minhas Metas</button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}><PlusCircle size={22} /> Lançamentos</button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}><MessageSquare size={22} /> Consultor IA</button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-4 p-4 text-red-400 font-bold mt-auto hover:bg-red-50 rounded-2xl transition-all"><LogOut size={22} /> Sair</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <div><h2 className="text-4xl font-black tracking-tight">Painel de Controle</h2><p className="text-gray-400 font-medium">Veja como está sua saúde financeira hoje.</p></div>
            
            {/* Cards de Saldo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center gap-5">
                <div className="p-4 bg-green-50 text-green-500 rounded-[1.2rem]"><TrendingUp size={28} /></div>
                <div><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Receitas</p><p className="text-2xl font-black text-green-600">R$ {balance.total_receita.toFixed(2)}</p></div>
              </div>
              <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center gap-5">
                <div className="p-4 bg-red-50 text-red-500 rounded-[1.2rem]"><TrendingDown size={28} /></div>
                <div><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Despesas</p><p className="text-2xl font-black text-red-600">R$ {balance.total_despesa.toFixed(2)}</p></div>
              </div>
              <div className="bg-blue-600 p-7 rounded-[2.5rem] shadow-2xl flex items-center gap-5 text-white transition-transform hover:scale-105">
                <div className="p-4 bg-white/20 rounded-[1.2rem]"><Wallet size={28} /></div>
                <div><p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Saldo Atual</p><p className="text-2xl font-black">R$ {balance.saldo.toFixed(2)}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Gráfico */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 h-[450px] flex flex-col">
                    <p className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6">Gastos por Categoria</p>
                    <div className="flex-1 w-full">
                        {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                                    {chartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={12} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '30px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-300 italic">Lance gastos para ver o gráfico.</div>}
                    </div>
                </div>
                {/* Histórico */}
                <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 max-h-[450px] overflow-hidden flex flex-col">
                    <p className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6">Histórico Recente</p>
                    <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 mb-3 bg-gray-50 hover:bg-blue-50 transition-all rounded-3xl group border border-transparent hover:border-blue-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-10 rounded-full ${t.type === 'receita' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div><p className="font-black text-sm">{t.description}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{t.category}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className={`font-black text-sm ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}</p>
                                    <button onClick={() => deleteTrans(t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="max-w-5xl space-y-10">
            <div><h2 className="text-4xl font-black tracking-tight">Suas Metas</h2><p className="text-gray-400 font-medium">Acompanhe o progresso dos seus sonhos.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              {/* Formulário Meta */}
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50">
                <p className="font-black text-gray-800 uppercase text-xs tracking-widest mb-8">Definir Nova Meta</p>
                <form onSubmit={handleAddGoal} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Qual seu objetivo?</label>
                    <input type="text" placeholder="Ex: Viagem, Carro novo..." className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold" value={goalDesc} onChange={e => setGoalDesc(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Quanto precisa?</label>
                        <input type="number" placeholder="5000.00" className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Já tem quanto?</label>
                        <input type="number" placeholder="0.00" className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Criar Meta Financeira</button>
                </form>
              </div>
              
              {/* Lista de Metas com Aporte */}
              <div className="space-y-6">
                {goals.map(g => {
                  const percent = Math.min((g.current_amount / g.target_amount) * 100, 100);
                  return (
                    <div key={g.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Target size={20}/></div>
                            <div><p className="font-black text-xl text-gray-800">{g.description}</p><p className="text-sm font-bold text-blue-600">R$ {g.current_amount.toFixed(2)} de R$ {g.target_amount.toFixed(2)}</p></div>
                        </div>
                        <button onClick={() => deleteGoal(g.id)} className="text-gray-300 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                      </div>
                      <div className="w-full bg-gray-100 h-5 rounded-full overflow-hidden mb-6 relative shadow-inner">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${percent}%` }}></div>
                      </div>
                      
                      {/* INPUT DE APORTE (ADICIONAR VALOR) */}
                      <div className="flex items-center gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 focus-within:border-green-400 transition-all shadow-inner">
                        <input 
                          type="number" placeholder="Somar valor..." 
                          className="flex-1 p-2 bg-transparent outline-none text-xs font-black text-gray-600 pl-4"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { handleUpdateGoal(g.id, e.target.value); e.target.value = ''; }
                          }}
                        />
                        <button 
                          onClick={(e) => { const inp = e.currentTarget.previousSibling; handleUpdateGoal(g.id, inp.value); inp.value = ''; }}
                          className="bg-green-500 text-white p-2.5 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100 flex items-center justify-center"
                        >
                          <PlusCircle size={18} />
                        </button>
                      </div>
                      <p className="text-right mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{percent.toFixed(0)}% Concluído</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-lg">
                <h2 className="text-4xl font-black mb-8 tracking-tight">Novo Registro</h2>
                <form onSubmit={handleAddFinance} className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-50 space-y-8">
                <div className="flex p-2 bg-gray-100 rounded-[1.8rem]">
                    <button type="button" onClick={() => {setType('receita'); setCategory('Salário');}} className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all ${type === 'receita' ? 'bg-white text-green-600 shadow-xl' : 'text-gray-400'}`}>Entrada</button>
                    <button type="button" onClick={() => {setType('despesa'); setCategory('Alimentação');}} className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all ${type === 'despesa' ? 'bg-white text-red-600 shadow-xl' : 'text-gray-400'}`}>Saída</button>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-2">Descrição</label><input type="text" placeholder="Ex: Salário, Aluguel..." className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold" value={desc} onChange={e => setDesc(e.target.value)} required /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-2">Valor (R$)</label><div className="relative"><DollarSign className="absolute left-5 top-5 text-blue-600" size={24}/><input type="number" step="0.01" placeholder="0.00" className="w-full p-5 pl-14 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all text-3xl font-black" value={amount} onChange={e => setAmount(e.target.value)} required /></div></div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                    <select className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 appearance-none" value={category} onChange={e => setCategory(e.target.value)}>
                        {type === 'receita' ? <><option>Salário</option><option>Investimento</option><option>Presente</option><option>Outros</option></> : <><option>Alimentação</option><option>Transporte</option><option>Lazer</option><option>Saúde</option><option>Educação</option><option>Outros</option></>}
                    </select>
                </div>
                <button type="submit" className={`w-full py-6 rounded-3xl font-black text-white shadow-2xl transition-all active:scale-95 ${type === 'receita' ? 'bg-green-500 shadow-green-100 hover:bg-green-600' : 'bg-red-500 shadow-red-100 hover:bg-red-600'}`}>Confirmar Lançamento</button>
                </form>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-white rounded-[3rem] shadow-sm border border-gray-50 overflow-hidden">
            <header className="p-7 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><Bot size={36} /></div>
                <div><p className="font-black text-2xl tracking-tight text-gray-800">Analista FinPilot</p><p className="text-[10px] text-green-500 font-black flex items-center gap-1.5 uppercase tracking-widest"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> IA Ativa</p></div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-gray-50/20">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[75%] p-7 rounded-[2.5rem] text-sm font-semibold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>{msg.content}</div>
                </div>
              ))}
              {loading && <div className="flex items-center gap-3 text-blue-600/50 font-black text-xs animate-pulse ml-2 tracking-widest">PENSANDO...</div>}
            </div>
            <footer className="p-8 bg-white border-t border-gray-50">
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-[2.2rem] border-2 border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all shadow-inner group">
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-5 py-3 outline-none font-bold text-gray-700" placeholder="Como estão meus sonhos este mês?" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button onClick={sendMessage} disabled={loading} className="bg-blue-600 text-white p-4 rounded-[1.6rem] hover:bg-blue-700 transition-all shadow-xl active:scale-90 disabled:opacity-30"><Send size={24} /></button>
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;