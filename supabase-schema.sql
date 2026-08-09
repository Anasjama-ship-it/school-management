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
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth DATE,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  photo_url TEXT,
  address TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  subjects JSONB DEFAULT '[]'::jsonb,
  assigned_classes JSONB DEFAULT '[]'::jsonb,
  qualification TEXT,
  joining_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Resigned')),
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
  id TEXT PRIMARY KEY, -- e.g. "Grade10A_2026-08-09"
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
  status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXAM RESULTS (GRADES) TABLE
CREATE TABLE IF NOT EXISTS public.exam_results (
  id TEXT PRIMARY KEY, -- e.g. "examId_studentId"
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
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Teacher' CHECK (role IN ('Admin', 'Teacher', 'Accountant')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PARENT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  student_name TEXT,
  parent_phone TEXT NOT NULL,
  channel TEXT DEFAULT 'SMS' CHECK (channel IN ('SMS', 'WhatsApp')),
  type TEXT DEFAULT 'Announcement',
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Delivered' CHECK (status IN ('Delivered', 'Pending', 'Failed')),
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

-- Enable RLS on all tables
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

-- Allow public / authenticated access (with fallback policies)
DO $$
BEGIN
  -- Create permissive policies for application API access
  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.students FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.students FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.students FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.students FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.teachers FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.teachers FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.teachers FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.teachers FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.classes FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.classes FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.classes FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.classes FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.attendance FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.attendance FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.attendance FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.attendance FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.fee_structures FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.fee_structures FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.fee_structures FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.fee_structures FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.fee_payments FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.fee_payments FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.fee_payments FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.fee_payments FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.exams FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.exams FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.exams FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.exams FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.exam_results FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.exam_results FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.exam_results FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.exam_results FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.users FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.users FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.users FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.users FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.parent_notifications FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.parent_notifications FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.parent_notifications FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.parent_notifications FOR DELETE USING (true)';

  EXECUTE 'CREATE POLICY "Allow anon read all" ON public.trash_items FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon insert all" ON public.trash_items FOR INSERT WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon update all" ON public.trash_items FOR UPDATE USING (true)';
  EXECUTE 'CREATE POLICY "Allow anon delete all" ON public.trash_items FOR DELETE USING (true)';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
