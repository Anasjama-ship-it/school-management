-- ====================================================================
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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable Row Level Security on all tables
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

-- Allow public read & write access for application client operations
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
CREATE POLICY "Public access on trash_items" ON public.trash_items FOR ALL USING (true) WITH CHECK (true);
