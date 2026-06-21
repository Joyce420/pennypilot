import React, { useState } from 'react';
import { 
  Sparkles,
  Lightbulb,
  TrendingUp,
  Utensils, 
  Car, 
  ShoppingBag, 
  Gamepad2, 
  Home, 
  HeartPulse, 
  Briefcase, 
  HelpCircle,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Transaction, BudgetState, CategoryBudget } from '../types';

interface BudgetViewProps {
  transactions: Transaction[];
  budget: BudgetState;
  onUpdateBudget: (newBudget: BudgetState) => void;
  totalExpense: number;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  transactions,
  budget,
  onUpdateBudget,
  totalExpense,
}) => {
  const [editingTotal, setEditingTotal] = useState<boolean>(false);
  const [newTotalInput, setNewTotalInput] = useState<string>(budget.total.toString());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCatAmountInput, setNewCatAmountInput] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Group transactions by category to calculate used amount
  const categorySpent: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
    });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '餐饮':
      case '饮食':
      case '餐饮美食':
        return <Utensils className="w-5 h-5" />;
      case '交通':
      case '出行':
      case '交通出行':
        return <Car className="w-5 h-5" />;
      case '购物':
      case '消费':
      case '购物消费':
        return <ShoppingBag className="w-5 h-5" />;
      case '娱乐':
      case '休闲':
      case '休闲娱乐':
        return <Gamepad2 className="w-5 h-5" />;
      case '住房':
      case '居家':
        return <Home className="w-5 h-5" />;
      case '医疗':
      case '健康':
        return <HeartPulse className="w-5 h-5" />;
      case '工资':
      case '收入':
      case '兼职':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '餐饮':
      case '饮食':
      case '餐饮美食':
        return { bg: 'bg-orange-100 text-orange-600', bar: 'bg-primary' };
      case '交通':
      case '出行':
      case '交通出行':
        return { bg: 'bg-blue-100 text-blue-600', bar: 'bg-amber-500' };
      case '购物':
      case '消费':
      case '购物消费':
        return { bg: 'bg-purple-100 text-purple-600', bar: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-100 text-gray-600', bar: 'bg-primary-container' };
    }
  };

  // Safe save of general budget total
  const handleSaveTotal = () => {
    const val = parseFloat(newTotalInput);
    if (isNaN(val) || val <= 0) return;
    onUpdateBudget({
      ...budget,
      total: val
    });
    setEditingTotal(false);
    triggerAlert('🎉 总预算额度更新成功！');
  };

  // Safe edit of specific categories budget
  const handleStartEditCategory = (cb: CategoryBudget) => {
    setEditingCategory(cb.category);
    setNewCatAmountInput(cb.amount.toString());
  };

  const handleSaveCategoryBudget = (category: string) => {
    const val = parseFloat(newCatAmountInput);
    if (isNaN(val) || val < 0) return;

    const updatedCategoryBudgets = budget.categoryBudgets.map((cb) => {
      if (cb.category === category) {
        return { ...cb, amount: val };
      }
      return cb;
    });

    onUpdateBudget({
      ...budget,
      categoryBudgets: updatedCategoryBudgets
    });
    setEditingCategory(null);
    triggerAlert(`🎉 已更新 ${category} 品类预算额度！`);
  };

  // AI Suggestion interactive execution
  const applyAiRecommends = () => {
    // Recommendation: increase Food budget by 15%, decrease Digital/Shopping to balance
    const updatedCategoryBudgets = budget.categoryBudgets.map((cb) => {
      if (cb.category === '餐饮' || cb.category === '餐饮美食') {
        return { ...cb, amount: Math.round(cb.amount * 1.15) };
      }
      if (cb.category === '购物' || cb.category === '购物消费') {
        const reduction = Math.round(cb.amount * 0.1);
        return { ...cb, amount: Math.max(200, cb.amount - reduction) };
      }
      return cb;
    });

    onUpdateBudget({
      ...budget,
      categoryBudgets: updatedCategoryBudgets
    });

    triggerAlert("🚀 AI 财务调整建议已生效！「餐饮」配额已合理上调 15%。");
  };

  const triggerAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => {
      setAlertMsg(null);
    }, 3500);
  };

  // Calculated daily recommended card
  const daysInMonth = 30;
  const currentDay = new Date().getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const remainingBudgetTotal = budget.total - totalExpense;
  const recommendedDaily = Math.max(0, remainingBudgetTotal / remainingDays);

  const totalUsedPercent = budget.total > 0 ? (totalExpense / budget.total) * 100 : 0;

  return (
    <div className="pb-10 animate-fade-in relative">
      {/* Toast Alert */}
      {alertMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white text-xs font-bold px-6 py-3 rounded-full shadow-2xl border border-white/10 z-[100] animate-bounce">
          {alertMsg}
        </div>
      )}

      <header className="sticky top-0 bg-[#F8FAF9]/90 backdrop-blur-md z-40">
        <div className="flex justify-between items-center px-5 h-16 w-full max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">预算</h1>
          <span className="text-xs font-bold text-gray-400 font-sans bg-white px-3 py-1.5 rounded-full border border-gray-100">季度规划</span>
        </div>
      </header>

      <main className="px-5 space-y-5 max-w-md mx-auto">
        {/* AI intelligent recommendation banner */}
        <section className="relative overflow-hidden rounded-[24px] bg-primary text-white p-5 shadow-lg shadow-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-white/20 select-none animate-pulse">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-[13px] font-bold tracking-wide">AI 智能预算建议</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 font-sans">
              基于您历史的消费模式，本期建议将「餐饮」配额上调 15%，同时在非必须的「购物」支出上控制 10% 配额，达到最优化财务平衡。
            </p>
            <button 
              onClick={applyAiRecommends}
              className="mt-2 self-start px-4.5 py-1.5 bg-white text-primary hover:bg-white/90 backdrop-blur-md rounded-full font-bold text-[11px] tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              立即应用
            </button>
          </div>
        </section>

        {/* Dynamic spendings execution bento widget */}
        <section className="bg-white rounded-[24px] p-6 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-bold text-gray-400 font-sans">本月总支出</h2>
              <p className="text-xs text-gray-500 font-medium font-sans mt-0.5">
                预算剩余: ¥{remainingBudgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              {editingTotal ? (
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    value={newTotalInput}
                    onChange={(e) => setNewTotalInput(e.target.value)}
                    className="w-24 px-2 py-1 border border-primary text-sm rounded-lg font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveTotal} className="p-1 bg-primary text-white rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingTotal(false)} className="p-1 bg-gray-100 text-gray-400 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <span className="text-2xl font-extrabold tracking-tight text-primary font-mono select-none">
                    ¥{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button 
                    onClick={() => {
                      setNewTotalInput(budget.total.toString());
                      setEditingTotal(true);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
                    title="修改预算总额"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="text-[10px] text-gray-400 font-sans font-semibold mt-0.5">
                总额 ¥{budget.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold font-sans">
              <span className="text-gray-400">总预算执行率</span>
              <span className={totalUsedPercent > 100 ? 'text-red-500' : 'text-primary'}>
                {totalUsedPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  totalUsedPercent > 100 ? 'bg-red-500 animate-pulse' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, totalUsedPercent)}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Suggested daily / overrun metrics */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[24px] p-5 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 font-bold">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[12px] text-gray-900 font-sans">今日建议</h3>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 font-mono tracking-tight">
                ¥{recommendedDaily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 font-sans mt-0.5">根据本期剩余天数精算</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-red-600 font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[12px] text-gray-900 font-sans">预计超支</h3>
            </div>
            <div>
              <p className={`text-lg font-bold font-mono tracking-tight ${totalExpense > budget.total ? 'text-red-500' : 'text-primary'}`}>
                ¥{Math.max(0, totalExpense - budget.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                {totalExpense > budget.total ? '已超出配额范围' : '本周预算情况极佳'}
              </p>
            </div>
          </div>
        </section>

        {/* Budgets breakdown details */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-[16px] text-gray-900 font-sans">预算详情</h3>
          </div>

          <div className="flex flex-col gap-3">
            {budget.categoryBudgets.map((cb) => {
              const spent = categorySpent[cb.category] || 0;
              const ratio = cb.amount > 0 ? (spent / cb.amount) * 100 : 0;
              const colorInfo = getCategoryColor(cb.category);
              const theme = getCategoryColor(cb.category);
              const isOver = ratio > 100;
              const isWarning = ratio >= 90 && ratio <= 100;

              return (
                <div 
                  key={cb.category} 
                  className={`bg-white rounded-[24px] p-4.5 border transition-all ${
                    isOver ? 'border-red-100 shadow-sm shadow-red-50/20' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${theme.bg} rounded-xl flex items-center justify-center shrink-0`}>
                        {getCategoryIcon(cb.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 font-sans">{cb.category}</h4>
                        <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                          已用 ¥{spent.toFixed(2)} /
                          {editingCategory === cb.category ? (
                            <span className="inline-flex items-center gap-1.5 ml-1">
                              <input 
                                type="number" 
                                value={newCatAmountInput}
                                onChange={(e) => setNewCatAmountInput(e.target.value)}
                                className="w-16 px-1 py-0.5 border border-primary text-[10px] rounded"
                              />
                              <button onClick={() => handleSaveCategoryBudget(cb.category)} className="p-0.5 bg-primary text-white rounded">
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={() => setEditingCategory(null)} className="p-0.5 bg-gray-100 text-gray-400 rounded">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 ml-0.5">
                              ¥{cb.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <button 
                                onClick={() => handleStartEditCategory(cb)}
                                className="p-0.5 text-gray-300 hover:text-gray-500 rounded cursor-pointer"
                                title="修改预算"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span className={`text-sm font-bold font-mono tracking-tight ${
                      isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-950'
                    }`}>
                      {ratio.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isOver ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-500' : colorInfo.bar
                      }`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
