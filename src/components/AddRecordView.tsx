import React, { useState, useEffect } from 'react';
import { 
  X, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Gamepad2, 
  Home, 
  HeartPulse, 
  Briefcase, 
  HelpCircle,
  Calendar,
  Sparkles,
  Check,
  Tag
} from 'lucide-react';
import { Transaction, TransactionType, Category, PaymentMethod } from '../types';

interface AddRecordViewProps {
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AddRecordView: React.FC<AddRecordViewProps> = ({
  onClose,
  onSave,
}) => {
  const todayDate = formatLocalDate(new Date());
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('餐饮');
  const [payment, setPayment] = useState<string>('支付宝');
  const [date, setDate] = useState<string>(todayDate);
  const [note, setNote] = useState<string>('');
  const [aiSuggestCategory, setAiSuggestCategory] = useState<string | null>(null);

  // Available categories definition
  const categoriesList: { name: string; icon: string; theme: string }[] = [
    { name: '餐饮', icon: 'restaurant', theme: 'bg-orange-50 text-orange-600 ring-orange-400' },
    { name: '交通', icon: 'commute', theme: 'bg-blue-50 text-blue-600 ring-blue-400' },
    { name: '购物', icon: 'shopping', theme: 'bg-purple-50 text-purple-600 ring-purple-400' },
    { name: '娱乐', icon: 'sports_esports', theme: 'bg-pink-50 text-pink-600 ring-pink-400' },
    { name: '住房', icon: 'home', theme: 'bg-amber-50 text-amber-600 ring-amber-400' },
    { name: '医疗', icon: 'medical_services', theme: 'bg-teal-50 text-teal-600 ring-teal-400' },
    { name: '工资', icon: 'payments', theme: 'bg-emerald-50 text-primary ring-emerald-400' },
    { name: '其他', icon: 'category', theme: 'bg-gray-50 text-gray-600 ring-gray-400' },
  ];

  const paymentMethodsList: { name: string; type: string }[] = [
    { name: '支付宝', type: 'alipay' },
    { name: '微信支付', type: 'wechat' },
    { name: '银行卡', type: 'card' },
    { name: '现金', type: 'cash' },
  ];

  const quickTags = ['午餐', '打车', '买菜', '咖啡', '网购', '发工资'];
  const setSafeRecordDate = (nextDate: string) => {
    if (!nextDate) return;
    setDate(nextDate > todayDate ? todayDate : nextDate);
  };

  // Categorize icons helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'restaurant':
        return <Utensils className="w-5 h-5" />;
      case 'commute':
        return <Car className="w-5 h-5" />;
      case 'shopping':
        return <ShoppingBag className="w-5 h-5" />;
      case 'sports_esports':
        return <Gamepad2 className="w-5 h-5" />;
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'medical_services':
        return <HeartPulse className="w-5 h-5" />;
      case 'payments':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  // Real-time local AI evaluation based on typed note/remarks
  useEffect(() => {
    const text = note.trim();
    if (!text) {
      setAiSuggestCategory(null);
      return;
    }

    if (text.includes('吃') || text.includes('饭') || text.includes('面') || text.includes('餐') || text.includes('外卖') || text.includes('菜') || text.includes('咖啡')) {
      setAiSuggestCategory('餐饮');
    } else if (text.includes('车') || text.includes('地铁') || text.includes('公交') || text.includes('打车') || text.includes('加油') || text.includes('代步')) {
      setAiSuggestCategory('交通');
    } else if (text.includes('买') || text.includes('淘宝') || text.includes('裙') || text.includes('鞋') || text.includes('淘宝') || text.includes('拼多多') || text.includes('京东')) {
      setAiSuggestCategory('购物');
    } else if (text.includes('玩') || text.includes('游戏') || text.includes('电影') || text.includes('桌游') || text.includes('网吧')) {
      setAiSuggestCategory('娱乐');
    } else if (text.includes('租') || text.includes('房') || text.includes('电') || text.includes('水') || text.includes('物业')) {
      setAiSuggestCategory('住房');
    } else if (text.includes('药') || text.includes('医') || text.includes('挂号') || text.includes('针')) {
      setAiSuggestCategory('医疗');
    } else if (text.includes('资') || text.includes('副业') || text.includes('赚') || text.includes('兼职')) {
      setAiSuggestCategory('工资');
    } else {
      setAiSuggestCategory(null);
    }
  }, [note]);

  const handleApplyAiCategory = () => {
    if (aiSuggestCategory) {
      setCategory(aiSuggestCategory);
      setAiSuggestCategory(null);
    }
  };

  // Append clicked tags seamlessly
  const handleTagClick = (tag: string) => {
    if (tag === '发工资') {
      setType('income');
      setCategory('工资');
    } else if (tag === '打车') {
      setType('expense');
      setCategory('交通');
    } else if (tag === '午餐' || tag === '咖啡' || tag === '买菜') {
      setType('expense');
      setCategory('餐饮');
    } else if (tag === '网购') {
      setType('expense');
      setCategory('购物');
    }

    setNote((prev) => (prev ? prev + ' · ' + tag : tag));
  };

  const handleSaveExpense = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('请输入合法的记账金额！');
      return;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    onSave({
      amount: val,
      note: note || category,
      category,
      payment,
      date,
      time: timeStr,
      type
    });
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAF9] z-[100] flex flex-col justify-between overflow-y-auto no-scrollbar pb-10">
      {/* Header */}
      <header className="sticky top-0 bg-[#F8FAF9] flex justify-between items-center px-5 h-16 w-full max-w-md mx-auto z-10 border-b border-gray-100/40">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-gray-900 font-sans tracking-tight">记一笔</h1>
        <div className="w-9 h-9"></div> {/* Balancer spacer */}
      </header>

      {/* Primary form wrapper */}
      <main className="flex-1 max-w-md mx-auto w-full px-5 space-y-6 pt-2">
        {/* Type Switcher Segmented bar */}
        <div className="bg-gray-100/80 p-1.5 rounded-2xl flex items-center h-12.5 relative shadow-inner">
          <button 
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 h-full rounded-xl text-xs font-bold font-sans tracking-wide transition-all duration-300 ${
              type === 'expense' 
                ? 'bg-white text-primary shadow-md shadow-gray-200/50' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            支出
          </button>
          <button 
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 h-full rounded-xl text-xs font-bold font-sans tracking-wide transition-all duration-300 ${
              type === 'income' 
                ? 'bg-white text-primary shadow-md shadow-gray-200/50' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            收入
          </button>
        </div>

        {/* Big Amount Editor Box */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0px_4px_24px_rgba(0,0,0,0.02)] flex flex-col items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-sans">输入金额 (元)</span>
          <div className="flex items-center justify-center font-mono w-full">
            <span className="text-3xl font-extrabold text-primary mr-1 relative -top-0.5 select-none">¥</span>
            <input 
              type="number" 
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-center font-extrabold text-4xl w-full border-none outline-none focus:ring-0 text-gray-900 bg-transparent py-1.5 placeholder:text-gray-200"
              autoFocus
            />
          </div>
        </div>

        {/* Selected category meshes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 font-sans flex items-center gap-1"> 选择分类 </h3>
          <div className="grid grid-cols-4 gap-y-5 gap-x-3.5 bg-white p-5 rounded-[24px] border border-gray-100 shadow-[0px_4px_24px_rgba(0,0,0,0.01)]">
            {categoriesList.map((cat) => {
              const selected = category === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-95"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                    selected 
                      ? `${cat.theme} scale-105 ring-4 ring-primary/10 border-primary font-bold` 
                      : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                  }`}>
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <span className={`text-[10px] font-sans ${selected ? 'text-primary font-extrabold' : 'text-gray-500 font-semibold'}`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic AI classification Recommendation helper banner */}
        {aiSuggestCategory && aiSuggestCategory !== category && (
          <div 
            onClick={handleApplyApplyCategory}
            className="bg-primary-light p-3.5 rounded-2xl border border-primary/10 flex items-center gap-2.5 cursor-pointer hover:bg-primary/10 transition-all select-none animate-pulse"
          >
            <Sparkles className="w-4.5 h-4.5 text-primary shrink-0" />
            <p className="text-[11.5px] text-primary font-medium leading-normal">
              AI 智能推荐：检测到备注，建议将分类瞬移到 <span className="font-extrabold underline ml-0.5">“{aiSuggestCategory}”</span>（戳这立即转换）
            </p>
          </div>
        )}

        {/* Secondary options group (Date, Payment methods) */}
        <div className="space-y-4 pt-1">
          {/* Quick Date Select Widget row */}
          <div className="py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-gray-500">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-xs font-bold text-gray-700 font-sans">记账日期</span>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">默认今天，可补记过去日期</p>
                </div>
              </div>
              <div className="relative">
                <input 
                  type="date"
                  value={date}
                  max={todayDate}
                  onChange={(e) => setSafeRecordDate(e.target.value)}
                  className="text-xs font-bold text-primary bg-primary-light hover:bg-primary/15 transition-all text-center border-none outline-none focus:ring-0 rounded-full px-3 py-1 font-mono hover:cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Payment chips horizontal scroll */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-900 font-sans">支付方式</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {paymentMethodsList.map((pay) => {
                const active = payment === pay.name;
                return (
                  <button
                    key={pay.name}
                    type="button"
                    onClick={() => setPayment(pay.name)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                      active 
                        ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/10' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {pay.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note custom text entry area */}
          <div className="space-y-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-4.5 shadow-[0px_4px_24px_rgba(0,0,0,0.01)]">
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="在此添加记明细备注 (例: 午餐麦当劳、打车回家)..."
                rows={2}
                className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-sans placeholder:text-gray-400 text-gray-800 resize-none font-medium leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* Quick Click Common tags collection */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-bold text-gray-900 font-sans flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>智能快捷标签</span>
            </h3>
            <div className="flex flex-wrap gap-2 pb-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-55 text-[10px] text-gray-550 font-bold transition-all cursor-pointer active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating full-width Save Trigger bottom widget */}
      <div className="px-5 max-w-md mx-auto w-full mt-4">
        <button 
          onClick={handleSaveExpense}
          className="w-full h-13.5 bg-primary hover:bg-primary/95 text-white active:scale-[0.98] transition-all font-bold text-xs tracking-wider rounded-2xl shadow-xl shadow-primary/25 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>保存本笔记录</span>
        </button>
      </div>
    </div>
  );

  // Helper variable callback to make self-applying readable
  function handleApplyApplyCategory() {
    handleApplyAiCategory();
  }
};
