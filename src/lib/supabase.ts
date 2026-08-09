import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase credentials from Env or LocalStorage
const getStoredCredentials = () => {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_custom_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_custom_key') : null;

  const url = localUrl || envUrl || 'https://school-management-demo.supabase.co';
  const key = localKey || envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaG9vbC1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.demoKeyForSchoolManagementSystem1234567890';

  return { url, key, isCustom: Boolean(localUrl || envUrl) };
};

const creds = getStoredCredentials();

export const supabase: SupabaseClient = createClient(creds.url, creds.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getSupabaseConfig = () => {
  return getStoredCredentials();
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_custom_url', url);
    localStorage.setItem('supabase_custom_key', key);
    window.location.reload();
  }
};

export const resetSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_custom_url');
    localStorage.removeItem('supabase_custom_key');
    window.location.reload();
  }
};

export default supabase;
