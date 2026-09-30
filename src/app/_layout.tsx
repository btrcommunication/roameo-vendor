import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('vendorToken');

        console.log('🔐 Auth check:', !!token);

        if (mounted) {
          setIsAuthenticated(!!token);
        }
      } catch (error) {
        console.error('❌ Error checking auth:', error);

        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [segments]);

  useEffect(() => {
    if (isAuthenticated === null) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';

    console.log('🧭 Navigation check:', {
      isAuthenticated,
      inAuthGroup,
      currentRoute: segments.join('/'),
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log('➡️ User not authenticated → Login');

      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      console.log('➡️ User authenticated → Dashboard');

      router.replace('/');
      return;
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={Colors.light.orange}
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
      }}
    />
  );
}