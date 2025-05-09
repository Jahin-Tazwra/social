import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, useRouter } from 'expo-router';
import { supabase } from '@/src/services/supabase/client';
import { AuthProvider, useAuth } from '../hooks/AuthProvider';

function LayoutWithAuth() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const router = useRouter();

  // Handle profile loading
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      // Don't do anything if auth is still loading
      if (authLoading) return;

      // If no user, redirect to login
      if (!user) {
        setProfileLoading(false);
        router.replace('/(auth)/login');
        return;
      }

      // If we already have a profile, no need to fetch again
      if (profile) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (error) {
          console.error('Layout: Error fetching profile:', error);
          setProfileLoading(false);
          return;
        }

        setProfile(data);
        setProfileLoading(false);

        if (!data?.latitude || !data?.longitude) {
          router.replace('/location-setup');
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Layout: Error in loadProfile:', error);
        setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, profile]);

  // Show loading state only when auth is loading or profile is loading
  if (authLoading || profileLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
          </GestureHandlerRootView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // Fallback UI for no user
  if (!user && !authLoading && !profileLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No user found. Please log in.</Text>
          </GestureHandlerRootView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider>
            <LayoutWithAuth />
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
} 