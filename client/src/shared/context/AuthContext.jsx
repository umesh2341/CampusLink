import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { queryClient } from '../lib/queryClient';
import useAppStore from '../store/useAppStore';

const AuthContext = createContext({
  user: null,
  profile: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedUserRef = useRef(null);

  const fetchProfile = async (userId) => {
    if (fetchedUserRef.current === userId) return;
    fetchedUserRef.current = userId;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) setProfile(data);
    } catch (err) {
      console.warn('[Auth] Profile fetch error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Hydration
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        useAppStore.getState().setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        useAppStore.getState().resetApp();
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) {
        useAppStore.getState().resetApp();
        setIsLoading(false);
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user);
            useAppStore.getState().setUser(session.user);
            fetchProfile(session.user.id);
          }
          setIsLoading(false);
          break;

        case 'SIGNED_OUT':
          fetchedUserRef.current = null;
          setUser(null);
          setProfile(null);
          useAppStore.getState().resetApp();
          setIsLoading(false);
          queryClient.clear();
          break;

        case 'INITIAL_SESSION':
          break;

        default:
          if (!session) {
            setUser(null);
            setProfile(null);
            useAppStore.getState().resetApp();
          }
          setIsLoading(false);
          break;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // Synchronous optimistic teardown: triggers immediate re-render across Zustand & React Context
    fetchedUserRef.current = null;
    setUser(null);
    setProfile(null);
    setIsLoading(false);
    useAppStore.getState().resetApp();
    queryClient.clear();

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Remote signOut warning:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
