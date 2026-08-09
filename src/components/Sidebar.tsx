import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  School,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSeedData?: () => void;
  isSeeding?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const { activeRole, switchRole, hasRole } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Teacher', 'Accountant'] as UserRole[]
    },
    {
      id: 'students',
      label: 'Students',
      icon: GraduationCap,
      roles: ['Admin', 'Teacher', 'Accountant'] as UserRole[]
    },
    {
      id: 'teachers',
      label: 'Teachers',
      icon: Users,
      roles: ['Admin'] as UserRole[]
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      roles: ['Admin', 'Teacher'] as UserRole[]
    },
    {
      id: 'fees',
      label: 'School Fees',
      icon: CreditCard,
      roles: ['Admin', 'Accountant'] as UserRole[]
    },
    {
      id: 'exams',
      label: 'Exams & Grades',
      icon: FileSpreadsheet,
      roles: ['Admin', 'Teacher'] as UserRole[]
    },
    {
      id: 'notifications',
      label: 'Parent SMS/WhatsApp',
      icon: MessageSquare,
      roles: ['Admin', 'Teacher', 'Accountant'] as UserRole[]
    },
    {
      id: 'users',
      label: 'Users & Roles',
      icon: ShieldCheck,
      roles: ['Admin'] as UserRole[]
    },
    {
      id: 'trash',
      label: 'Trash / Recycle Bin',
      icon: Trash2,
      roles: ['Admin'] as UserRole[]
    }
  ];

  const filteredItems = navItems.filter(item => hasRole(item.roles));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* School Branding */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-snug">
                Springfield Academy
              </h1>
              <p className="text-[11px] text-blue-400 font-medium">School Portal</p>
            </div>
          </div>

          <button
            id="close-mobile-sidebar-btn"
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher Widget */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Current Active Role
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                activeRole === 'Admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : activeRole === 'Teacher'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {activeRole}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1">
            {(['Admin', 'Teacher', 'Accountant'] as UserRole[]).map((role) => (
              <button
                key={role}
                id={`role-switch-${role.toLowerCase()}`}
                onClick={() => switchRole(role)}
                className={`py-1 text-xs rounded font-medium transition-all ${
                  activeRole === role
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Main Navigation
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Springfield SMS v2.5 • Supabase Database
        </div>
      </aside>
    </>
  );
};
