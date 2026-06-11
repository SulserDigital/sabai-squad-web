import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session?.user,
      });
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: !!session?.user,
        });
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    return data;
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }, []);

  const signInWithProvider = useCallback(async (provider: 'google' | 'apple' | 'facebook' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, loading: false, isAuthenticated: false });
    setProfile(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setState({
      user: session?.user ?? null,
      session,
      loading: false,
      isAuthenticated: !!session?.user,
    });
  }, []);

  return {
    ...state,
    profile,
    // Convenience: expose user info in the same shape as before
    user: state.user ? {
      id: state.user.id,
      name: profile?.name ?? state.user.user_metadata?.full_name ?? state.user.email?.split('@')[0] ?? 'User',
      email: state.user.email ?? null,
      role: profile?.role ?? 'user',
    } : null,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signInWithProvider,
    logout,
    refresh,
  };
}
