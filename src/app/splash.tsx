// app/splash.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    console.log('🟢 Splash Screen Mounted');

    // Splash Screen Fade-In & Scale-Up Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait 2.5 seconds, then check auth
    const timer = setTimeout(async () => {
      console.log('⏰ 2.5 seconds passed, checking auth...');
      
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(async () => {
        try {
          const token = await AsyncStorage.getItem('vendorToken');
          console.log('🔑 Token exists:', !!token);
          
          if (token) {
            console.log('➡️ Redirecting to Dashboard');
            router.replace('/');
          } else {
            console.log('➡️ Redirecting to Login');
            router.replace('/auth/login');
          }
        } catch (error) {
          console.error('❌ Error checking auth:', error);
          router.replace('/auth/login');
        }
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoBadge}>
          <Image source={ROAMEO_LOGO} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brandTitle}>Roameo</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>VENDOR PANEL</Text>
        </View>
      </Animated.View>
      <Animated.Text style={[styles.footerText, { opacity: fadeAnim }]}>
        Partner Workspace
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 75,
    height: 75,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  badgeContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
  },
});