import { useState, useEffect } from 'react';
import { 
  Home, 
  ReceiptText, 
  FileChartLine, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Transaction, BudgetState, ChatMessage } from './types';
import { HomeView } from './components/HomeView';
import { BillsView } from './components/BillsView';
import { BudgetView } from './components/BudgetView';
import { AssistantView } from './components/AssistantView';
import { AddRecordView } from './components/AddRecordView';

// Legacy AI Studio demo transactions. New users should start with an empty ledger;
// these are only used to clean up older previews that already stored demo data.
const legacySeededTransactions: Transaction[] = [
  { id: 'tx-1', amount: 35.00, note: '午餐外卖', category: '餐饮', payment: '支付宝', date: '2026-06-21', time: '12:30', type: 'expense' },
  { id: 'tx-2', amount: 22.50, note: '打车代步', category: '交通', payment: '微信支付', date: '2026-06-20', time: '18:45', type: 'expense' },
  { id: 'tx-3', amount: 15000.00, note: '工资收入', category: '工资', payment: '招商银行', date: '2026-06-15', time: '09:00', type: 'income' },
  { id: 'tx-4', amount: 3000.00, note: '兼职收入', category: '工资', payment: '银行卡', date: '2026-06-20', time: '18:00', type: 'income' },
  { id: 'tx-5', amount: 520.00, note: '购物消费', category: '购物', payment: '支付宝', date: '2026-06-20', time: '15:40', type: 'expense' },
  { id: 'tx-6', amount: 15.00, note: '公交充值', category: '交通', payment: '微信支付', date: '2026-06-21', time: '08:45', type: 'expense' },
  { id: 'tx-7', amount: 200.00, note: '超市购物', category: '购物', payment: '微信支付', date: '2026-06-20', time: '18:20', type: 'expense' },
  { id: 'tx-8', amount: 1420.00, note: '下厨买菜', category: '餐饮', payment: '银行卡', date: '2026-06-19', time: '17:30', type: 'expense' },
  { id: 'tx-9', amount: 720.00, note: '高铁出行', category: '交通', payment: '支付宝', date: '2026-06-18', time: '10:15', type: 'expense' },
  { id: 'tx-10', amount: 1050.00, note: '买苹果耳机', category: '购物', payment: '信用卡', date: '2026-06-17', time: '14:20', type: 'expense' },
  { id: 'tx-11', amount: 570.00, note: '剧本杀桌游', category: '娱乐', payment: '支付宝', date: '2026-06-16', time: '19:40', type: 'expense' }
];

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
    text: '你好呀！我是你的 AI 财务小秘书 Penny！💖\n\n我已经成功同步了您当前的收支对账流水和本期预算分布。您可以直接问我“分析我的消费结构”、“帮我合理制定省钱策略”或者“查看本期超支品类”。快来聊聊吧！',
    timestamp: '10:00'
  }
];

const removeLegacyDemoTransactions = (transactions: Transaction[]): Transaction[] => {
  return transactions.filter((tx) => {
    return !legacySeededTransactions.some((demoTx) =>
      tx.id === demoTx.id &&
      tx.note === demoTx.note &&
      tx.date === demoTx.date &&
      tx.amount === demoTx.amount
    );
  });
};

const isLegacyDemoBudget = (budget: BudgetState): boolean => {
  return budget.total === 8000 &&
    budget.categoryBudgets.length === 6 &&
    budget.categoryBudgets[0]?.category === '餐饮' &&
    budget.categoryBudgets[0]?.amount === 2000;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'bills' | 'budget' | 'ai'>('home');
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  
  // Persistent core states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<BudgetState>(defaultBudget);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(seededChatHistory);
  
  // Dialog / feedback states
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);

  // Initialize from LocalStorage or empty defaults
  useEffect(() => {
    const savedTxs = localStorage.getItem('pennypilot_txs');
    const savedBudget = localStorage.getItem('pennypilot_budget');
    const savedChat = localStorage.getItem('pennypilot_chat');

    if (savedTxs) {
      const cleanedTransactions = removeLegacyDemoTransactions(JSON.parse(savedTxs));
      setTransactions(cleanedTransactions);
      localStorage.setItem('pennypilot_txs', JSON.stringify(cleanedTransactions));
    } else {
      setTransactions([]);
      localStorage.setItem('pennypilot_txs', JSON.stringify([]));
    }

    if (savedBudget) {
      const parsedBudget = JSON.parse(savedBudget);
      const cleanedBudget = isLegacyDemoBudget(parsedBudget) ? defaultBudget : parsedBudget;
      setBudget(cleanedBudget);
      localStorage.setItem('pennypilot_budget', JSON.stringify(cleanedBudget));
    } else {
      setBudget(defaultBudget);
      localStorage.setItem('pennypilot_budget', JSON.stringify(defaultBudget));
    }

    if (savedChat) {
      setChatHistory(JSON.parse(savedChat));
    } else {
      setChatHistory(seededChatHistory);
      localStorage.setItem('pennypilot_chat', JSON.stringify(seededChatHistory));
    }
  }, []);

  // Sync state mutations to storage seamlessly
  const updateTransactionsState = (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    localStorage.setItem('pennypilot_txs', JSON.stringify(newTxs));
  };

  const updateBudgetState = (newBudget: BudgetState) => {
    setBudget(newBudget);
    localStorage.setItem('pennypilot_budget', JSON.stringify(newBudget));
  };

  const updateChatHistoryState = (newChat: ChatMessage[]) => {
    setChatHistory(newChat);
    localStorage.setItem('pennypilot_chat', JSON.stringify(newChat));
  };

  // CRUD handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`
    };
    
    const updated = [newTx, ...transactions];
    updateTransactionsState(updated);
    setIsAddOpen(false);
    triggerToast('🎉 妥啦！账单记录已成功存入账簿。', 'success');

    // Automatically prompt active view redirect
    setTimeout(() => {
      setActiveTab('bills');
    }, 300);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((tx) => tx.id !== id);
    updateTransactionsState(updated);
    triggerToast('🗑️ 您已成功删除对应的那笔账目。', 'danger');
  };

  const handleAddChatMessage = (msg: ChatMessage) => {
    const updated = [...chatHistory, msg];
    updateChatHistoryState(updated);
  };

  const handleClearHistory = () => {
    updateChatHistoryState(seededChatHistory);
    triggerToast('🧼 正确重置 AI 助理上下文通道。', 'success');
  };

  const triggerToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Pre-calculate sums for home widgets
  // (Filter out strictly for chosen active month/year for consistency)
  const now = new Date();
  const currentMonthFilter = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthList = transactions.filter((tx) => tx.date.startsWith(currentMonthFilter));

  const totalIncome = monthList
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = monthList
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      {/* Dynamic alert feedback widget */}
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

      {/* Main rendering hub */}
      <div className="flex-1 pb-24">
        {activeTab === 'home' && (
          <HomeView 
            transactions={transactions}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            budgetTotal={budget.total}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAdd={() => setIsAddOpen(true)}
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
            onUpdateBudget={(newB) => updateBudgetState(newB)}
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

      {/* Persistent Bottom Tab Navigation rail */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1.5 pb-safe h-20 bg-white/90 backdrop-blur-md border-t border-gray-150/65 shadow-2xl rounded-t-3xl">
        {/* Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className={`w-5 h-5 mb-1 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">首页</span>
        </button>

        {/* Bills */}
        <button 
          onClick={() => setActiveTab('bills')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${
            activeTab === 'bills' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ReceiptText className={`w-5 h-5 mb-1 ${activeTab === 'bills' ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">账单</span>
        </button>

        {/* Middle FLOATING FAB action button */}
        <div className="relative w-14 h-14 mx-1">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="absolute -top-7 left-0 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
            title="记一笔"
          >
            <Plus className="w-8 h-8 stroke-[2.5px]" />
          </button>
        </div>

        {/* Budget */}
        <button 
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 ${
            activeTab === 'budget' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FileChartLine className={`w-5 h-5 mb-1 ${activeTab === 'budget' ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">预算</span>
        </button>

        {/* AI Assistant */}
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all duration-300 relative ${
            activeTab === 'ai' ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sparkles className={`w-5 h-5 mb-1 ${activeTab === 'ai' ? 'stroke-[2.5px] text-primary' : 'stroke-[2px]'}`} />
          <span className="text-[10px] font-sans">AI助手</span>
          {/* Subtle online live chip wrapper */}
          <span className="absolute top-[8px] right-[24%] w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
        </button>
      </nav>

      {/* Immersive overlay modal context for record adding */}
      {isAddOpen && (
        <AddRecordView 
          onClose={() => setIsAddOpen(false)}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
}
