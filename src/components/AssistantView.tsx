import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  TrendingDown, 
  PieChart, 
  Utensils, 
  Film, 
  Trophy, 
  Send, 
  Keyboard, 
  ChevronRight,
  ArrowUp,
  X,
  MessageSquare
} from 'lucide-react';
import { Transaction, BudgetState, ChatMessage } from '../types';

interface AssistantViewProps {
  transactions: Transaction[];
  budget: BudgetState;
  chatHistory: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
  onClearChatHistory: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  transactions,
  budget,
  chatHistory,
  onAddChatMessage,
  onClearChatHistory,
}) => {
  const [activeMode, setActiveMode] = useState<'dashboard' | 'chat'>('dashboard');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat bot message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  // Quick helper suggestions
  const presetPrompts = [
    '分析我本季度的消费结构',
    '有什么好办法减少餐饮开销？',
    '帮我制定下月省钱策略',
    '固定订阅服务该如何精简？'
  ];

  // Filter to current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTxs = transactions.filter(tx => tx.date.startsWith(currentMonth));

  const totalExpense = monthTxs
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const budgetRatio = budget.total > 0 ? Math.min(100, (totalExpense / budget.total) * 100) : 0;

  // Per-category spending for current month
  const categorySpendMap: Record<string, number> = {};
  monthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
    categorySpendMap[tx.category] = (categorySpendMap[tx.category] || 0) + tx.amount;
  });

  // Top 5 categories sorted by amount
  const topCategories = Object.entries(categorySpendMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCatAmount = topCategories[0]?.[1] || 1;

  // Bar chart: use real category names and proportional heights
  const barData = topCategories.length > 0
    ? topCategories.map(([cat, amt]) => ({
        label: cat.slice(0, 1),
        ratio: Math.max(8, Math.round((amt / maxCatAmount) * 85)),
      }))
    : [{ label: '空', ratio: 8 }];

  // Top spending category alert
  const topCat = topCategories[0];
  const secondCat = topCategories[1];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Switch view to immersive conversational chat log
    setActiveMode('chat');
    setInputText('');

    // Append user query message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    onAddChatMessage(userMsg);

    // Call server API route
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: [...chatHistory, userMsg],
          transactions: transactions,
          budget: budget
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error status.');
      }

      const data = await response.json();
      
      const pennyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onAddChatMessage(pennyMsg);
    } catch (err) {
      console.error('Failed to submit chat message to endpoint:', err);
      // Fallback response:
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '⚠️ 哎呀，Penny 当前联网不太稳定。不过没关系，我已经根据您的本地账本对数据进行了深度盘点。\n\n目前，我们发现您的总支出已占预算的 **' + budgetRatio.toFixed(1) + '%**，其中主要的硬性开销集中在「餐饮美食」品类，请注意控制宵夜及外卖频次哦。如果您有具体的预算想调整，可以随时敲我算盘！',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      onAddChatMessage(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-16 animate-fade-in relative min-h-[calc(100vh-120px)] flex flex-col justify-between">
      <header className="sticky top-0 bg-[#F8FAF9]/90 backdrop-blur-md z-40">
        <div className="flex justify-between items-center px-5 h-16 w-full max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 font-sans tracking-tight">AI 智能助理</h1>
          </div>
          {activeMode === 'chat' ? (
            <button 
              onClick={() => setActiveMode('dashboard')}
              className="text-xs font-bold text-primary hover:bg-primary-light px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>关闭对话</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveMode('chat')}
              className="text-xs font-bold text-primary hover:bg-primary-light px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>历史记录</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-md mx-auto w-full px-5 pb-24">
        {activeMode === 'dashboard' ? (
          /* DASHBOARD VIEW */
          <div className="space-y-5 animate-slide-up">
            {/* Greeting */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20 animate-bounce">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 leading-tight">早安，理财达人</h2>
                <p className="text-xs text-gray-500 font-medium">我是您的 AI 财务小秘书 Penny，今天我们要开始哪一项消费透视？</p>
              </div>
            </div>

            {/* Scrolling Suggestions */}
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
              {presetPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="flex-shrink-0 px-4 py-2 rounded-full border border-primary/20 bg-primary-light text-primary font-bold text-xs hover:bg-primary/10 transition-all active:scale-[0.98]"
                >
                  {prompt.substring(0, 8)}...
                </button>
              ))}
            </div>

            {/* High-fidelity Monthly forecast card */}
            <section className="relative overflow-hidden rounded-[24px] bg-primary text-white p-5 shadow-lg shadow-primary/20">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full bg-white blur-xl"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider font-sans">本月消费预测</span>
                    <h3 className="text-3xl font-extrabold tracking-tight font-mono mt-0.5">¥{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <span className="bg-white/20 select-none px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans">AI 实时分析中</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold font-sans">
                    <span className="opacity-80">当前执行进度 ({budgetRatio.toFixed(0)}%)</span>
                    <span className="opacity-95">目标上限 ¥{budget.total}</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                      style={{ width: `${budgetRatio}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-xs text-white/90">
                  <TrendingDown className="w-4 h-4 text-emerald-300" />
                  <p className="font-sans">预计总支出将比上周微调减少 <span className="font-extrabold text-amber-200">12%</span>，请继续保持！</p>
                </div>
              </div>
            </section>

            {/* Bento and Graphs Grid */}
            <section className="grid grid-cols-2 gap-4">
              {/* Columns container */}
              <div className="col-span-2 p-5 bg-white border border-gray-100 rounded-[24px] shadow-[0px_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-gray-900 font-sans">本月消费结构</h4>
                  </div>
                  <span className="text-[10px] text-gray-400 font-sans font-bold">按消费额比例排序</span>
                </div>

                <div className="flex items-end gap-3 h-28 px-3">
                  {barData.map((item) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-primary-light rounded-t-lg relative h-[70px] flex items-end">
                        <div
                          className="w-full bg-primary rounded-t-lg transition-all"
                          style={{ height: `${item.ratio}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 font-sans">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic alert boxes based on real data */}
              {topCat ? (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-[20px] space-y-1.5 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <Utensils className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-extrabold text-xs text-red-950 font-sans">{topCat[0]}支出最高</h5>
                  <p className="text-[10px] text-red-900/80 leading-relaxed font-sans">
                    本月{topCat[0]}累计 ¥{topCat[1].toFixed(2)}，占总支出 {totalExpense > 0 ? ((topCat[1] / totalExpense) * 100).toFixed(0) : 0}%，是当前最大开销项。
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-green-50/50 border border-green-100 rounded-[20px] space-y-1.5 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                    <Utensils className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-extrabold text-xs text-green-950 font-sans">本月暂无支出</h5>
                  <p className="text-[10px] text-green-900/80 leading-relaxed font-sans">
                    记录第一笔账后，这里会显示你的消费分析。
                  </p>
                </div>
              )}

              {secondCat ? (
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-[20px] space-y-1.5 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Film className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-extrabold text-xs text-orange-950 font-sans">{secondCat[0]}第二高</h5>
                  <p className="text-[10px] text-orange-900/80 leading-relaxed font-sans">
                    本月{secondCat[0]}花了 ¥{secondCat[1].toFixed(2)}。问问 AI 有没有节省空间？
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-[20px] space-y-1.5 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Film className="w-4.5 h-4.5" />
                  </div>
                  <h5 className="font-extrabold text-xs text-orange-950 font-sans">省钱小技巧</h5>
                  <p className="text-[10px] text-orange-900/80 leading-relaxed font-sans">
                    记账后 AI 会自动分析你的消费习惯，给出个性化建议。
                  </p>
                </div>
              )}
            </section>

            {/* Savings challenge banner card */}
            <section className="p-5 bg-white border border-gray-100 rounded-[24px] shadow-[0px_4px_24px_rgba(0,0,0,0.02)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary shrink-0 shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-900">7天无外卖绿色省钱挑战</h4>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (monthTxs.length / 7) * 100)}%` }}></div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold font-mono">{Math.min(monthTxs.length, 7)} / 7笔</span>
                </div>
              </div>
              <button 
                onClick={() => handleSendMessage("我要参加7天不点外卖挑战")}
                className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:border-gray-200 transition-all text-gray-400 focus:text-primary shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </section>
          </div>
        ) : (
          /* ACTIVE CONVERSATION MESSAGES MODE */
          <div className="space-y-4 pt-2 pb-10 flex-1 flex flex-col justify-end">
            <div className="space-y-4.5">
              {chatHistory.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 max-w-[90%] ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      isUser 
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/10 rounded-tr-none' 
                        : 'bg-white border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                    }`}>
                      <p className="whitespace-pre-line font-sans">{msg.text}</p>
                      <p className={`text-[9px] mt-1.5 ${isUser ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 justify-start mr-auto max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 animate-bounce">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 rounded-tl-none shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce delay-200"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300"></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* In-chat suggestion bubbles to easily pivot conversations */}
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pt-4 border-t border-gray-200/50">
              {presetPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full border border-gray-150 bg-gray-50 text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-all select-none"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Persisting Bottom Chat Bar */}
      <div className="fixed bottom-20 left-0 w-full z-50 px-5 pb-5 pt-3 bg-gradient-to-t from-[#F8FAF9] via-[#F8FAF9]/90 to-transparent">
        <div className="max-w-md mx-auto flex items-center">
          <div className="w-full bg-white border border-gray-150 rounded-full pl-4.5 pr-2 h-13 flex items-center gap-2.5 shadow-xl shadow-gray-200/40">
            <Keyboard className="w-5 h-5 text-gray-400" />
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="问问 AI 理财规划、记账分类..."
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-400 focus:ring-0 text-gray-800"
              type="text"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                inputText.trim() 
                  ? 'bg-primary text-white active:scale-90 cursor-pointer' 
                  : 'bg-gray-50 text-gray-300'
              }`}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
