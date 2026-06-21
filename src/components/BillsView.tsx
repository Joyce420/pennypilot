import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  HeartPulse,
  Briefcase,
  HelpCircle,
  Trash2,
  Check,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import { Transaction } from '../types';

const getCurrentMonthYear = (): string => {
  const d = new Date();
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
};

interface BillsViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  budgetTotal: number;
  totalExpense: number;
}

export const BillsView: React.FC<BillsViewProps> = ({
  transactions,
  onDeleteTransaction,
  budgetTotal,
  totalExpense,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('全部');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthYear);
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const monthPickerRef = useRef<HTMLDivElement | null>(null);

  // Month navigation helpers
  const parseMonthStr = (s: string): { year: number; month: number } => {
    const m = s.match(/(\d{4})年(\d{2})月/);
    if (!m) { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1 }; }
    return { year: parseInt(m[1]), month: parseInt(m[2]) };
  };

  const fmtMonthYear = (year: number, month: number): string =>
    `${year}年${String(month).padStart(2, '0')}月`;

  const goToPrevMonth = () => {
    const { year, month } = parseMonthStr(selectedMonth);
    setSelectedMonth(month === 1 ? fmtMonthYear(year - 1, 12) : fmtMonthYear(year, month - 1));
  };

  const goToNextMonth = () => {
    const { year, month } = parseMonthStr(selectedMonth);
    setSelectedMonth(month === 12 ? fmtMonthYear(year + 1, 1) : fmtMonthYear(year, month + 1));
  };

  useEffect(() => {
    const handlePopState = () => setIsExpanded(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!showMonthDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthPickerRef.current &&
        !monthPickerRef.current.contains(event.target as Node)
      ) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthDropdown]);

  const handleOpenAllBills = () => {
    window.history.pushState({ isExpandedBills: true }, '');
    setIsExpanded(true);
  };

  const handleCloseAllBills = () => {
    setSearchQuery('');
    if (isExpanded) {
      window.history.back();
    } else {
      setIsExpanded(false);
    }
  };

  const filterChips = ['全部', '餐饮', '购物', '交通', '工资', '其他'];

  const monthTransactions = transactions.filter((tx) => {
    const [y, mo] = tx.date.split('-');
    return `${y}年${mo}月` === selectedMonth;
  });

  const sortedMonthDates = Array.from(
    new Set<string>(monthTransactions.map((tx) => tx.date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getBillsData = (showAll: boolean) => {
    const targetDates = showAll ? sortedMonthDates : sortedMonthDates.slice(0, 3);
    let filtered = monthTransactions.filter((tx) => targetDates.includes(tx.date));

    // Category filter
    if (selectedFilter !== '全部') {
      filtered = filtered.filter((tx) => {
        if (selectedFilter === '餐饮') return ['餐饮', '饮食', '餐饮美食'].includes(tx.category);
        if (selectedFilter === '购物') return ['购物', '花费', '购物消费'].includes(tx.category);
        if (selectedFilter === '交通') return ['交通', '交通出行'].includes(tx.category);
        if (selectedFilter === '工资') return ['工资', '收入'].includes(tx.category);
        if (selectedFilter === '其他') return !['餐饮', '交通', '购物', '工资'].includes(tx.category);
        return tx.category === selectedFilter;
      });
    }

    // Search filter (note, category, payment)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((tx) =>
        (tx.note || '').toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.payment.toLowerCase().includes(q)
      );
    }

    // Group by date label
    const grouped: Record<string, Transaction[]> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const yesterdayStr = yd.toISOString().split('T')[0];

    filtered.forEach((tx) => {
      const [, mo, dd] = tx.date.split('-');
      let label = `${mo}月${dd}日`;
      if (tx.date === todayStr) label += ' 今天';
      else if (tx.date === yesterdayStr) label += ' 昨天';
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(tx);
    });

    const sorted = Object.keys(grouped).sort((a, b) => {
      const tA = grouped[a][0], tB = grouped[b][0];
      return new Date(`${tB.date}T${tB.time}`).getTime() - new Date(`${tA.date}T${tA.time}`).getTime();
    });

    return { grouped, sorted };
  };

  const mainListData = getBillsData(false);
  const fullListData = getBillsData(true);
  const groupedTransactions = mainListData.grouped;
  const sortedDates = mainListData.sorted;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '餐饮': case '饮食': case '餐饮美食': return <Utensils className="w-5 h-5" />;
      case '交通': case '出行': case '交通出行': return <Car className="w-5 h-5" />;
      case '购物': case '消费': case '购物消费': return <ShoppingBag className="w-5 h-5" />;
      case '娱乐': case '休闲': case '休闲娱乐': return <Gamepad2 className="w-5 h-5" />;
      case '住房': case '居家': return <Home className="w-5 h-5" />;
      case '医疗': case '健康': return <HeartPulse className="w-5 h-5" />;
      case '工资': case '收入': case '兼职': return <Briefcase className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case '餐饮': case '饮食': case '餐饮美食': return { bg: 'bg-orange-100 text-orange-600' };
      case '交通': case '出行': case '交通出行': return { bg: 'bg-blue-100 text-blue-600' };
      case '购物': case '消费': case '购物消费': return { bg: 'bg-purple-100 text-purple-600' };
      case '娱乐': case '休闲': case '休闲娱乐': return { bg: 'bg-pink-100 text-pink-600' };
      case '住房': case '居家': return { bg: 'bg-amber-100 text-amber-600' };
      case '医疗': case '健康': return { bg: 'bg-teal-100 text-teal-600' };
      case '工资': case '收入': case '兼职': return { bg: 'bg-emerald-100 text-primary' };
      default: return { bg: 'bg-gray-100 text-gray-600' };
    }
  };

  const getGroupTotals = (txs: Transaction[]) => {
    let exp = 0, inc = 0;
    txs.forEach((tx) => { if (tx.type === 'expense') exp += tx.amount; else inc += tx.amount; });
    return { exp, inc };
  };

  const availableMonths = Array.from(
    new Set(transactions.map((tx) => { const [y, mo] = tx.date.split('-'); return `${y}年${mo}月`; }))
  );
  const currentMonthYear = getCurrentMonthYear();
  if (!availableMonths.includes(currentMonthYear)) availableMonths.push(currentMonthYear);

  const monthExpense = monthTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const monthIncome = monthTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const budgetRemaining = budgetTotal - monthExpense;
  const budgetRatio = budgetTotal > 0 ? Math.max(0, Math.min(100, (budgetRemaining / budgetTotal) * 100)) : 0;

  // Shared transaction row renderer
  const renderTxRow = (tx: Transaction, index: number, showDelete = true) => {
    const theme = getCategoryTheme(tx.category);
    const isIncome = tx.type === 'income';
    return (
      <div key={tx.id}>
        {index > 0 && <div className="mx-4 h-[1px] bg-gray-50"></div>}
        <div className="group flex items-center justify-between p-4 hover:bg-gray-50/55 transition-all">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 ${theme.bg} rounded-xl flex items-center justify-center shrink-0`}>
              {getCategoryIcon(tx.category)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 font-sans">{tx.note || tx.category}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-gray-400 font-sans">{tx.time}</span>
                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                <span className="text-[11px] text-gray-400 font-sans">{tx.payment}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className={`text-sm font-bold font-mono tracking-tight ${isIncome ? 'text-primary' : 'text-gray-950'}`}>
              {isIncome ? '+' : '-'}{tx.amount.toFixed(2)}
            </p>
            {showDelete && (
              <button
                onClick={() => onDeleteTransaction(tx.id)}
                className="p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all"
                title="删除记录"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-10 animate-fade-in">

      {/* ── 全部账单 全屏覆盖层 ── */}
      {isExpanded && (
        <div className="fixed inset-0 bg-[#F8FAF9] z-[100] flex flex-col overflow-y-auto no-scrollbar pb-12 animate-fade-in">

          {/* Header with month navigation */}
          <header className="sticky top-0 bg-[#F8FAF9]/90 backdrop-blur-md z-40 border-b border-gray-100/40">
            <div className="flex justify-between items-center px-5 h-16 w-full max-w-md mx-auto">
              <button
                onClick={handleCloseAllBills}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-700 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Month prev/next */}
              <div className="flex items-center gap-1">
                <button onClick={goToPrevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-gray-900 font-sans min-w-[7rem] text-center">{selectedMonth}</span>
                <button onClick={goToNextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-9 h-9" />
            </div>
          </header>

          <main className="px-5 space-y-4 max-w-md mx-auto w-full flex-grow mt-2">

            {/* Monthly stats */}
            <section className="bg-white rounded-[24px] p-5 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-900">{selectedMonth}</span>
                <span className="text-[10px] font-bold text-gray-400 font-sans">本月账单汇总</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-400 font-sans mb-0.5">本月支出</p>
                  <p className="text-lg font-extrabold text-red-500 font-mono">
                    -¥{monthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-sans mb-0.5">本月收入</p>
                  <p className="text-lg font-extrabold text-primary font-mono">
                    +{monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </section>

            {/* Search box */}
            <section className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索备注、分类、支付方式…"
                className="w-full pl-10 pr-9 py-2.5 rounded-full border border-gray-200 bg-white text-xs font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </section>

            {/* Filter chips */}
            <section className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {filterChips.map((chip) => {
                const active = selectedFilter === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => setSelectedFilter(chip)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                      active
                        ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/10'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {chip === '全部' ? '全部' : chip + (chip === '工资' ? '收入' : '支出')}
                  </button>
                );
              })}
            </section>

            {/* All bills list */}
            <section className="space-y-6">
              {fullListData.sorted.length === 0 ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                  <CalendarDays className="w-10 h-10 text-gray-300 mb-1" />
                  <p className="text-sm font-medium font-sans">
                    {searchQuery ? `没有匹配"${searchQuery}"的记录` : '没有对应期间的账单记录哦'}
                  </p>
                </div>
              ) : (
                fullListData.sorted.map((dateStr) => {
                  const list = fullListData.grouped[dateStr];
                  const totals = getGroupTotals(list);
                  return (
                    <div key={dateStr} className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-bold text-gray-900 font-sans">{dateStr}</h3>
                        <div className="flex gap-3 text-[10px] font-semibold text-gray-400 font-sans">
                          {totals.exp > 0 && <span>支出: ¥{totals.exp.toFixed(2)}</span>}
                          {totals.inc > 0 && <span className="text-primary">收入: ¥{totals.inc.toFixed(2)}</span>}
                        </div>
                      </div>
                      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0px_4px_24px_rgba(0,0,0,0.01)] overflow-hidden">
                        {list.map((tx, idx) => renderTxRow(tx, idx))}
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCloseAllBills}
                className="px-6 py-2.5 rounded-full border border-gray-200 bg-white text-primary hover:bg-primary-light hover:border-primary/20 text-xs font-bold transition-all shadow-[0px_2px_8px_rgba(0,0,0,0.015)] active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                返回账单主页
              </button>
            </div>

            <div className="py-8 text-center text-gray-300">
              <p className="text-[11px] font-bold font-sans tracking-wide">没有更多账单记录了 · PennyPilot</p>
            </div>
          </main>
        </div>
      )}

      {/* ── 账单主页 ── */}
      <header className="sticky top-0 bg-[#F8FAF9]/90 backdrop-blur-md z-40">
        <div className="flex justify-between items-center px-5 h-16 w-full max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">账单明细</h1>
        </div>
      </header>

      <main className="px-5 space-y-5 max-w-md mx-auto">

        {/* Month picker & overview card */}
        <section className="bg-white rounded-[24px] p-5 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-gray-100 relative">
          <div className="flex items-center justify-between mb-4">
            <div ref={monthPickerRef} className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-1.5 bg-primary-light hover:bg-primary/10 px-3.5 py-1.5 rounded-full transition-all text-primary font-bold text-xs"
              >
                <span>{selectedMonth}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showMonthDropdown && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 shadow-xl rounded-2xl p-2 z-50 w-36 py-2 overflow-hidden animate-slide-up">
                  {availableMonths.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(m); setShowMonthDropdown(false); setIsExpanded(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-gray-50 flex items-center justify-between font-medium text-gray-800"
                    >
                      <span>{m}</span>
                      {selectedMonth === m && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold text-gray-400 font-sans">本月统计</span>
          </div>

          <div className="flex justify-between items-end mb-5">
            <div>
              <p className="text-[11px] text-gray-400 font-sans mb-1">月支出 (元)</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-mono">
                {monthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 font-sans mb-1">月收入</p>
              <p className="text-[15px] font-bold text-primary font-mono select-none">
                +{monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400 font-sans font-medium">
                预算剩余 ({budgetRatio.toFixed(0)}%)
              </span>
              <span className={`text-xs font-bold font-mono ${budgetRemaining < 0 ? 'text-red-500' : 'text-primary'}`}>
                ¥{budgetRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${budgetRemaining < 0 ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${budgetRatio}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Filter chips */}
        <section className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {filterChips.map((chip) => {
            const active = selectedFilter === chip;
            return (
              <button
                key={chip}
                onClick={() => setSelectedFilter(chip)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                  active
                    ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/10'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {chip === '全部' ? '全部' : chip + (chip === '工资' ? '收入' : '支出')}
              </button>
            );
          })}
        </section>

        {/* Grouped list (last 3 days) */}
        <section className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <CalendarDays className="w-10 h-10 text-gray-300 mb-1" />
              <p className="text-sm font-medium font-sans">没有对应期间的账单记录哦</p>
            </div>
          ) : (
            sortedDates.map((dateStr) => {
              const list = groupedTransactions[dateStr];
              const totals = getGroupTotals(list);
              return (
                <div key={dateStr} className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-bold text-gray-900 font-sans">{dateStr}</h3>
                    <div className="flex gap-3 text-[10px] font-semibold text-gray-400 font-sans">
                      {totals.exp > 0 && <span>支出: ¥{totals.exp.toFixed(2)}</span>}
                      {totals.inc > 0 && <span className="text-primary">收入: ¥{totals.inc.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0px_4px_24px_rgba(0,0,0,0.01)] overflow-hidden">
                    {list.map((tx, idx) => renderTxRow(tx, idx))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* "查看全部账单" — only when there are more than 3 days */}
        {sortedMonthDates.length > 3 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleOpenAllBills}
              className="px-6 py-2.5 rounded-full border border-gray-200 bg-white text-primary hover:bg-primary-light hover:border-primary/20 text-xs font-bold transition-all shadow-[0px_2px_8px_rgba(0,0,0,0.015)] active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              查看全部账单
            </button>
          </div>
        )}

        <div className="py-8 text-center text-gray-300">
          <p className="text-[11px] font-bold font-sans tracking-wide">没有更多账单记录了 · PennyPilot</p>
        </div>
      </main>
    </div>
  );
};
