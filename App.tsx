
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  ChartPieIcon, 
  ArrowsRightLeftIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  SparklesIcon,
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BudgetEntry, EntryType, Category, BudgetSummary } from './types.ts';
import { getFinancialAdvice } from './services/geminiService.ts';

const App: React.FC = () => {
  // Helpers para chaves de data
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const now = new Date();
  
  // Estados principais
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [entries, setEntries] = useState<BudgetEntry[]>(() => {
    const saved = localStorage.getItem('budget_entries_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // States for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Form State for New Entry
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<EntryType>(EntryType.EXPENSE);
  const [category, setCategory] = useState<Category>(Category.MONTHLY);

  const currentMonthKey = useMemo(() => getMonthKey(viewDate), [viewDate]);

  // Persistência
  useEffect(() => {
    localStorage.setItem('budget_entries_v2', JSON.stringify(entries));
  }, [entries]);

  // Lógica de exibição: Registros do mês atual + Registros marcados como "Mensal"
  const displayEntries = useMemo(() => {
    return entries.filter(e => 
      e.monthKey === currentMonthKey || e.category === Category.MONTHLY
    );
  }, [entries, currentMonthKey]);

  const summary = useMemo<BudgetSummary>(() => {
    const totalIncome = displayEntries
      .filter(e => e.type === EntryType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = displayEntries
      .filter(e => e.type === EntryType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpenses;
    const percentageUsed = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, balance, percentageUsed };
  }, [displayEntries]);

  const categoryData = useMemo(() => {
    const expenses = displayEntries.filter(e => e.type === EntryType.EXPENSE);
    const groups = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [displayEntries]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newEntry: BudgetEntry = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString(),
      monthKey: currentMonthKey,
      isPaid: false
    };

    setEntries([newEntry, ...entries]);
    resetForm();
    setIsModalOpen(false);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
    setAiAnalysis(null); 
  };

  const resetToCurrentMonth = () => {
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleStartEdit = (entry: BudgetEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.amount.toString());
  };

  const handleSaveEdit = (id: string) => {
    const newAmount = parseFloat(editValue);
    if (isNaN(newAmount)) return;
    setEntries(entries.map(e => e.id === id ? { ...e, amount: newAmount } : e));
    setEditingId(null);
    setEditValue('');
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType(EntryType.EXPENSE);
    setCategory(Category.MONTHLY);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const togglePaid = (id: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, isPaid: !e.isPaid } : e));
  };

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    const advice = await getFinancialAdvice(displayEntries, summary);
    setAiAnalysis(advice || "Sem conselhos disponíveis no momento.");
    setIsAnalyzing(false);
  };

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Orçamento<span className="text-indigo-600">Smart</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md active:scale-95"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Registro</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex flex-col items-center min-w-[140px]">
              <h2 className="text-lg font-bold text-slate-800 capitalize">
                {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visualizando Orçamento</span>
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6 text-slate-600" />
            </button>
          </div>
          
          <button 
            onClick={resetToCurrentMonth}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-2 rounded-lg"
          >
            <ArrowPathIcon className="w-4 h-4" />
            IR PARA HOJE
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Recebido</p>
              <h3 className="text-2xl font-bold text-slate-800">R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
              <ArrowTrendingDownIcon className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Consumido</p>
              <h3 className="text-2xl font-bold text-slate-800">R$ {summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 ${summary.balance >= 0 ? 'bg-indigo-600 border-indigo-700' : 'bg-orange-600 border-orange-700'}`}>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <ChartPieIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Saldo Mensal</p>
              <h3 className="text-2xl font-bold text-white">R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ChartPieIcon className="w-5 h-5 text-indigo-600" />
              Gastos por Categoria
            </h3>
            <div className="h-64 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic border border-dashed border-slate-100 rounded-xl">
                  Nenhum gasto registrado para exibir gráfico.
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-indigo-500" />
                  Análise do Consultor AI
                </h3>
                <button 
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing || displayEntries.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  {isAnalyzing ? 'Analisando...' : 'Analisar Este Mês'}
                </button>
              </div>

              {aiAnalysis ? (
                <div className="prose prose-indigo max-w-none text-slate-600 text-sm leading-relaxed overflow-y-auto max-h-[220px] scrollbar-hide">
                  <p className="whitespace-pre-line">{aiAnalysis}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                  <SparklesIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p>Clique em "Analisar Este Mês" para receber dicas personalizadas para o período selecionado.</p>
                </div>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              Transações de {viewDate.toLocaleDateString('pt-BR', { month: 'long' })}
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                <CalendarIcon className="w-3 h-3" /> RECORRENTES (MENSAL)
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhuma transação para este mês.
                    </td>
                  </tr>
                ) : (
                  displayEntries.map((entry) => (
                    <tr key={entry.id} className={`hover:bg-slate-50 transition-colors group ${entry.category === Category.MONTHLY ? 'border-l-4 border-l-indigo-400' : ''}`}>
                      <td className="px-6 py-4">
                        {entry.type === EntryType.EXPENSE ? (
                          <button 
                            onClick={() => togglePaid(entry.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${entry.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                          >
                            {entry.isPaid ? 'Pago' : 'Pendente'}
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">Entrada</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{entry.description}</span>
                          {entry.category === Category.MONTHLY && (
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Item Recorrente</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.category === Category.CREDIT_CARD ? 'bg-slate-100 text-slate-600' : ''}`}>
                          {entry.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${entry.type === EntryType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                        <div className="flex items-center justify-end gap-2">
                          {editingId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <input 
                                autoFocus
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 px-2 py-1 border border-indigo-400 rounded outline-none text-right font-mono text-sm"
                              />
                              <button onClick={() => handleSaveEdit(entry.id)} className="p-1 bg-emerald-500 text-white rounded">
                                <CheckIcon className="w-3 h-3" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1 bg-slate-200 text-slate-600 rounded">
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {(entry.category === Category.CREDIT_CARD || entry.category === Category.MONTHLY) && (
                                <button 
                                  onClick={() => handleStartEdit(entry)}
                                  className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Editar valor"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                              )}
                              <span>{entry.type === EntryType.INCOME ? '+' : '-'} R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold">Novo Registro</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setType(EntryType.EXPENSE)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === EntryType.EXPENSE ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}
                >
                  Gasto
                </button>
                <button 
                  type="button"
                  onClick={() => setType(EntryType.INCOME)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === EntryType.INCOME ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                >
                  Entrada
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  placeholder="Ex: Aluguel, Salário..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {category === Category.MONTHLY && (
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-3">
                  <ArrowPathIcon className="w-5 h-5 text-indigo-500" />
                  <p className="text-[10px] text-indigo-700 leading-tight">
                    <strong>Item Recorrente:</strong> Este registro aparecerá automaticamente em todos os meses do sistema.
                  </p>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
