import { Feather, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {
    DateTimePickerAndroid,
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { parsePrice, validatePricing } from '@/utils/couponPricing';

// API Base URL
const API_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api`;

type Category = {
    id: number;
    category_name: string;
};

type DateField = 'from' | 'until';

const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
};

const formatDateForDisplay = (date: Date | null) =>
    date ? date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return year && month && day ? new Date(year, month - 1, day) : null;
};

export default function CouponForm({ couponId }: { couponId?: string }) {
    const router = useRouter();
    const isEditing = couponId !== undefined;
    const [isLoadingCoupon, setIsLoadingCoupon] = useState(isEditing);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [originalFields, setOriginalFields] = useState<Record<string, string> | null>(null);
    const [imageChanged, setImageChanged] = useState(false);
    const submittingRef = useRef(false);

    // Form State
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [shortDescription, setShortDescription] = useState('');
    const [validFrom, setValidFrom] = useState<Date | null>(null);
    const [validUntil, setValidUntil] = useState<Date | null>(null);
    const [openDateField, setOpenDateField] = useState<DateField | null>(null);
    const [maxQuantity, setMaxQuantity] = useState(1);
    const [price, setPrice] = useState('');
    const [pricingError, setPricingError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Location State
    const [locationAddress, setLocationAddress] = useState('');
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    // Only new coupons should automatically use the device's location.
    useEffect(() => {
        if (!isEditing) fetchCurrentLocation();
        fetchCategories();
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) return;
        let cancelled = false;
        const controller = new AbortController();
        const loadCoupon = async () => {
            setIsLoadingCoupon(true);
            setLoadError(null);
            setOriginalFields(null);
            try {
                if (!couponId || !/^\d+$/.test(couponId)) throw new Error('Invalid coupon ID.');
                const token = await AsyncStorage.getItem('vendorToken');
                if (!token) throw new Error('Your session has expired. Please login again.');
                const response = await fetch(`${API_URL}/coupons/${encodeURIComponent(couponId)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });
                const result = await response.json();
                if (!response.ok || result.status !== 'success' || !result.data) {
                    throw new Error(result.message || 'Unable to load this coupon.');
                }
                if (cancelled) return;
                const coupon = result.data;
                const from = new Date(String(coupon.valid_from).replace(' ', 'T'));
                const until = new Date(String(coupon.valid_until).replace(' ', 'T'));
                const savedFrom = Number.isNaN(from.getTime()) ? null : from;
                const savedUntil = Number.isNaN(until.getTime()) ? null : until;
                const cents = parsePrice(coupon.price);
                const active = coupon.is_active === true || coupon.is_active === 1 || coupon.is_active === '1';
                const fields = {
                    title: String(coupon.title ?? ''),
                    description: String(coupon.description ?? ''),
                    category_id: String(coupon.category_id ?? ''),
                    city: String(coupon.city ?? ''),
                    price: cents === null ? '' : (cents / 100).toFixed(2),
                    max_quantity: String(coupon.max_quantity ?? 1),
                    is_active: active ? '1' : '0',
                    valid_from: savedFrom ? formatDateForApi(savedFrom) : '',
                    valid_until: savedUntil ? formatDateForApi(savedUntil) : '',
                };
                setTitle(fields.title);
                setShortDescription(fields.description);
                setCategory(fields.category_id);
                setLocationAddress(fields.city);
                setPrice(fields.price);
                setMaxQuantity(Number(fields.max_quantity));
                setIsActive(active);
                setValidFrom(savedFrom);
                setValidUntil(savedUntil);
                const banner = coupon.banner_image_url || coupon.banner_image;
                setImageUri(banner
                    ? /^https?:\/\//i.test(banner) ? banner : `${API_URL.replace(/\/api$/, '')}/${String(banner).replace(/^\/+/, '')}`
                    : null);
                setImageChanged(false);
                setOriginalFields(fields);
            } catch (error) {
                if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Unable to load this coupon.');
            } finally {
                if (!cancelled) setIsLoadingCoupon(false);
            }
        };
        loadCoupon();
        return () => { cancelled = true; controller.abort(); };
    }, [couponId, isEditing, loadAttempt]);

    const fetchCategories = async () => {
        setIsLoadingCategories(true);

        try {
            const response = await fetch(`${API_URL}/categories`);
            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load categories');
            }

            setCategories(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error('Error loading categories:', error);
            Alert.alert('Error', 'Unable to load coupon categories. Please try again.');
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') setOpenDateField(null);
        if (event.type === 'dismissed' || !selectedDate || !openDateField) return;

        if (openDateField === 'from') {
            setValidFrom(selectedDate);
            if (validUntil && selectedDate > validUntil) setValidUntil(null);
        } else {
            setValidUntil(selectedDate);
        }
    };

    const setSelectedDate = (field: DateField, selectedDate: Date) => {
        if (field === 'from') {
            setValidFrom(selectedDate);
            if (validUntil && selectedDate > validUntil) setValidUntil(null);
        } else {
            setValidUntil(selectedDate);
        }
    };

    const openNativeDatePicker = (field: DateField) => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: (field === 'from' ? validFrom : validUntil) || new Date(),
                mode: 'date',
                minimumDate: field === 'until' ? validFrom || new Date() : undefined,
                onChange: (event, selectedDate) => {
                    if (event.type !== 'dismissed' && selectedDate) {
                        setSelectedDate(field, selectedDate);
                    }
                },
            });
            return;
        }

        setOpenDateField(field);
    };

    // Function to request permission and get Area + City combined
    const fetchCurrentLocation = async () => {
        setIsFetchingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to detect your business location.'
                );
                setIsFetchingLocation(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = currentLocation.coords;
            setCoordinates({ latitude, longitude });

            let areaName = '';
            let cityName = '';

            try {
                const geocodeResults = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });

                if (geocodeResults && geocodeResults.length > 0) {
                    const place = geocodeResults[0];
                    areaName = place.subregion || place.district || place.street || place.name || '';
                    cityName = place.city || place.region || '';
                }
            } catch (nativeError) {
                console.warn('Native reverse geocode failed, trying API fallback:', nativeError);
            }

            if (!areaName && !cityName) {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                        {
                            headers: {
                                'User-Agent': 'RoameoApp/1.0',
                            },
                        }
                    );
                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        areaName = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.quarter || '';
                        cityName = addr.city || addr.town || addr.state_district || addr.county || addr.state || '';
                    }
                } catch (apiError) {
                    console.error('API reverse geocode fallback failed:', apiError);
                }
            }

            const locationParts = [areaName, cityName].filter((part) => part && part.trim() !== '');

            if (locationParts.length > 0) {
                const uniqueParts = Array.from(new Set(locationParts));
                setLocationAddress(uniqueParts.join(', '));
            } else {
                setLocationAddress('Location Detected');
            }
        } catch (error) {
            console.error('Error fetching location:', error);
            Alert.alert('Location Error', 'Unable to fetch your current position automatically.');
        } finally {
            setIsFetchingLocation(false);
        }
    };

    // Pick image from device gallery
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
                setImageChanged(true);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Get the currently authenticated vendor ID from the login session
    const getVendorId = async (): Promise<number> => {
        try {
            const vendorData = await AsyncStorage.getItem('vendorData');

            if (!vendorData) {
                throw new Error('Vendor session not found. Please login again.');
            }

            const vendor = JSON.parse(vendorData);
            const vendorId = Number(vendor.id ?? vendor.vendor_id);

            if (!Number.isInteger(vendorId) || vendorId <= 0) {
                throw new Error('Invalid vendor session. Please login again.');
            }

            return vendorId;
        } catch (error) {
            console.error('Error getting vendor_id:', error);
            throw error;
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (submittingRef.current || isLoadingCoupon || (isEditing && !originalFields)) return;
        setSubmitError(null);
        console.log('=== SUBMIT STARTED ===');
        console.log('Form Data:', {
            title,
            shortDescription,
            validFrom,
            validUntil,
            maxQuantity,
            locationAddress,
            isActive,
            hasImage: !!imageUri
        });
        
        // Validate required fields
        if (!title.trim()) {
            setSubmitError('Coupon title is required');
            Alert.alert('Validation Error', 'Coupon title is required');
            return;
        }

        const priceError = validatePricing(price);
        setPricingError(priceError);
        if (priceError) {
            Alert.alert('Validation Error', priceError);
            return;
        }

        if (!validFrom || !validUntil) {
            setSubmitError('Valid From and Valid Until are required');
            Alert.alert('Validation Error', 'Valid From and Valid Until are required');
            return;
        }

        if (validUntil < validFrom) {
            setSubmitError('Valid Until must be on or after Valid From');
            Alert.alert('Validation Error', 'Valid Until must be on or after Valid From');
            return;
        }

        console.log('Validation passed. Starting submission...');
        submittingRef.current = true;
        setIsSubmitting(true);

        try {
            // Get vendor_id
            const vendorId = isEditing ? null : await getVendorId();

            // Get auth token
            const token = await AsyncStorage.getItem('vendorToken');
            console.log('Token exists:', !!token);

            if (!token) {
                throw new Error('Your session has expired. Please login again.');
            }

            // Create FormData for multipart/form-data upload
            const formData = new FormData();
            
            const fields: Record<string, string> = {
                title: title.trim(),
                description: shortDescription.trim(),
                category_id: category,
                city: locationAddress.trim(),
                valid_from: formatDateForApi(validFrom),
                valid_until: formatDateForApi(validUntil),
                max_quantity: maxQuantity.toString(),
                price: (parsePrice(price)! / 100).toFixed(2),
                is_active: isActive ? '1' : '0',
            };
            for (const [key, value] of Object.entries(fields)) {
                if (isEditing) {
                    // Omitted fields retain their saved values, including full validity times.
                    if (value !== originalFields?.[key]) formData.append(key, value);
                } else if (value !== '') {
                    formData.append(key, value);
                }
            }
            if (!isEditing) {
                formData.append('vendor_id', String(vendorId));
                formData.append('campaign_type', 'coupon');
            }
            // Don't send is_approved - let backend default to 0

            console.log('FormData fields added');

            // Append image if selected
            if (imageUri && imageChanged) {
                console.log('Image URI:', imageUri);
                const filename = imageUri.split('/').pop() || 'coupon-image.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                if (Platform.OS === 'web') {
                    const imageResponse = await fetch(imageUri);
                    const imageBlob = await imageResponse.blob();
                    formData.append('banner_image', imageBlob, filename);
                } else {
                    formData.append('banner_image', {
                        uri: imageUri,
                        name: filename,
                        type,
                    } as any);
                }
                console.log('Image appended to form data');
            } else {
                console.log('No image selected');
            }

            // Log all form data entries for debugging
            console.log('FormData entries:');
            const formDataEntries: any = {};
            // @ts-ignore - FormData iteration
            for (let [key, value] of formData._parts || []) {
                if (typeof value === 'object' && value.uri) {
                    formDataEntries[key] = `File: ${value.name}`;
                } else {
                    formDataEntries[key] = value;
                }
            }
            console.log(formDataEntries);

            const endpoint = isEditing
                ? `${API_URL}/coupons/${encodeURIComponent(couponId)}`
                : `${API_URL}/coupons`;

            // Create headers
            const headers: any = {};
            
            // Add authorization if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Don't set Content-Type - let browser/RN set it with boundary
            const response = await fetch(endpoint, {
                method: isEditing ? 'PUT' : 'POST',
                headers: headers,
                body: formData,
            });

            console.log('Response status:', response.status);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            const responseText = await response.text();
            console.log('Raw response:', responseText.substring(0, 1000));

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('Server returned invalid response');
            }

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} coupon`);
            }
            if (isEditing && data.data) {
                // Surface fields ignored by the backend instead of claiming they were saved.
                for (const [key, value] of Object.entries(fields)) {
                    if (value === originalFields?.[key] || key.startsWith('valid_')) continue;
                    const saved = key === 'price' ? parsePrice(data.data.price) : String(data.data[key] ?? '');
                    const expected = key === 'price' ? parsePrice(value) : value;
                    if (saved !== expected) throw new Error(`The server did not save ${key.replace(/_/g, ' ')}. Please check the coupon backend and try again.`);
                }
            }

            router.replace('/listings');

        } catch (error: any) {
            const message = error.message || `Failed to ${isEditing ? 'update' : 'create'} coupon. Please try again.`;
            setSubmitError(message);
            Alert.alert('Error', message);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
            console.log('=== SUBMIT ENDED ===');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={22} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Coupon' : 'Add New Coupon'}</Text>
                <View style={{ width: 32 }} />
            </View>

            {isLoadingCoupon ? (
                <View style={styles.loadState}>
                    <ActivityIndicator color={Colors.light.orange} />
                    <Text>Loading coupon...</Text>
                </View>
            ) : loadError ? (
                <View style={styles.loadState}>
                    <Text accessibilityRole="alert" style={styles.pricingError}>{loadError}</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => setLoadAttempt((value) => value + 1)}>
                        <Text style={styles.detectLocationText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
            <ScrollView pointerEvents={isSubmitting ? 'none' : 'auto'} style={styles.formScroll} contentContainerStyle={styles.formContainer}>
                {/* --- IMAGE UPLOAD SECTION --- */}
                <Text style={styles.label}>Coupon Banner Image</Text>
                <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage} activeOpacity={0.8}>
                    {imageUri ? (
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            <View style={styles.editBadge}>
                                <Feather name="edit-2" size={14} color={Colors.light.white} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.placeholderBox}>
                            <Feather name="camera" size={28} color={Colors.light.orange} />
                            <Text style={styles.uploadText}>Tap to upload image</Text>
                            <Text style={styles.uploadSubtext}>PNG, JPG up to 5MB</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* --- TITLE INPUT --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Coupon Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Summer Sale, Weekend Special"
                        placeholderTextColor="#A0A0A0"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* --- CATEGORY DROPDOWN --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Category</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setIsCategoryOpen((open) => !open)}
                        disabled={isLoadingCategories}
                    >
                        <Text style={[styles.dropdownText, !category && styles.dropdownPlaceholder]}>
                            {isLoadingCategories
                                ? 'Loading categories...'
                                : categories.find((item) => item.id.toString() === category)?.category_name ||
                                  'Select a category'}
                        </Text>
                        {isLoadingCategories ? (
                            <ActivityIndicator size="small" color={Colors.light.orange} />
                        ) : (
                            <Feather
                                name={isCategoryOpen ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={Colors.light.textDim}
                            />
                        )}
                    </TouchableOpacity>

                    {isCategoryOpen && (
                        <View style={styles.dropdownMenu}>
                            {categories.length > 0 ? (
                                categories.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.dropdownOption}
                                        onPress={() => {
                                            setCategory(item.id.toString());
                                            setIsCategoryOpen(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownOptionText}>{item.category_name}</Text>
                                        {category === item.id.toString() && (
                                            <Feather name="check" size={17} color={Colors.light.orange} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.dropdownEmptyText}>No categories available</Text>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.pricingSection}>
                    <Text style={styles.label}>Price ($) *</Text>
                    <TextInput
                        style={styles.input}
                        accessibilityLabel="Coupon price in dollars"
                        placeholder="e.g. 25.00"
                        placeholderTextColor="#A0A0A0"
                        keyboardType="decimal-pad"
                        value={price}
                        editable={!isSubmitting}
                        onChangeText={(value) => { setPrice(value); setPricingError(null); }}
                    />
                    {pricingError && <Text accessibilityRole="alert" style={styles.pricingError}>{pricingError}</Text>}
                    {/* <Text style={styles.fieldHelp}>Price per coupon in dollars. Enter 0 for a free coupon.</Text> */}
                </View>

                {/* --- LOCATION INPUT --- */}
                <View style={styles.inputGroup}>
                    <View style={styles.locationHeaderRow}>
                        <Text style={styles.label}>Location (City)</Text>
                        <TouchableOpacity
                            style={styles.detectLocationBtn}
                            onPress={fetchCurrentLocation}
                            disabled={isFetchingLocation}
                        >
                            <Feather name="crosshair" size={12} color={Colors.light.orange} />
                            <Text style={styles.detectLocationText}>
                                {isFetchingLocation ? 'Detecting...' : 'Re-detect'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.locationInputWrapper}>
                        <Feather
                            name="map-pin"
                            size={18}
                            color={Colors.light.orange}
                            style={styles.locationIcon}
                        />
                        <TextInput
                            style={[styles.input, styles.locationInput]}
                            placeholder={
                                isFetchingLocation
                                    ? 'Detecting city...'
                                    : 'e.g. New York, London'
                            }
                            placeholderTextColor="#A0A0A0"
                            value={locationAddress}
                            onChangeText={setLocationAddress}
                        />
                        {isFetchingLocation && (
                            <ActivityIndicator
                                size="small"
                                color={Colors.light.orange}
                                style={styles.locationLoader}
                            />
                        )}
                    </View>
                </View>

                {/* --- VALIDITY DATE PICKERS --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Valid From</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            aria-label="Valid From"
                            type="date"
                            value={formatDateForInput(validFrom)}
                            onChange={(event) => {
                                const date = parseInputDate(event.currentTarget.value);
                                if (date) setSelectedDate('from', date);
                                else setValidFrom(null);
                            }}
                            style={styles.webDateInput as any}
                        />
                    ) : (
                        <TouchableOpacity style={styles.dateButton} onPress={() => openNativeDatePicker('from')}>
                            <Text style={validFrom ? styles.dateText : styles.datePlaceholder}>
                                {formatDateForDisplay(validFrom) || 'Select start date'}
                            </Text>
                            <Feather name="calendar" size={18} color={Colors.light.orange} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Valid Until</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            aria-label="Valid Until"
                            type="date"
                            value={formatDateForInput(validUntil)}
                            min={formatDateForInput(validFrom)}
                            onChange={(event) => {
                                const date = parseInputDate(event.currentTarget.value);
                                if (date) setSelectedDate('until', date);
                                else setValidUntil(null);
                            }}
                            style={styles.webDateInput as any}
                        />
                    ) : (
                        <TouchableOpacity style={styles.dateButton} onPress={() => openNativeDatePicker('until')}>
                            <Text style={validUntil ? styles.dateText : styles.datePlaceholder}>
                                {formatDateForDisplay(validUntil) || 'Select end date'}
                            </Text>
                            <Feather name="calendar" size={18} color={Colors.light.orange} />
                        </TouchableOpacity>
                    )}
                </View>

                {Platform.OS === 'ios' && openDateField && (
                    <View style={styles.datePickerContainer}>
                        <DateTimePicker
                            value={(openDateField === 'from' ? validFrom : validUntil) || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            minimumDate={openDateField === 'until' ? validFrom || new Date() : undefined}
                            onChange={handleDateChange}
                        />
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity style={styles.dateDoneButton} onPress={() => setOpenDateField(null)}>
                                <Text style={styles.dateDoneText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Maximum Quantity Per Cart</Text>
                    <Text style={styles.fieldHelp}>Customers can add this coupon up to this quantity (maximum 5).</Text>
                    <View style={styles.quantityRow}>
                        <TouchableOpacity
                            style={[styles.quantityButton, maxQuantity === 1 && styles.quantityButtonDisabled]}
                            disabled={maxQuantity === 1}
                            onPress={() => setMaxQuantity((value) => Math.max(1, value - 1))}
                        >
                            <Feather name="minus" size={20} color={Colors.light.text} />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{maxQuantity}</Text>
                        <TouchableOpacity
                            style={[styles.quantityButton, maxQuantity === 5 && styles.quantityButtonDisabled]}
                            disabled={maxQuantity === 5}
                            onPress={() => setMaxQuantity((value) => Math.min(5, value + 1))}
                        >
                            <Feather name="plus" size={20} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- SHORT DESCRIPTION --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Briefly describe what this coupon offers..."
                        placeholderTextColor="#A0A0A0"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={shortDescription}
                        onChangeText={setShortDescription}
                    />
                </View>

                {/* --- STATUS SWITCH (ACTIVE / INACTIVE) --- */}
                <View style={styles.statusRow}>
                    <View style={styles.statusTextGroup}>
                        <Text style={styles.label}>Coupon Status</Text>
                        <Text style={styles.statusSubtext}>
                            {isActive ? 'Active (Visible to customers)' : 'Inactive (Hidden from search)'}
                        </Text>
                    </View>
                    <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: '#E0E0E0', true: '#FFE0CC' }}
                        thumbColor={isActive ? Colors.light.orange : '#999999'}
                    />
                </View>

                {submitError && <Text accessibilityRole="alert" style={styles.pricingError}>{submitError}</Text>}

                {/* --- SUBMIT BUTTON --- */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!title.trim() || isSubmitting) && styles.disabledButton,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    accessibilityRole="button"
                    accessibilityLabel={isEditing ? 'Save Changes' : 'Publish Coupon'}
                    disabled={!title.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Colors.light.white} />
                    ) : (
                        <>
                            <FontAwesome
                                name="check-circle"
                                size={18}
                                color={Colors.light.white}
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Publish Coupon'}</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
    pricingSection: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: '#EEEEEE', borderRadius: Radius.medium, backgroundColor: Colors.light.white },
    pricingError: { color: '#B42318', fontSize: 12 },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        backgroundColor: Colors.light.white,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    formScroll: {
        flex: 1,
    },
    formContainer: {
        padding: Spacing.four,
        gap: Spacing.three,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    imagePickerContainer: {
        marginBottom: Spacing.two,
    },
    placeholderBox: {
        height: 140,
        backgroundColor: Colors.light.white,
        borderRadius: Radius.medium,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 8,
    },
    uploadSubtext: {
        fontSize: 11,
        color: Colors.light.textDim,
        marginTop: 2,
    },
    imageWrapper: {
        position: 'relative',
        height: 160,
        borderRadius: Radius.medium,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: Colors.light.orange,
        padding: 8,
        borderRadius: 20,
    },
    inputGroup: {
        marginBottom: Spacing.two,
    },
    input: {
        backgroundColor: Colors.light.white,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: Radius.medium,
        paddingHorizontal: Spacing.three,
        height: 46,
        fontSize: 14,
        color: Colors.light.text,
    },
    dropdownButton: {
        height: 46,
        paddingHorizontal: Spacing.three,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: Radius.medium,
        backgroundColor: Colors.light.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.text,
    },
    dropdownPlaceholder: {
        color: '#A0A0A0',
    },
    dropdownMenu: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: Radius.medium,
        backgroundColor: Colors.light.white,
        overflow: 'hidden',
    },
    dropdownOption: {
        minHeight: 44,
        paddingHorizontal: Spacing.three,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
    },
    dropdownOptionText: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.text,
    },
    dropdownEmptyText: {
        padding: Spacing.three,
        fontSize: 13,
        color: Colors.light.textDim,
        textAlign: 'center',
    },
    dateButton: {
        height: 46,
        paddingHorizontal: Spacing.three,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: Radius.medium,
        backgroundColor: Colors.light.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: { fontSize: 14, color: Colors.light.text },
    datePlaceholder: { fontSize: 14, color: '#A0A0A0' },
    webDateInput: {
        height: 46,
        paddingHorizontal: Spacing.three,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: Radius.medium,
        backgroundColor: Colors.light.white,
        fontSize: 14,
        color: Colors.light.text,
    },
    datePickerContainer: {
        backgroundColor: Colors.light.white,
        borderRadius: Radius.medium,
        padding: Spacing.two,
    },
    dateDoneButton: { alignSelf: 'flex-end', padding: Spacing.two },
    dateDoneText: { color: Colors.light.orange, fontWeight: '700' },
    fieldHelp: { fontSize: 11, color: Colors.light.textDim, marginBottom: Spacing.two },
    quantityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
    quantityButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.medium,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        backgroundColor: Colors.light.white,
    },
    quantityButtonDisabled: { opacity: 0.35 },
    quantityValue: { minWidth: 28, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.light.text },
    locationHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detectLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 2,
    },
    detectLocationText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.orange,
    },
    locationInputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    locationIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    locationInput: {
        paddingLeft: 38,
        paddingRight: 38,
    },
    locationLoader: {
        position: 'absolute',
        right: 12,
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.light.white,
        padding: Spacing.three,
        borderRadius: Radius.medium,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        marginVertical: Spacing.one,
    },
    statusTextGroup: {
        flex: 1,
        paddingRight: Spacing.two,
    },
    statusSubtext: {
        fontSize: 11,
        color: Colors.light.textDim,
    },
    submitButton: {
        backgroundColor: Colors.light.orange,
        flexDirection: 'row',
        height: 50,
        borderRadius: Radius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.two,
        shadowColor: Colors.light.orange,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: Colors.light.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
