import React, { useState, useEffect } from 'react';
import { Database, Key, Globe, CheckCircle2, Copy, RefreshCw, X, Code, ShieldCheck, ExternalLink, AlertTriangle, Activity } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, resetSupabaseConfig, checkSupabaseHealth, SupabaseHealthResult } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReseedData?: () => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

const FULL_SQL_SCHEMA = `-- ====================================================================
-- SCHOOL MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Execute this script in your Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  roll_number TEXT,
  gender TEXT,
  date_of_birth DATE,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  photo_url TEXT,
  address TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  username TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  assigned_classes JSONB DEFAULT '[]'::jsonb,
  qualification TEXT,
  joining_date DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL UNIQUE,
  section TEXT,
  room_number TEXT,
  capacity INT DEFAULT 40,
  class_teacher_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  grade_class TEXT NOT NULL,
  records JSONB NOT NULL DEFAULT '[]'::jsonb,
  marked_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCHOOL FEES (FEE STRUCTURES) TABLE
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_class TEXT UNIQUE NOT NULL,
  tuition_fee NUMERIC(10,2) DEFAULT 0,
  exam_fee NUMERIC(10,2) DEFAULT 0,
  transport_fee NUMERIC(10,2) DEFAULT 0,
  library_fee NUMERIC(10,2) DEFAULT 0,
  other_fee NUMERIC(10,2) DEFAULT 0,
  total_fee NUMERIC(10,2) DEFAULT 0,
  term TEXT DEFAULT 'Term 1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FEE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT DEFAULT 'Cash',
  fee_type TEXT DEFAULT 'Tuition Fee',
  transaction_ref TEXT,
  remarks TEXT,
  received_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  grade_classes JSONB DEFAULT '[]'::jsonb,
  subjects JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXAM RESULTS (GRADES) TABLE
CREATE TABLE IF NOT EXISTS public.exam_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  exam_title TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT,
  grade_class TEXT NOT NULL,
  subject_marks JSONB DEFAULT '{}'::jsonb,
  total_marks NUMERIC(10,2) DEFAULT 0,
  max_possible NUMERIC(10,2) DEFAULT 0,
  average NUMERIC(5,2) DEFAULT 0,
  grade TEXT DEFAULT 'F',
  position INT,
  result_status TEXT DEFAULT 'Pass',
  teacher_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USERS & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Teacher',
  status TEXT DEFAULT 'Active',
  teacher_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PARENT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  student_name TEXT,
  parent_phone TEXT NOT NULL,
  channel TEXT DEFAULT 'SMS',
  type TEXT DEFAULT 'Announcement',
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Delivered',
  sent_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TRASH / RECYCLE BIN TABLE
CREATE TABLE IF NOT EXISTS public.trash_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_collection TEXT NOT NULL,
  original_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_by TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trash_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access on students" ON public.students;
CREATE POLICY "Public access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on teachers" ON public.teachers;
CREATE POLICY "Public access on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on classes" ON public.classes;
CREATE POLICY "Public access on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on attendance" ON public.attendance;
CREATE POLICY "Public access on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on fee_structures" ON public.fee_structures;
CREATE POLICY "Public access on fee_structures" ON public.fee_structures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on fee_payments" ON public.fee_payments;
CREATE POLICY "Public access on fee_payments" ON public.fee_payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on exams" ON public.exams;
CREATE POLICY "Public access on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on exam_results" ON public.exam_results;
CREATE POLICY "Public access on exam_results" ON public.exam_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on users" ON public.users;
CREATE POLICY "Public access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on parent_notifications" ON public.parent_notifications;
CREATE POLICY "Public access on parent_notifications" ON public.parent_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on trash_items" ON public.trash_items;
CREATE POLICY "Public access on trash_items" ON public.trash_items FOR ALL USING (true) WITH CHECK (true);`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onReseedData,
  onConnectionStatusChange
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<SupabaseHealthResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  const runHealthCheck = async () => {
    setIsTesting(true);
    const res = await checkSupabaseHealth();
    setHealthResult(res);
    setIsTesting(false);
    if (onConnectionStatusChange) {
      onConnectionStatusChange(res.connected);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, key);
  };

  const handleReset = () => {
    if (confirm('Reset Supabase configuration to default settings?')) {
      resetSupabaseConfig();
    }
  };

  const copySqlScript = () => {
    navigator.clipboard.writeText(FULL_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              healthResult?.connected
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <span>Supabase Database Integration</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                  healthResult?.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {isTesting ? 'Testing...' : healthResult?.connected ? 'Connected' : 'Disconnected'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                School management data connected directly to PostgreSQL in Supabase Cloud.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'config'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Connection Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'sql'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Database SQL Schema</span>
          </button>
        </div>

        {activeTab === 'config' ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Live Connection Status Box */}
            {isTesting ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3 text-slate-700 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Verifying Supabase connection and database schema...</span>
              </div>
            ) : healthResult?.connected ? (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Connected & Healthy</span>
                  </div>
                  <button
                    type="button"
                    onClick={runHealthCheck}
                    className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center space-x-1"
                  >
                    <Activity className="w-3 h-3" />
                    <span>Test Again</span>
                  </button>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {healthResult.message}
                </p>
              </div>
            ) : healthResult?.tablesExist === false && healthResult?.isCustomConfigured ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tables Missing in Supabase Project</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {healthResult.message}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sql')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 transition-all"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>View & Copy SQL Schema</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Supabase Not Connected</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {healthResult?.message || 'Enter your Supabase Project URL and Public Anon API Key to connect.'}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-800 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Supabase Anon Public API Key</span>
              </label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-800 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
                >
                  Reset
                </button>
                {onReseedData && healthResult?.connected && (
                  <button
                    type="button"
                    onClick={onReseedData}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all inline-flex items-center space-x-1 border border-emerald-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Seed Initial Data</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={runHealthCheck}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all inline-flex items-center space-x-1"
                >
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>Test Connection</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                To create all required tables and permissions in Supabase, copy this SQL and run it in your{' '}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 underline font-bold inline-flex items-center space-x-1"
                >
                  <span>Supabase SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
              <button
                type="button"
                onClick={copySqlScript}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all inline-flex items-center space-x-1.5 border border-emerald-200 shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Complete SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 text-emerald-400 font-mono text-[11px] h-64 overflow-y-auto leading-relaxed border border-slate-800">
              <pre>{FULL_SQL_SCHEMA}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
