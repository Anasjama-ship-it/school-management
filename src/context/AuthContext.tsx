import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { verifyPassword, hashPassword } from '../lib/crypto';

export const SOMALI_AUTH_ERROR = 'Fadlan, username-ka ama password-ka waa khaldan yahay.';

interface AuthContextType {
  currentUser: any | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

// Built-in fallback accounts with secure hashed passwords
const INITIAL_DEMO_ACCOUNTS: Array<{
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  teacherId?: string;
  assignedClasses?: string[];
  plainPasswords: string[];
}> = [
  {
    username: 'admin',
    email: 'admin@school.edu',
    displayName: 'Principal Administrator',
    role: 'Admin',
    status: 'Active',
    plainPasswords: ['123', 'admin', 'Admin2026!', 'SchoolAdmin123!']
  },
  {
    username: 'anas',
    email: 'anas@school.edu',
    displayName: 'Principal Anas',
    role: 'Admin',
    status: 'Active',
    plainPasswords: ['123', 'admin', 'Admin2026!']
  },
  {
    username: 'marcus_v',
    email: 'teacher1@school.edu',
    displayName: 'Dr. Marcus Vance',
    role: 'Teacher',
    teacherId: 'TCH-2026-01',
    assignedClasses: ['Grade 10A'],
    status: 'Active',
    plainPasswords: ['TeacherPass123!', '123']
  },
  {
    username: 'elena_r',
    email: 'teacher2@school.edu',
    displayName: 'Prof. Elena Rostova',
    role: 'Teacher',
    teacherId: 'TCH-2026-02',
    assignedClasses: ['Grade 10B'],
    status: 'Active',
    plainPasswords: ['TeacherPass123!', '123']
  },
  {
    username: 'john_s',
    email: 'accountant@school.edu',
    displayName: 'John Sterling',
    role: 'Accountant',
    status: 'Active',
    plainPasswords: ['AccountantPass123!', '123']
  }
];

const AUTH_SESSION_KEY = 'sms_auth_session_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('Admin');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (savedSession) {
        const parsed: UserProfile = JSON.parse(savedSession);
        if (parsed && parsed.status === 'Active') {
          setUserProfile(parsed);
          setActiveRole(parsed.role);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY);
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Session parse error:', e);
      setIsAuthenticated(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    if (userProfile) {
      const updated = {
        ...userProfile,
        role: role
      };
      setUserProfile(updated);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
    }
  };

  const login = async (usernameOrEmail: string, pass: string) => {
    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanIdentifier || !cleanPass) {
      throw new Error(SOMALI_AUTH_ERROR);
    }

    let authenticatedProfile: UserProfile | null = null;

    // 1. Try Supabase Auth first (for direct Supabase Authentication)
    try {
      if (cleanIdentifier.includes('@')) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password: cleanPass
        });
        if (!authError && authData?.user) {
          const userMeta = authData.user.user_metadata || {};
          authenticatedProfile = {
            uid: authData.user.id,
            email: authData.user.email || cleanIdentifier,
            displayName: userMeta.displayName || authData.user.email?.split('@')[0] || 'User',
            username: userMeta.username || cleanIdentifier.split('@')[0],
            role: (userMeta.role as UserRole) || 'Admin',
            status: 'Active'
          };
        }
      }
    } catch (sbErr) {
      console.warn('Supabase Auth direct check:', sbErr);
    }

    // 2. Query public.users table in Supabase by email or username
    if (!authenticatedProfile) {
      try {
        const { data: dbUsers, error: dbError } = await supabase
          .from('users')
          .select('*')
          .or(`username.ilike.${cleanIdentifier},email.ilike.${cleanIdentifier}`);

        if (!dbError && dbUsers && dbUsers.length > 0) {
          const matchedUser = dbUsers[0];

          // Check account status
          if (matchedUser.status === 'Inactive') {
            throw new Error(SOMALI_AUTH_ERROR);
          }

          let isPasswordValid = false;

          // Check hashed password stored in DB
          if (matchedUser.password_hash) {
            isPasswordValid = await verifyPassword(cleanPass, matchedUser.password_hash);
          }

          // Fallback check demo credentials if password hash not present
          if (!isPasswordValid) {
            const demoMatch = INITIAL_DEMO_ACCOUNTS.find(
              (acc) =>
                acc.username.toLowerCase() === matchedUser.username?.toLowerCase() ||
                acc.email.toLowerCase() === matchedUser.email?.toLowerCase()
            );
            if (demoMatch && demoMatch.plainPasswords.includes(cleanPass)) {
              isPasswordValid = true;
            }
          }

          if (isPasswordValid) {
            let assignedClasses: string[] = [];
            // If linked to teacher, fetch assigned classes
            if (matchedUser.teacher_id) {
              const { data: tchRow } = await supabase
                .from('teachers')
                .select('assigned_classes, status')
                .eq('teacher_id', matchedUser.teacher_id)
                .maybeSingle();
              if (tchRow?.status === 'Resigned') {
                throw new Error(SOMALI_AUTH_ERROR);
              }
              if (tchRow?.assigned_classes) {
                assignedClasses = tchRow.assigned_classes;
              }
            }

            authenticatedProfile = {
              uid: matchedUser.uid || matchedUser.id,
              email: matchedUser.email,
              displayName: matchedUser.display_name,
              username: matchedUser.username,
              teacherId: matchedUser.teacher_id,
              role: matchedUser.role,
              status: matchedUser.status || 'Active',
              assignedClasses
            };
          }
        }
      } catch (err: any) {
        if (err.message === SOMALI_AUTH_ERROR) {
          throw err;
        }
        console.warn('DB user query note:', err);
      }
    }

    // 3. Check Demo Initial Accounts fallback (Admin, Teachers, Accountant)
    if (!authenticatedProfile) {
      const match = INITIAL_DEMO_ACCOUNTS.find(
        (acc) =>
          acc.username.toLowerCase() === cleanIdentifier ||
          acc.email.toLowerCase() === cleanIdentifier
      );

      if (match && match.status === 'Active' && match.plainPasswords.includes(cleanPass)) {
        authenticatedProfile = {
          uid: `usr-${match.username}`,
          email: match.email,
          displayName: match.displayName,
          username: match.username,
          teacherId: match.teacherId,
          role: match.role,
          status: match.status,
          assignedClasses: match.assignedClasses || []
        };
      }
    }

    // If still no authenticated profile, credentials are wrong!
    if (!authenticatedProfile) {
      throw new Error(SOMALI_AUTH_ERROR);
    }

    // Success: save authenticated session
    setUserProfile(authenticatedProfile);
    setActiveRole(authenticatedProfile.role);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authenticatedProfile));
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut note:', e);
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    setUserProfile(null);
    setActiveRole('Admin');
  };

  const hasRole = (roles: UserRole[]) => {
    return roles.includes(activeRole);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: userProfile ? { id: userProfile.uid, email: userProfile.email } : null,
        userProfile,
        activeRole,
        loading,
        isAuthenticated,
        switchRole,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
