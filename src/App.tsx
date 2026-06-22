import { useState, useEffect } from 'react';
import {
  Home,
  ReceiptText,
  FileChartLine,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Transaction, BudgetState, ChatMessage } from './types';
import { HomeView } from './components/HomeView';
import { BillsView } from './components/BillsView';
import { BudgetView } from './components/BudgetView';
import { AssistantView } from './components/AssistantView';
import { AddRecordView } from './components/AddRecordView';
import { AuthView } from './components/AuthView';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

const defaultBudget: BudgetState = {
  total: 0,
  categoryBudgets: [
    { category: '餐饮', amount: 0 },
    { category: '交通', amount: 0 },
    { category: '购物', amount: 0 },
    { category: '娱乐', amount: 0 },
    { category: '住房', amount: 0 },
    { category: '医疗', amount: 0 },
  ]
};

const seededChatHistory: ChatMessage[] = [
  {
    id: 'ch-welcome',
    role: 'model',
    text: '你好呀！我是你的 AI 财务小秘书 Penny！💖\n\n我已经成功同步了您当前的收支对账流水和本期预算分布。您可以直接问我"分析我的消费结构"、"帮我合理制定省钱策略"或者"查看本期超支品类"。快来聊聊吧！',
    timestamp: '10:00'
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'home' | 'bills' | 'budget' | 'ai'>('home');
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<BudgetState>(defaultBudget);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(seededChatHistory);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);

  // Auth + data initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) loadData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        loadData(newUser.id);
      } else {
        setTransactions([]);
        setBudget(defaultBudget);
        setChatHistory(seededChatHistory);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (userId: string) => {
    setDataLoading(true);
    const [txRes, budgetRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).order('time', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (txRes.data) {
      setTransactions(txRes.data.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        note: row.note ?? '',
        category: row.category,
        payment: row.payment,
        date: row.date,
        time: row.time,
        type: row.type,
      })));
    }

    if (budgetRes.data) {
      setBudget({
        total: budgetRes.data.total,
        categoryBudgets: budgetRes.data.category_budgets ?? defaultBudget.categoryBudgets,
      });
    }

    setDataLoading(false);
  };

  const handleSaveTransaction = async (txData: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const newTx: Transaction = { ...txData, id: `tx-${Date.now()}` };

    const { error } = await supabase.from('transactions').insert({
      id: newTx.id,
      user_id: user.id,
      amount: newTx.amount,
      note: newTx.note,
      category: newTx.category,
      payment: newTx.payment,
      date: newTx.date,
      time: newTx.time,
      type: newTx.type,
    });

    if (!error) {
      setTransactions(prev => [newTx, ...prev]);
      setIsAddOpen(false);
      triggerToast('🎉 妥啦！账单记录已成功存入账簿。', 'success');
      setTimeout(() => setActiveTab('bills'), 300);
    } else {
      triggerToast('保存失败，请重试', 'danger');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    if (!error) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      triggerToast('🗑️ 您已成功删除对应的那笔账目。', 'danger');
    }
  };

  const updateBudgetState = async (newBudget: BudgetState) => {
    if (!user) return;
    setBudget(newBudget);
    await supabase.from('budgets').upsert({
      user_id: user.id,
      total: newBudget.total,
      category_budgets: newBudget.categoryBudgets,
      updated_at: new Date().toISOString(),
    });
  };

  const handleAddChatMessage = (msg: ChatMessage) => {
    setChatHistory(prev => [...prev, msg]);
  };

  const handleClearHistory = () => {
    setChatHistory(seededChatHistory);
    triggerToast('🧼 正确重置 AI 助理上下文通道。', 'success');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const triggerToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const now = new Date();
  const currentMonthFilter = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthList = transactions.filter(tx => tx.date.startsWith(currentMonthFilter));

  const totalIncome = monthList.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = monthList.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  // Auth loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-gray-900/90 backdrop-blur-md text-white rounded-full px-5 py-3 shadow-xl border border-white/10 flex items-center gap-2 text-xs font-bold animate-bounce select-none">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {dataLoading && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-primary/20 z-[100]">
          <div className="h-full bg-primary animate-pulse w-2/3"></div>
        </div>
      )}

      <div className="flex-1 pb-24">
        {activeTab === 'home' && (
          <HomeView
            transactions={transactions}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            budgetTotal={budget.total}
            onNavigate={tab => setActiveTab(tab)}
            onOpenAdd={() => setIsAddOpen(true)}
            onLogout={handleLogout}
            userEmail={user.email ?? ''}
          />
        )}

        {activeTab === 'bills' && (
          <BillsView
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            budgetTotal={budget.total}
            totalExpense={totalExpense}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            transactions={transactions}
            budget={budget}
            onUpdateBudget={updateBudgetState}
            totalExpense={totalExpense}
          />
        )}

        {activeTab === 'ai' && (
          <AssistantView
            transactions={transactions}
            budget={budget}
            chatHistory={chatHistory}
            onAddChatMessage={handleAddChatMessage}
            onClearChatHistory={handleClearHistory}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1.5 pb-safe h-20 bg-white/90 backdrop-blur-md border-t border-gray-150/65 shadow-2xl rounded-t-3xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className={`w-5 h-5 mb-1 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">首页</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${
            activeTab === 'bills' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ReceiptText className={`w-5 h-5 mb-1 ${activeTab === 'bills' ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">账单</span>
        </button>

        <div className="relative w-14 h-14 mx-1">
          <button
            onClick={() => setIsAddOpen(true)}
            className="absolute -top-7 left-0 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
            title="记一笔"
          >
            <Plus className="w-8 h-8 stroke-[2.5px]" />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${
            activeTab === 'budget' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FileChartLine className={`w-5 h-5 mb-1 ${activeTab === 'budget' ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">预算</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 relative ${
            activeTab === 'ai' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sparkles className={`w-5 h-5 mb-1 ${activeTab === 'ai' ? 'stroke-[2.5px] text-primary' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">AI助手</span>
          <span className="absolute top-[8px] right-[24%] w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
        </button>
      </nav>

      {isAddOpen && (
        <AddRecordView
          onClose={() => setIsAddOpen(false)}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
}
