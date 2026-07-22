import React, { useState, useEffect } from 'react';
import { Send, Bot, LayoutDashboard, MessageSquare, LogOut, User, Lock, Mail, PlusCircle, DollarSign, Trash2, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const API_URL = 'https://finpilot-backend.onrender.com'; // <--- SEU LINK DO RENDER
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
  const [category, setCategory] = useState('Alimentação');
  const [type, setType] = useState('despesa');
  
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Olá! Sou o FinPilot. Como posso ajudar com suas finanças hoje?' }]);
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
      alert('Conta criada!'); setIsRegistering(false);
    } catch (err) { alert('Erro no cadastro.'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); };

  const handleAddFinance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/finance/add`, { description: desc, amount: parseFloat(amount), type, category }, { headers: { Authorization: `Bearer ${token}` } });
      setDesc(''); setAmount(''); fetchData(); alert('Lançamento realizado!');
    } catch (err) { alert('Erro.'); }
  };

  const deleteTrans = async (id) => {
    if (!window.confirm("Excluir este registro permanentemente?")) return;
    try {
      await axios.delete(`${API_URL}/finance/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Erro ao excluir.'); }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/goals/add`, { description: goalDesc, target_amount: parseFloat(goalTarget), current_amount: parseFloat(goalCurrent || 0) }, { headers: { Authorization: `Bearer ${token}` } });
      setGoalDesc(''); setGoalTarget(''); setGoalCurrent(''); fetchData(); alert('Meta salva!');
    } catch (err) { alert('Erro.'); }
  };

  const handleUpdateGoal = async (id, val) => {
    try {
      await axios.patch(`${API_URL}/goals/update/${id}`, { amount_to_add: parseFloat(val) }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Erro.'); }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("Remover meta?")) return;
    try {
      await axios.delete(`${API_URL}/goals/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
    } catch (error) { setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão.' }]); }
    finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3F5F9] font-sans">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg tracking-tighter italic">FP</div>
            <h2 className="text-3xl font-black">{isRegistering ? 'Criar Conta' : 'FinPilot'}</h2>
          </div>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && <input type="text" placeholder="Nome" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={fullName} onChange={(e) => setFullName(e.target.value)} required/>}
            <input type="email" placeholder="E-mail" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            <input type="password" placeholder="Senha" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-blue-600 font-bold text-sm underline">{isRegistering ? 'Ir para login' : 'Criar conta grátis'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans text-gray-900 overflow-hidden flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:flex flex-col p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-12 font-black text-2xl text-blue-600 tracking-tighter italic">FinPilot</div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutDashboard size={22} /> Painel</button>
          <button onClick={() => setActiveTab('goals')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'goals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}><Target size={22} /> Sonhos</button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}><PlusCircle size={22} /> Lançar</button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}><MessageSquare size={22} /> Consultor IA</button>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-4 p-4 text-red-400 font-bold mt-auto hover:bg-red-50 rounded-2xl transition-all"><LogOut size={22} /> Sair</button>
      </aside>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around items-center z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-600 scale-110' : 'text-gray-300'}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveTab('goals')} className={activeTab === 'goals' ? 'text-blue-600 scale-110' : 'text-gray-300'}><Target size={24}/></button>
        <button onClick={() => setActiveTab('finance')} className={activeTab === 'finance' ? 'text-blue-600 scale-110' : 'text-gray-300'}><PlusCircle size={24}/></button>
        <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'text-blue-600 scale-110' : 'text-gray-300'}><MessageSquare size={24}/></button>
        <button onClick={handleLogout} className="text-red-300"><LogOut size={24}/></button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pb-28 md:pb-10 custom-scrollbar">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black tracking-tighter">Resumo Geral</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border border-gray-50">
                <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><TrendingUp size={22}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Receitas</p><p className="text-lg font-black text-green-600">R$ {balance.total_receita.toFixed(2)}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4 border border-gray-50">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><TrendingDown size={22}/></div>
                <div><p className="text-[10px] font-black text-gray-400 uppercase">Despesas</p><p className="text-lg font-black text-red-500">R$ {balance.total_despesa.toFixed(2)}</p></div>
              </div>
              <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl flex items-center gap-4 text-white">
                <div className="p-3 bg-white/20 rounded-2xl"><Wallet size={22}/></div>
                <div><p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Disponível</p><p className="text-lg font-black">R$ {balance.saldo.toFixed(2)}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 h-[400px] flex flex-col items-center justify-center">
                    <p className="font-black text-gray-800 uppercase text-[10px] tracking-widest mb-6 w-full text-center">Distribuição Mensal</p>
                    {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                                {chartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '15px', border:'none', shadow: 'xl'}} />
                            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    ) : <div className="text-gray-300 italic text-sm">Sem dados.</div>}
                </div>

                <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col max-h-[400px]">
                    <p className="font-black text-gray-800 uppercase text-[10px] tracking-widest mb-6">Histórico Completo</p>
                    <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 mb-3 bg-gray-50 rounded-3xl group transition-all hover:bg-blue-50/50 border border-transparent hover:border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-10 rounded-full ${t.type === 'receita' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div><p className="font-black text-sm text-gray-700">{t.description}</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{t.category}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className={`font-black text-sm ${t.type === 'receita' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}</p>
                                    <button onClick={() => deleteTrans(t.id)} className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl">
                                      <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && <div className="text-center py-20 text-gray-300 font-bold">Nenhum lançamento.</div>}
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-10 max-w-4xl animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black tracking-tighter italic text-blue-600">Meus Sonhos</h2>
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50">
              <p className="font-black text-gray-800 uppercase text-[10px] tracking-widest mb-8">Definir Novo Objetivo</p>
              <form onSubmit={handleAddGoal} className="space-y-6">
                <input type="text" placeholder="O que você quer conquistar?" className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500 transition-all font-bold" value={goalDesc} onChange={e => setGoalDesc(e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase ml-2">Valor Alvo</label><input type="number" placeholder="5000" className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500 transition-all font-bold" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase ml-2">Já Guardado</label><input type="number" placeholder="0" className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500 transition-all font-bold" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} /></div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Salvar Sonho</button>
              </form>
            </div>
            <div className="grid grid-cols-1 gap-6 pb-10">
              {goals.map(g => {
                const percent = Math.min((g.current_amount / g.target_amount) * 100, 100);
                return (
                  <div key={g.id} className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-50 transition-transform hover:scale-[1.01]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Target size={24}/></div><div><p className="font-black text-xl text-gray-800">{g.description}</p><p className="text-sm font-bold text-blue-600">R$ {g.current_amount.toLocaleString()} de {g.target_amount.toLocaleString()}</p></div></div>
                        <button onClick={() => deleteGoal(g.id)} className="text-red-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                    </div>
                    <div className="w-full bg-gray-100 h-5 rounded-full overflow-hidden mb-6 shadow-inner">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000 shadow-md" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-green-400 transition-all">
                        <input type="number" placeholder="Aportar valor..." className="flex-1 bg-transparent border-none outline-none text-sm font-black text-gray-600 pl-4" onKeyDown={(e) => { if (e.key === 'Enter') { handleUpdateGoal(g.id, e.target.value); e.target.value = ''; }}} />
                        <button onClick={(e) => { const val = e.currentTarget.previousSibling.value; handleUpdateGoal(g.id, val); e.currentTarget.previousSibling.value = ''; }} className="bg-green-500 text-white p-3 rounded-xl shadow-lg hover:bg-green-600 active:scale-90 transition-all"><PlusCircle size={20}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300">
            <div className="max-w-md w-full">
                <h2 className="text-3xl font-black mb-8 tracking-tighter">Novo Registro</h2>
                <form onSubmit={handleAddFinance} className="bg-white p-12 rounded-[3.5rem] shadow-2xl space-y-8 border border-gray-50">
                    <div className="flex p-2 bg-gray-100 rounded-[1.8rem]">
                        <button type="button" onClick={() => {setType('receita'); setCategory('Salário');}} className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all ${type === 'receita' ? 'bg-white text-green-600 shadow-xl' : 'text-gray-400'}`}>Entrada</button>
                        <button type="button" onClick={() => {setType('despesa'); setCategory('Alimentação');}} className={`flex-1 py-4 rounded-[1.5rem] text-sm font-black transition-all ${type === 'despesa' ? 'bg-white text-red-600 shadow-xl' : 'text-gray-400'}`}>Saída</button>
                    </div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-3">Descrição</label><input type="text" placeholder="Ex: Salário, Aluguel..." className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500 font-bold transition-all" value={desc} onChange={e => setDesc(e.target.value)} required /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-3">Valor Total (R$)</label><div className="relative"><DollarSign className="absolute left-5 top-5 text-blue-600" size={24}/><input type="number" step="0.01" placeholder="0.00" className="w-full p-5 pl-14 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-blue-500 text-3xl font-black transition-all" value={amount} onChange={e => setAmount(e.target.value)} required /></div></div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-3">Categoria</label>
                        <select className="w-full p-5 bg-gray-50 border border-transparent rounded-[1.5rem] font-bold outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer" value={category} onChange={e => setCategory(e.target.value)}>
                            {type === 'receita' ? <><option>Salário</option><option>Investimento</option><option>Outros</option></> : <><option>Alimentação</option><option>Transporte</option><option>Lazer</option><option>Saúde</option><option>Educação</option><option>Outros</option></>}
                        </select>
                    </div>
                    <button type="submit" className={`w-full py-6 rounded-[1.8rem] font-black text-white shadow-2xl active:scale-95 transition-all ${type === 'receita' ? 'bg-green-500 shadow-green-100 hover:bg-green-600' : 'bg-red-500 shadow-red-100 hover:bg-red-600'}`}>Confirmar Lançamento</button>
                </form>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-white rounded-[3rem] shadow-sm border border-gray-50 overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
            <header className="p-6 border-b flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10"><div className="flex items-center gap-4"><div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><Bot size={32} /></div><div><p className="font-black text-xl tracking-tight text-gray-800 leading-none mb-1">FinPilot IA</p><p className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Sistema Ativo</p></div></div></header>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/20 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm font-semibold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-100' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>{msg.content}</div>
                </div>
              ))}
              {loading && <div className="flex items-center gap-3 animate-pulse text-blue-600 font-black text-[10px] ml-2 tracking-widest">ANALISANDO DADOS...</div>}
            </div>
            <footer className="p-8 bg-white border-t border-gray-50">
              <div className="flex items-center gap-4 bg-gray-50 p-2.5 rounded-[2rem] border-2 border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all shadow-inner group">
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-6 py-4 outline-none font-bold text-gray-700" placeholder="Como estão meus sonhos este mês?" value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }} />
                <button onClick={sendMessage} disabled={loading} className="bg-blue-600 text-white p-4 rounded-[1.5rem] shadow-xl hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-30"><Send size={22} /></button>
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;