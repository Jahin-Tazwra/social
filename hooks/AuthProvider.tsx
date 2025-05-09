import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, Button } from 'react-native-paper';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checked = useRef(false);
  const router = useRouter();
  const segments = useSegments();

  // Separate effect for initial session check
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (checked.current) return; // Prevent repeated checks
      checked.current = true;
      setLoading(true);
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Supabase getSession error:', sessionError);
        }
        if (!mounted) return;

        if (!initialSession) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(initialSession);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', initialSession.user.id)
          .single();

        if (profileError) {
          console.error('Supabase profile fetch error:', profileError);
        }

        if (!mounted) return;
        setUser(profileData);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError('Error initializing auth');
        setLoading(false);
        console.error('AuthProvider catch error:', err);
      }
      // Force loading to false for debugging
      setLoading(false);
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Separate effect for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession: Session | null) => {
      if (!currentSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        
        setUser(profileData);
      } catch (error) {
        setError('Error fetching user profile');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Insert a profile row for the new user
      if (data?.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            // add other fields as needed, e.g. full_name: '', avatar_url: ''
          }
        ]);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setError('Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 