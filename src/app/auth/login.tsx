// app/auth/login.tsx
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';

const ROAMEO_LOGO = require('../../../assets/images/roameo-logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  console.log('🟢 Login Screen Mounted');

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    setApiError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('🔐 Login button pressed');
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    
    try {
      console.log('📡 Sending login request...');
      // FIXED: Correct endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendorcreation/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      const isSuccess = response.ok && (data.success === true || data.status === 'success');
      const authData = data.data ?? data;
      const token = authData.token;
      const vendor = authData.vendor;

      if (isSuccess && token && vendor) {
        console.log('✅ Login successful!');
        
        // Store token and vendor data
        await AsyncStorage.setItem('vendorToken', token);
        await AsyncStorage.setItem('vendorData', JSON.stringify(vendor));
        
        console.log('💾 Token stored:', !!data.token);
        console.log('💾 Vendor data stored:', data.vendor);
        
        Alert.alert('Success 🎉', 'Login successful! Welcome back.');
        console.log('➡️ Redirecting to dashboard...');
        router.replace('/');
      } else {
        console.log('❌ Login failed:', data.message);
        let errorMessage = isSuccess
          ? 'Login succeeded, but the server did not return the required account data.'
          : data.message || 'Invalid credentials';
        
        if (errorMessage.includes('not found')) {
          errorMessage = 'No account found with this email. Please sign up first.';
        } else if (errorMessage.includes('Invalid password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (errorMessage.includes('deactivated')) {
          errorMessage = 'Your account has been deactivated. Please contact support.';
        }
        
        setApiError(errorMessage);
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = 'Network error. Please check your internet connection and try again.';
      setApiError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Image source={ROAMEO_LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your vendor account</Text>
          </View>

          <View style={styles.formContainer}>
            {apiError ? (
              <View style={styles.apiErrorContainer}>
                <Feather name="alert-circle" size={20} color="#FF4444" />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Feather name="mail" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="vendor@example.com"
                  placeholderTextColor={Colors.light.textDim}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                    if (apiError) setApiError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Feather name="lock" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.light.textDim}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                    if (apiError) setApiError('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={Colors.light.textDim} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.light.white} />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.light.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textDim,
  },
  formContainer: {
    flex: 1,
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  apiErrorText: {
    flex: 1,
    color: '#FF4444',
    fontSize: 14,
    marginLeft: Spacing.two,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.one,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    height: 50,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    paddingVertical: Platform.OS === 'ios' ? 12 : 0,
  },
  eyeIcon: {
    padding: Spacing.one,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.four,
  },
  forgotPasswordText: {
    color: Colors.light.orange,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.light.orange,
    height: 50,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: Colors.light.textDim,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.light.orange,
    fontSize: 14,
    fontWeight: '600',
  },
});
