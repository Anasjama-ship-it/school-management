import React from 'react';
import { Menu, Search, Bell, Calendar, UserCheck, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  onOpenMobileSidebar: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  unreadNotifsCount?: number;
  onOpenNotifsTab?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  searchTerm,
  setSearchTerm,
  unreadNotifsCount = 0,
  onOpenNotifsTab,
  onOpenSupabaseModal
}) => {
  const { userProfile, activeRole } = useAuth();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'School Dashboard';
      case 'students':
        return 'Student Directory';
      case 'teachers':
        return 'Faculty & Teacher Management';
      case 'attendance':
        return 'Class Attendance Tracker';
      case 'fees':
        return 'School Fees & Financial ledger';
      case 'exams':
        return 'Examinations & Report Cards';
      case 'notifications':
        return 'Parent Communication Hub';
      case 'users':
        return 'User Roles & System Permissions';
      default:
        return 'School Management';
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
      <div className="flex items-center space-x-3">
        <button
          id="open-sidebar-mobile-btn"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight capitalize">
            {getTitle()}
          </h2>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayStr}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search students, fees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Notifications Icon */}
        <button
          id="header-notifications-btn"
          onClick={onOpenNotifsTab}
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="Parent SMS & Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Supabase Connection Badge */}
        {onOpenSupabaseModal && (
          <button
            onClick={onOpenSupabaseModal}
            className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-all"
            title="Supabase Database Status & Settings"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Connected</span>
          </button>
        )}

        {/* User Badge */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
            {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {userProfile?.displayName || 'Active User'}
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium">
              <UserCheck className="w-3 h-3 text-emerald-500" />
              <span>{activeRole}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
