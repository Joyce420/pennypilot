import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Wallet } from 'lucide-react';

export function AuthView() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('请填写邮箱和密码'); return; }
    if (password.length < 6) { setError('密码至少 6 位'); return; }
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError('邮箱或密码错误，请重试');
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message.includes('already') ? '该邮箱已注册，请直接登录' : err.message);
      } else {
        setSuccess('注册成功！请检查邮箱点击验证链接，然后回来登录。');
        setMode('login');
      }
    }
    setLoading(false);
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 font-sans">PennyPilot</h1>
        <p className="text-gray-400 text-sm mt-1">智能记账，轻松管钱</p>
      </div>

      {/* Mode tab switcher */}
      <div className="w-full max-w-sm bg-gray-100 rounded-2xl p-1 flex mb-6">
        <button
          onClick={() => switchMode('login')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'login' ? 'bg-white shadow text-gray-800' : 'text-gray-400'
          }`}
        >
          登录
        </button>
        <button
          onClick={() => switchMode('register')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'register' ? 'bg-white shadow text-gray-800' : 'text-gray-400'
          }`}
        >
          注册
        </button>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="至少 6 位"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        {success && <p className="text-emerald-600 text-xs px-1">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? '登录' : '创建账号'}
        </button>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center max-w-xs leading-relaxed">
        登录即代表您同意 PennyPilot 服务条款与隐私政策
      </p>
    </div>
  );
}
