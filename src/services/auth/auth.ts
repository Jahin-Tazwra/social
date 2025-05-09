import { supabase } from '../supabase/client';

export interface AuthError {
  message: string;
}

export interface AuthResponse {
  error: AuthError | null;
  data: any | null;
}

export const authService = {
  async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred during sign up',
        },
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred during sign in',
        },
      };
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { data: null, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred during sign out',
        },
      };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      return { data: user, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred while getting user',
        },
      };
    }
  },
}; 