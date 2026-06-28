import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Bot,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  HeartPulse,
  Briefcase,
  HelpCircle,
  PlusCircle,
  Plus,
} from 'lucide-react';
import { Transaction } from '../types';

interface HomeViewProps {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  budgetTotal: number;
  onNavigate: (tab: 'home' | 'bills' | 'budget' | 'ai') => void;
  onOpenAdd: () => void;
  onLogout: () => void;
  userEmail: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  transactions,
  totalIncome,
  totalExpense,
  balance,
  budgetTotal,
  onNavigate,
  onOpenAdd,
  onLogout,
  userEmail,
}) => {
  // Get recent 3 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
    .slice(0, 3);

  // Helper helper to get icon component based on category name
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

  // Helper helper to get icon bg-colors
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case '餐饮':
      case '饮食':
      case '餐饮美食':
        return { bg: 'bg-orange-100 text-orange-600' };
      case '交通':
      case '出行':
      case '交通出行':
        return { bg: 'bg-blue-100 text-blue-600' };
      case '购物':
      case '消费':
      case '购物消费':
        return { bg: 'bg-purple-100 text-purple-600' };
      case '娱乐':
      case '休闲':
      case '休闲娱乐':
        return { bg: 'bg-pink-100 text-pink-600' };
      case '住房':
      case '居家':
        return { bg: 'bg-amber-100 text-amber-600' };
      case '医疗':
      case '健康':
        return { bg: 'bg-teal-100 text-teal-600' };
      case '工资':
      case '收入':
      case '兼职':
        return { bg: 'bg-emerald-100 text-primary' };
      default:
        return { bg: 'bg-gray-100 text-gray-600' };
    }
  };

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  const localDateStr = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  };

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i) + weekOffset * 7);
    const dateString = localDateStr(d);
    const amount = transactions
      .filter((tx) => tx.date === dateString && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { date: dateString, label: weekdays[d.getDay()], amount };
  });

  // Date range label for the header
  const rangeStart = last7DaysData[0].date.slice(5).replace('-', '/');
  const rangeEnd = last7DaysData[6].date.slice(5).replace('-', '/');
  const rangeLabel = weekOffset === 0 ? '近7日' : `${rangeStart} - ${rangeEnd}`;

  const maxSpent = Math.max(...last7DaysData.map((d) => d.amount), 0);
  const trendPoints = last7DaysData.map((dayData) => {
    let ht = '4%';
    if (maxSpent > 0 && dayData.amount > 0) {
      const pct = 16 + (dayData.amount / maxSpent) * 74;
      ht = `${pct.toFixed(0)}%`;
    }
    return { ...dayData, heightStyle: ht };
  });

  const formatTrendAmount = (amt: number) => {
    if (amt === 0) return '¥0';
    if (amt >= 1000) {
      return `¥${(amt / 1000).toFixed(1)}k`;
    }
    return `¥${Math.round(amt)}`;
  };

  // Smart insights message based on actual spending ratio
  const spendRatio = budgetTotal > 0 ? (totalExpense / budgetTotal) * 100 : 0;
  let insightText = "支出提示：本月财务状况良好，暂无过度支出警报，请继续保持哦！";
  if (spendRatio > 100) {
    insightText = "支出预警：本月总支出已超出设定的预算阀值，AI 财务小助手建议紧急削减非刚性支出。";
  } else if (spendRatio > 90) {
    insightText = "支出警报：当前总预算使用进度已达到 90%，要极力控制本周的购物与餐饮支出。";
  } else if (spendRatio > 70) {
    insightText = "支出温馨提示：本页总预算已消耗超过 70%，其中餐饮服务占比稍高，可适当克制外卖哦。";
  }

  return (
    <div className="pb-10 animate-fade-in">
      <header className="sticky top-0 bg-[#F8FAF9]/90 backdrop-blur-md z-40">
        <div className="flex justify-between items-center px-5 h-16 w-full max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary tracking-tight font-sans">PennyPilot</h1>
          </div>
          <button
            onClick={onLogout}
            title={userEmail}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors text-xs font-bold"
          >
            退
          </button>
        </div>
      </header>

      <main className="px-5 space-y-5 max-w-md mx-auto">
        {/* Bento Balance Card */}
        <section className="relative overflow-hidden rounded-[24px] bg-primary-container p-6 text-white shadow-xl shadow-primary-container/15">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-xs font-medium text-white/80 mb-1.5 font-sans whitespace-nowrap">本月结余 (元)</p>
            <h2 className="text-4xl font-bold tracking-tight mb-6 font-mono">
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
              <div>
                <p className="text-[11px] text-white/70 font-sans mb-0.5">本月累积收入</p>
                <p className="text-lg font-bold font-mono text-emerald-100">
                  +{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="text-[11px] text-white/70 font-sans mb-0.5">本月累积支出</p>
                <p className="text-lg font-bold font-mono text-amber-100">
                  -{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Insight banner */}
        <section className="bg-primary-light p-4 rounded-2xl flex items-start gap-3 border border-primary/10 transition-all">
          <div className="bg-primary p-2.5 rounded-xl shrink-0 text-white mt-0.5 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-primary font-semibold font-sans mb-0.5 flex items-center gap-1.5">
              <span>Penny 预算助理</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </p>
            <p className="text-xs text-primary/90 leading-relaxed font-sans">
              {insightText}
            </p>
          </div>
        </section>

        {/* 7-Day Trend columns */}
        <section className="bg-white p-5 rounded-[24px] shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
              <h3 className="font-bold text-[16px] text-gray-900 font-sans">支出趋势</h3>
            </div>
            <div className="flex items-center gap-1">
              {weekOffset < 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full mr-1"
                >
                  今
                </button>
              )}
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-gray-400 font-sans px-2 py-1 bg-gray-50 rounded-full min-w-[4.5rem] text-center">
                {rangeLabel}
              </span>
              <button
                onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
                className={`p-1 rounded-full transition-all ${weekOffset < 0 ? 'hover:bg-gray-100 text-gray-400' : 'text-gray-200 cursor-not-allowed'}`}
                disabled={weekOffset >= 0}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-36 flex items-end justify-between gap-3 px-1">
            {trendPoints.map((point, ix) => {
              const isActive = maxSpent > 0 ? point.amount === maxSpent : ix === 6;
              return (
                <div key={point.date + ix} className="flex flex-col items-center flex-1 group relative">
                  {/* Dynamic amount label displayed above each bar */}
                  <div className="h-5 flex items-end justify-center mb-1 select-none">
                    <span className="text-[9px] font-extrabold font-mono text-gray-400 group-hover:text-primary group-hover:scale-105 transition-all duration-200 whitespace-nowrap">
                      {formatTrendAmount(point.amount)}
                    </span>
                  </div>

                  <div className="w-full relative h-[80px] flex items-end">
                    <div 
                      className={`w-full rounded-t-[6px] transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary shadow-sm shadow-primary/25' 
                          : 'bg-primary-light hover:bg-primary/30'
                      }`}
                      style={{ height: point.heightStyle }}
                      title={`${point.date}: ¥${point.amount.toFixed(2)}`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 font-sans mt-1.5">{point.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-[16px] text-gray-900 font-sans">最近账单</h3>
            <button 
              onClick={() => onNavigate('bills')}
              className="text-primary text-xs font-bold hover:underline py-1 flex items-center gap-0.5"
            >
              <span>查看全部</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="bg-white text-center py-8 rounded-2xl border border-gray-100 text-gray-400 text-sm">
                目前还没有账单，快戳底栏的 + 记一笔吧！
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const theme = getCategoryTheme(tx.category);
                const isIncome = tx.type === 'income';
                return (
                  <div 
                    key={tx.id} 
                    className="bg-white flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all hover:shadow-md hover:shadow-gray-100/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 ${theme.bg} rounded-xl flex items-center justify-center shrink-0`}>
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 font-sans">{tx.note || tx.category}</p>
                        <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                          {tx.date === new Date().toISOString().split('T')[0] ? '今天' : tx.date} {tx.time} · {tx.payment}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold font-mono tracking-tight ${isIncome ? 'text-primary' : 'text-gray-950'}`}>
                      {isIncome ? '+' : '-'}{tx.amount.toFixed(2)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
