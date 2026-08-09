import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole, UserProfile } from '../types';

interface AuthContextType {
  currentUser: any | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  loading: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>({
    uid: 'demo-admin-01',
    email: 'admin@school.edu',
    displayName: 'School Principal (Admin)',
    role: 'Admin',
    status: 'Active'
  });
  const [activeRole, setActiveRole] = useState<UserRole>('Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial Supabase Session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await loadProfile(session.user);
        }
      } catch (err) {
        console.warn('Supabase Auth init session notice:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen to Supabase Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await loadProfile(session.user);
      } else {
        setCurrentUser(null);
        setUserProfile({
          uid: 'demo-admin-01',
          email: 'admin@school.edu',
          displayName: 'School Principal (Admin)',
          role: 'Admin',
          status: 'Active'
        });
        setActiveRole('Admin');
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadProfile = async (user: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .maybeSingle();

      if (data) {
        const prof: UserProfile = {
          uid: data.uid,
          email: data.email,
          displayName: data.display_name,
          role: data.role as UserRole,
          status: data.status || 'Active'
        };
        setUserProfile(prof);
        setActiveRole(prof.role);
      } else {
        const defaultRole: UserRole = user.user_metadata?.role || 'Admin';
        const newProf: UserProfile = {
          uid: user.id,
          email: user.email || 'user@school.edu',
          displayName: user.user_metadata?.displayName || user.email?.split('@')[0] || 'School User',
          role: defaultRole,
          status: 'Active'
        };

        // Save profile to Supabase users table
        await supabase.from('users').upsert([
          {
            uid: newProf.uid,
            email: newProf.email,
            display_name: newProf.displayName,
            role: newProf.role,
            status: newProf.status
          }
        ], { onConflict: 'email' });

        setUserProfile(newProf);
        setActiveRole(defaultRole);
      }
    } catch (e) {
      console.warn('Error loading user profile from Supabase:', e);
    }
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        role: role,
        displayName:
          role === 'Admin'
            ? 'Principal Sarah (Admin)'
            : role === 'Teacher'
            ? 'Dr. Marcus Vance (Teacher)'
            : 'John Sterling (Accountant)'
      });
    }
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) {
      // Fallback demo login support if Supabase Auth user doesn't exist yet
      if (email.includes('teacher')) switchRole('Teacher');
      else if (email.includes('accountant') || email.includes('fee')) switchRole('Accountant');
      else switchRole('Admin');
    }
  };

  const signup = async (email: string, pass: string, displayName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          displayName,
          role
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      const newProf: UserProfile = {
        uid: data.user.id,
        email,
        displayName,
        role,
        status: 'Active'
      };

      await supabase.from('users').upsert([
        {
          uid: newProf.uid,
          email: newProf.email,
          display_name: newProf.displayName,
          role: newProf.role,
          status: newProf.status
        }
      ]);

      setUserProfile(newProf);
      setActiveRole(role);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile({
      uid: 'demo-admin-01',
      email: 'admin@school.edu',
      displayName: 'School Principal (Admin)',
      role: 'Admin',
      status: 'Active'
    });
    setActiveRole('Admin');
  };

  const hasRole = (roles: UserRole[]) => {
    return roles.includes(activeRole);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeRole,
        loading,
        switchRole,
        login,
        signup,
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
