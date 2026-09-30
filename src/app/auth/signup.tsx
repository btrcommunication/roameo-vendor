// src/app/auth/signup.tsx
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    business_description: '',
    latitude: '',
    longitude: '',
    service_radius_meters: '5000',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  const detectLocation = async () => {
    try {
      setDetectingLocation(true);
      let latitude: number | null = null;
      let longitude: number | null = null;

      // 1. Try web browser geolocation if on web
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }).catch(() => null);

        if (position) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      }

      // 2. Try expo-location
      if (latitude === null || longitude === null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      }

      if (latitude !== null && longitude !== null) {
        const latStr = String(Number(latitude).toFixed(6));
        const lngStr = String(Number(longitude).toFixed(6));

        setFormData(prev => ({
          ...prev,
          latitude: latStr,
          longitude: lngStr,
        }));

        // Reverse geocode address using Google Maps Geocoding API if address is empty
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
        if (apiKey) {
          try {
            const geoRes = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              const formattedAddress = geoData.results[0].formatted_address;
              setFormData(prev => ({
                ...prev,
                address: prev.address ? prev.address : formattedAddress,
              }));
            }
          } catch (geoErr) {
            console.warn('Google reverse geocode error:', geoErr);
          }
        }
      }
    } catch (err) {
      console.error('Location detection error:', err);
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Business name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    setApiError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address || null,
        business_description: formData.business_description || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        service_radius_meters: parseInt(formData.service_radius_meters) || 5000,
      };

      // FIXED: Correct endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendorcreation/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      const isSuccess = response.ok && (data.success === true || data.status === 'success');

      if (isSuccess) {
        Alert.alert(
          'Success 🎉',
          data.message || 'Account created successfully! Please login to continue.'
        );
        router.replace('/auth/login');
      } else {
        const errorMessage = data.message || 'Registration failed. Please try again.';
        setApiError(errorMessage);
        Alert.alert('Signup Failed', errorMessage);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 'Network error. Please check your internet connection and try again.';
      setApiError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    if (apiError) setApiError('');
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
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoBadge}>
                <Image source={ROAMEO_LOGO} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Register as a vendor</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* API Error Display */}
            {apiError ? (
              <View style={styles.apiErrorContainer}>
                <Feather name="alert-circle" size={20} color="#FF4444" />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <Feather name="briefcase" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter business name"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Feather name="mail" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="vendor@example.com"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Feather name="lock" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={Colors.light.textDim} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                <Feather name="phone" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Address</Text>
              <View style={styles.inputWrapper}>
                <Feather name="map-pin" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter business address"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.address}
                  onChangeText={(text) => updateField('address', text)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your business"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.business_description}
                  onChangeText={(text) => updateField('business_description', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Coordinates Section with Auto-Detect Button */}
            <View style={styles.coordinatesHeaderRow}>
              <Text style={styles.label}>Location Coordinates</Text>
              <TouchableOpacity
                onPress={detectLocation}
                disabled={detectingLocation}
                style={styles.detectLocationBtn}
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={Colors.light.orange} />
                ) : (
                  <Feather name="crosshair" size={14} color={Colors.light.orange} />
                )}
                <Text style={styles.detectLocationText}>
                  {detectingLocation ? 'Detecting...' : 'Detect Location'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.subLabel}>Latitude</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 28.6139"
                    placeholderTextColor={Colors.light.textDim}
                    value={formData.latitude}
                    onChangeText={(text) => updateField('latitude', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.subLabel}>Longitude</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 77.2090"
                    placeholderTextColor={Colors.light.textDim}
                    value={formData.longitude}
                    onChangeText={(text) => updateField('longitude', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Radius (meters)</Text>
              <View style={styles.inputWrapper}>
                <Feather name="radio" size={20} color={Colors.light.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="5000"
                  placeholderTextColor={Colors.light.textDim}
                  value={formData.service_radius_meters}
                  onChangeText={(text) => updateField('service_radius_meters', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.light.white} />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Login</Text>
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerContainer: {
    marginBottom: Spacing.four,
  },
  backButton: {
    padding: Spacing.one,
    marginBottom: Spacing.two,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.light.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
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
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.one,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textDim,
    marginBottom: 4,
  },
  coordinatesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  detectLocationText: {
    fontSize: 12,
    color: Colors.light.orange,
    fontWeight: '600',
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
  textAreaWrapper: {
    height: 80,
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  textArea: {
    height: 70,
    paddingTop: 0,
  },
  eyeIcon: {
    padding: Spacing.one,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  signupButton: {
    backgroundColor: Colors.light.orange,
    height: 50,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  loginText: {
    color: Colors.light.textDim,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.light.orange,
    fontSize: 14,
    fontWeight: '600',
  },
});
