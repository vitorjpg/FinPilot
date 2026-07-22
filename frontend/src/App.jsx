import React, { useState, useEffect } from 'react';
import { Send, Bot, LayoutDashboard, MessageSquare, LogOut, User, Lock, Mail, PlusCircle, DollarSign, Trash2, TrendingUp, TrendingDown, Wallet, Target, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_URL = 'https://finpilot-backend.onrender.com'; // GARANTA QUE ESTA É A SUA URL DO RENDER
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [balance, setBalance] = useState({ total_receita: 0, total_despesa: 0, saldo: 0 });
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salário');
  const [type, setType] = useState('receita');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Olá! Sou o FinPilot. Vamos organizar suas finanças?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (err) { if (err.response?.status === 401) handleLogout(); }
  };

  useEffect(() => { fetchData(); }, [token, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) { alert('Falha no login.'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { full_name: fullName, email, password });
      alert('Sucesso! Faça o login.'); setIsRegistering(false);
    } catch (err) { alert('Erro no cadastro.'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); };

  const handleAddFinance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/finance/add`, { description: desc, amount: parseFloat(amount), type, category }, { headers: { Authorization: `Bearer ${token}` } });
      setDesc(''); setAmount(''); fetchData(); alert('Lançado!');
    } catch (err) { alert('Erro.'); }
  };

  const handleUpdateGoal = async (id, amountToAdd) => {
    try {
      await axios.patch(`${API_URL}/goals/update/${id}`, { amount_to_add: parseFloat(amountToAdd) }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Erro.'); }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/chat/send`, { message: input, history: messages.map(m => ({ role: m.role, content: m.content })).slice(-5) }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'assistant', content: 'Erro na conexão.' }]); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3F5F9] font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4">FP</div>
            <h2 className="text-3xl font-black">{isRegistering ? 'Criar Conta' : 'FinPilot'}</h2>
          </div>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && <input type="text" placeholder="Nome" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={fullName} onChange={(e) => setFullName(e.target.value)} required/>}
            <input type="email" placeholder="E-mail" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            <input type="password" placeholder="Senha" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl">Continuar</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-blue-600 font-bold text-sm">{isRegistering ? 'Voltar para login' : 'Criar conta grátis'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans text-gray-900 overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12 font-black text-2xl text-blue-600 italic">FinPilot</div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutDashboard size={22} /> Painel</button>
          <button onClick={() => setActiveTab('goals')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'goals' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}><Target size={22} /> Metas</button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}><PlusCircle size={22} /> Lançar</button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}><MessageSquare size={22} /> Consultor IA</button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-4 p-4 text-red-400 font-bold mt-auto hover:bg-red-50 rounded-2xl transition-all"><LogOut size={22} /> Sair</button>
      </aside>

      {/* Navegação Mobile - Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LayoutDashboard size={20} /> <span className="text-[10px] font-black uppercase">Painel</span>
        </button>
        <button onClick={() => setActiveTab('goals')} className={`flex flex-col items-center gap-1 ${activeTab === 'goals' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Target size={20} /> <span className="text-[10px] font-black uppercase">Metas</span>
        </button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center gap-1 ${activeTab === 'finance' ? 'text-blue-600' : 'text-gray-400'}`}>
          <PlusCircle size={20} /> <span className="text-[10px] font-black uppercase">Lançar</span>
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400'}`}>
          <MessageSquare size={20} /> <span className="text-[10px] font-black uppercase">IA</span>
        </button>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-400">
          <LogOut size={20} /> <span className="text-[10px] font-black uppercase">Sair</span>
        </button>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-24 md:pb-10 custom-scrollbar">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black">Resumo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><TrendingUp size={20}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Receitas</p><p className="text-lg font-black text-green-600">R$ {balance.total_receita.toFixed(2)}</p></div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><TrendingDown size={20}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Despesas</p><p className="text-lg font-black text-red-600">R$ {balance.total_despesa.toFixed(2)}</p></div>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-xl flex items-center gap-4 text-white">
                <div className="p-3 bg-white/20 rounded-2xl"><Wallet size={20}/></div>
                <div><p className="text-white/60 text-[10px] font-black uppercase">Saldo</p><p className="text-lg font-black">R$ {balance.saldo.toFixed(2)}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 h-[350px]">
                    <p className="font-black text-gray-800 uppercase text-[10px] tracking-widest mb-4">Gastos</p>
                    {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                {chartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">Sem dados.</div>}
                </div>
                <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                    <p className="font-black text-gray-800 uppercase text-[10px] tracking-widest mb-4">Histórico</p>
                    <div className="space-y-3">
                        {transactions.slice(0, 5).map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full ${t.type === 'receita' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div><p className="font-black text-xs">{t.description}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{t.category}</p></div>
                                </div>
                                <p className={`font-black text-xs ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>R$ {t.amount.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black">Metas</h2>
            <div className="grid grid-cols-1 gap-4">
              {goals.map(g => {
                const percent = Math.min((g.current_amount / g.target_amount) * 100, 100);
                return (
                  <div key={g.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <p className="font-black text-lg">{g.description}</p>
                        <p className="text-sm font-bold text-blue-600">R$ {g.current_amount.toFixed(0)} / {g.target_amount.toFixed(0)}</p>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex mt-4 gap-2">
                        <input type="number" placeholder="Somar R$" className="flex-1 p-2 bg-gray-50 border rounded-xl text-xs font-bold outline-none" onKeyDown={(e) => { if (e.key === 'Enter') { handleUpdateGoal(g.id, e.target.value); e.target.value = ''; }}} />
                        <button onClick={(e) => { const val = e.currentTarget.previousSibling.value; handleUpdateGoal(g.id, val); e.currentTarget.previousSibling.value = ''; }} className="bg-green-500 text-white p-2 rounded-xl"><PlusCircle size={18}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-black mb-6">Lançar</h2>
            <form onSubmit={handleAddFinance} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 space-y-6">
                <div className="flex p-1 bg-gray-100 rounded-2xl">
                    <button type="button" onClick={() => {setType('receita'); setCategory('Salário');}} className={`flex-1 py-3 rounded-xl font-black ${type === 'receita' ? 'bg-white text-green-600 shadow-md' : 'text-gray-400'}`}>Receita</button>
                    <button type="button" onClick={() => {setType('despesa'); setCategory('Alimentação');}} className={`flex-1 py-3 rounded-xl font-black ${type === 'despesa' ? 'bg-white text-red-600 shadow-md' : 'text-gray-400'}`}>Despesa</button>
                </div>
                <input type="text" placeholder="O que é?" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={desc} onChange={e => setDesc(e.target.value)} required />
                <input type="number" placeholder="Quanto? R$" className="w-full p-4 bg-gray-50 border rounded-2xl text-2xl font-black" value={amount} onChange={e => setAmount(e.target.value)} required />
                <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={category} onChange={e => setCategory(e.target.value)}>
                    {type === 'receita' ? <><option>Salário</option><option>Investimento</option><option>Outros</option></> : <><option>Alimentação</option><option>Transporte</option><option>Lazer</option><option>Saúde</option><option>Educação</option><option>Outros</option></>}
                </select>
                <button type="submit" className={`w-full py-5 rounded-2xl font-black text-white shadow-lg ${type === 'receita' ? 'bg-green-500' : 'bg-red-500'}`}>Salvar</button>
            </form>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
            <header className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Bot size={24} /></div>
                <span className="font-black text-sm">Consultor IA</span>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-xs font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>{msg.content}</div>
                </div>
              ))}
              {loading && <div className="animate-pulse text-blue-600 font-black text-[10px]">PENSANDO...</div>}
            </div>
            <footer className="p-4 bg-white border-t">
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border focus-within:border-blue-400 transition-all">
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-xs px-2 py-2 outline-none font-bold" placeholder="Pergunte algo..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button onClick={sendMessage} disabled={loading} className="bg-blue-600 text-white p-3 rounded-xl active:scale-90 transition-all"><Send size={16} /></button>
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;