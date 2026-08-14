import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim() || !password) {
      setError('Fadlan, username-ka ama password-ka waa khaldan yahay.');
      return;
    }

    setLoading(true);
    try {
      await login(usernameOrEmail.trim(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Fadlan, username-ka ama password-ka waa khaldan yahay.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background subtle gradient glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50 mb-1">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            School Management System
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sign in with your username or email and password
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-rose-800 text-xs animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username or Email Address
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="login-username-input"
                type="text"
                required
                placeholder="e.g. anas or teacher1@school.edu"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with Supabase...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials / Testing Accounts */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Login Profiles (Demo Credentials)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* Admin anas / 123 */}
            <button
              id="quick-login-admin"
              type="button"
              onClick={() => handleQuickFill('anas', '123')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-purple-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin Account (Principal Anas)</span>
                </div>
                <div className="text-[10px] text-purple-700 font-mono mt-0.5">
                  Username: <span className="font-bold">anas</span> | Password: <span className="font-bold">123</span>
                </div>
              </div>
              <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded-lg font-bold group-hover:bg-purple-700">
                Use Login
              </span>
            </button>

            {/* Teacher marcus_v / TeacherPass123! */}
            <button
              id="quick-login-teacher"
              type="button"
              onClick={() => handleQuickFill('marcus_v', 'TeacherPass123!')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Teacher Account (Dr. Marcus)</span>
                </div>
                <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                  Username: <span className="font-bold">marcus_v</span> | Password: <span className="font-bold">TeacherPass123!</span>
                </div>
              </div>
              <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg font-bold group-hover:bg-blue-700">
                Use Login
              </span>
            </button>

            {/* Accountant john_s / AccountantPass123! */}
            <button
              id="quick-login-accountant"
              type="button"
              onClick={() => handleQuickFill('john_s', 'AccountantPass123!')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Accountant Account (John Sterling)</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                  Username: <span className="font-bold">john_s</span> | Password: <span className="font-bold">AccountantPass123!</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold group-hover:bg-emerald-700">
                Use Login
              </span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 font-medium">
          Protected by Supabase Auth (AES-256 Encrypted Sessions)
        </div>
      </div>
    </div>
  );
};
