import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radius, Spacing } from '@/constants/theme';

const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');

const API_BASE_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api`;

const TabBarItem = ({ icon, label, active = false, path }: any) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.tabItem} onPress={() => router.push(path)}>
      <FontAwesome name={icon} size={21} color={active ? '#208AEF' : '#8A8A8A'} />
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function Ads() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'featured' | 'notification'>('featured');

  const [formData, setFormData] = useState({
    id: null as number | null,
    title: '',
    description: '',
    price: '',
    discount: '',
    campaign_type: 'featured',
    image_uri: null as string | null,
    image_file_name: '',
    image_base64: null as string | null,
    start_date: '',
    end_date: '',
    approval_status: '',
    disapproval_reason: ''
  });

  useEffect(() => {
    loadVendorAndAds();
  }, []);

  const loadVendorAndAds = async () => {
    try {
      setLoading(true);
      const dataStr = await AsyncStorage.getItem('vendorData');
      if (dataStr) {
        const vendor = JSON.parse(dataStr);
        setVendorId(vendor.id);
        await fetchAds(vendor.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async (vId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendorcreation/ads?vendor_id=${vId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setAds(data.data);
      }
    } catch (e) {
      console.error('Fetch ads failed:', e);
    }
  };

  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('uploads')) return `${process.env.EXPO_PUBLIC_BASE_URL}/${cleanUrl}`;
    return `${process.env.EXPO_PUBLIC_BASE_URL}/uploads/${cleanUrl}`;
  };

  const pickImage = async () => {
    if (modalMode === 'view') return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow photo library permission to upload an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = uri.split('/').pop() || 'image.jpg';
        setFormData({
          ...formData,
          image_uri: uri,
          image_file_name: filename,
          image_base64: asset.base64 || null
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveAd = async () => {
    if (!formData.title || !formData.campaign_type) {
      Alert.alert('Validation', 'Title and Campaign Type are required.');
      return;
    }
    setSubmitting(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title);
      dataToSend.append('description', formData.description);
      dataToSend.append('campaign_type', formData.campaign_type);
      dataToSend.append('ad_type', 'vendor');
      if (vendorId) dataToSend.append('vendor_id', vendorId);
      if (formData.price) dataToSend.append('price', formData.price);
      if (formData.discount) dataToSend.append('discount', formData.discount);

      if (formData.image_uri && !formData.image_uri.startsWith('http')) {
        if (Platform.OS === 'web') {
          try {
            if (formData.image_base64) {
              const byteCharacters = atob(formData.image_base64);
              const byteArrays = [];
              for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                  byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
              }
              const blob = new Blob(byteArrays, { type: 'image/jpeg' });
              dataToSend.append('image', blob, formData.image_file_name || 'upload.jpg');
            } else {
              const response = await fetch(formData.image_uri);
              const blob = await response.blob();
              dataToSend.append('image', blob, formData.image_file_name || 'upload.jpg');
            }
          } catch (e) {
            console.error('Blob creation error:', e);
            Alert.alert('Image Error', 'Could not process image: ' + (e instanceof Error ? e.message : 'Unknown error'));
            setSubmitting(false);
            return;
          }
        } else {
          dataToSend.append('image', {
            uri: formData.image_uri,
            name: formData.image_file_name,
            type: 'image/jpeg',
          } as any);
        }
      }

      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      const endpoint = modalMode === 'edit' 
        ? `${API_BASE_URL}/vendorcreation/ads/${formData.id}`
        : `${API_BASE_URL}/vendorcreation/ads`;

      const response = await fetch(endpoint, {
        method,
        body: dataToSend,
        headers: { 'Accept': 'application/json' }
      });

      const resJson = await response.json();
      if (resJson.status === 'success') {
        Alert.alert('Success', `Ad ${modalMode === 'edit' ? 'updated' : 'created'} successfully! It is pending admin approval.`);
        setModalVisible(false);
        if (vendorId) fetchAds(vendorId);
      } else {
        Alert.alert('Error', resJson.message || 'Failed to save ad.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred while saving the ad.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      id: null,
      title: '',
      description: '',
      price: '',
      discount: '',
      campaign_type: 'featured',
      image_uri: null,
      image_file_name: '',
      image_base64: null,
      start_date: '',
      end_date: '',
      approval_status: '',
      disapproval_reason: ''
    });
    setModalMode('create');
    setModalVisible(true);
  };

  const openAdDetails = (ad: any) => {
    setFormData({
      id: ad.id,
      title: ad.title || '',
      description: ad.description || '',
      price: ad.price?.toString() || '',
      discount: ad.discount?.toString() || '',
      campaign_type: ad.campaign_type || 'featured',
      image_uri: getFullImageUrl(ad.image_url),
      image_file_name: '',
      image_base64: null,
      start_date: ad.start_date || '',
      end_date: ad.end_date || '',
      approval_status: ad.approval_status || 'pending',
      disapproval_reason: ad.disapproval_reason || ''
    });
    if (ad.approval_status === 'pending') {
      setModalMode('edit');
    } else {
      setModalMode('view');
    }
    setModalVisible(true);
  };

  // Derive counts and filter ads
  const pendingCount = ads.filter(a => a.approval_status === 'pending').length;
  const approvedCount = ads.filter(a => a.approval_status === 'approved').length;
  const disapprovedCount = ads.filter(a => a.approval_status === 'disapproved').length;
  
  const activeCount = ads.filter(a => {
    if (a.approval_status !== 'approved') return false;
    const now = new Date();
    if (a.start_date && new Date(a.start_date) > now) return false;
    if (a.end_date && new Date(a.end_date) < now) return false;
    return true;
  }).length;

  const filteredAds = ads.filter(ad => {
    // filter by tab
    if (ad.campaign_type !== selectedTab) return false;
    // filter by search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        (ad.title && ad.title.toLowerCase().includes(q)) ||
        (ad.description && ad.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.darkElement} />
      
      {/* --- TOP BRANDED HEADER --- */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Feather name="bell" size={24} color={Colors.light.white} />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </TouchableOpacity>

          <View style={styles.logoGroup}>
            <Image source={ROAMEO_LOGO} style={styles.roameoLogoImage} resizeMode="contain" />
            <FontAwesome name="map-marker" size={20} color={Colors.light.orange} style={{ marginLeft: 4 }} />
          </View>

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={28} color={Colors.light.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📢 Ads Management</Text>
        <Text style={styles.headerSubtitle}>Create and manage your promotional ads</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* STATS STRIP */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{ads.length}</Text>
            <Text style={styles.statLabel}>All Ads</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#F59E0B'}]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#3B82F6'}]}>{approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#10B981'}]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#EF4444'}]}>{disapprovedCount}</Text>
            <Text style={styles.statLabel}>Disapproved</Text>
          </View>
        </ScrollView>

        {/* SEARCH AND ADD ROW */}
        <View style={styles.actionRow}>
          <View style={[styles.searchContainer, { flex: 1, marginBottom: 0 }]}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ads..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity style={[styles.createBtn, { marginBottom: 0, marginLeft: 12, paddingHorizontal: 20 }]} onPress={openCreateModal}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'featured' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('featured')}
          >
            <Text style={[styles.tabButtonText, selectedTab === 'featured' && styles.tabButtonTextActive]}>Featured Ads</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'notification' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('notification')}
          >
            <Text style={[styles.tabButtonText, selectedTab === 'notification' && styles.tabButtonTextActive]}>Notification Ads</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#FF5500" style={{ marginTop: 40 }} />
        ) : filteredAds.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={50} color="#D1D5DB" />
            <Text style={styles.emptyText}>No ads found for this category.</Text>
          </View>
        ) : (
          filteredAds.map((ad, idx) => (
            <TouchableOpacity key={idx} style={styles.adCard} onPress={() => openAdDetails(ad)}>
              {ad.image_url ? (
                <Image source={{ uri: getFullImageUrl(ad.image_url) }} style={styles.adImage} />
              ) : (
                <View style={[styles.adImage, styles.placeholderImg]}>
                  <Ionicons name="image-outline" size={30} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.adInfo}>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adTypeBadge}>{ad.campaign_type === 'notification' ? 'Notification' : 'Featured'}</Text>
                <View style={styles.adStatus}>
                  <View style={[styles.statusDot, { backgroundColor: ad.approval_status === 'approved' ? '#10B981' : ad.approval_status === 'disapproved' ? '#EF4444' : '#F59E0B' }]} />
                  <Text style={styles.statusText}>{ad.approval_status ? ad.approval_status.charAt(0).toUpperCase() + ad.approval_status.slice(1) : 'Pending'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* CREATE/EDIT/VIEW AD MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Create Ad' : modalMode === 'edit' ? 'Edit Ad (Pending)' : 'Ad Details'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalMode === 'view' && formData.approval_status && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={[styles.input, { color: formData.approval_status === 'approved' ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>
                    {formData.approval_status.toUpperCase()}
                  </Text>
                </View>
              )}

              {modalMode === 'view' && formData.disapproval_reason ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Reason for Disapproval</Text>
                  <Text style={[styles.input, { color: '#EF4444' }]}>{formData.disapproval_reason}</Text>
                </View>
              ) : null}

              {modalMode === 'view' && formData.approval_status === 'approved' && formData.start_date && formData.end_date && (
                <View style={styles.row}>
                  <View style={{flex: 1, marginRight: 8}}>
                    <Text style={styles.label}>Start Date</Text>
                    <Text style={styles.input}>{new Date(formData.start_date).toLocaleDateString()}</Text>
                  </View>
                  <View style={{flex: 1, marginLeft: 8}}>
                    <Text style={styles.label}>End Date</Text>
                    <Text style={styles.input}>{new Date(formData.end_date).toLocaleDateString()}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Campaign Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeBtn, formData.campaign_type === 'featured' && styles.typeBtnActive]}
                  onPress={() => modalMode !== 'view' && setFormData({...formData, campaign_type: 'featured'})}
                  disabled={modalMode === 'view'}
                >
                  <Ionicons name="star" size={16} color={formData.campaign_type === 'featured' ? '#fff' : '#6B7280'} />
                  <Text style={[styles.typeBtnText, formData.campaign_type === 'featured' && {color: '#fff'}]}>Featured Ad</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, formData.campaign_type === 'notification' && styles.typeBtnActive]}
                  onPress={() => modalMode !== 'view' && setFormData({...formData, campaign_type: 'notification'})}
                  disabled={modalMode === 'view'}
                >
                  <Ionicons name="notifications" size={16} color={formData.campaign_type === 'notification' ? '#fff' : '#6B7280'} />
                  <Text style={[styles.typeBtnText, formData.campaign_type === 'notification' && {color: '#fff'}]}>Notification</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Ad Title</Text>
              <TextInput 
                style={styles.input} 
                value={formData.title} 
                onChangeText={t => setFormData({...formData, title: t})} 
                placeholder="Summer Sale 50% Off" 
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, {height: 80}]} 
                multiline 
                value={formData.description} 
                onChangeText={t => setFormData({...formData, description: t})} 
                placeholder="Add details..." 
                editable={modalMode !== 'view'}
              />

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.label}>Price (Optional)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.price} 
                    onChangeText={t => setFormData({...formData, price: t})} 
                    placeholder="$0.00" 
                    keyboardType="numeric" 
                    editable={modalMode !== 'view'}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                  <Text style={styles.label}>Discount (%)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.discount} 
                    onChangeText={t => setFormData({...formData, discount: t})} 
                    placeholder="e.g. 15" 
                    keyboardType="numeric" 
                    editable={modalMode !== 'view'}
                  />
                </View>
              </View>

              <Text style={styles.label}>Ad Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={modalMode === 'view'}>
                {formData.image_uri ? (
                  <Image source={{ uri: formData.image_uri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={32} color="#9CA3AF" />
                    <Text style={styles.imagePickerText}>{modalMode === 'view' ? 'No image provided' : 'Tap to select an image'}</Text>
                  </>
                )}
              </TouchableOpacity>

              {modalMode !== 'view' && (
                <TouchableOpacity style={styles.submitBtn} onPress={handleSaveAd} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{modalMode === 'edit' ? 'Update Ad' : 'Submit Ad'}</Text>}
                </TouchableOpacity>
              )}
              {modalMode === 'view' && <View style={{ height: 40 }} />}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={[styles.tabBar, { paddingBottom: 20 }]}>
        <TabBarItem icon="home" label="Dashboard" path="/" />
        <TabBarItem icon="shopping-bag" label="Orders" path="/orders" />
        <TabBarItem icon="tag" label="Coupons" path="/listings" />
        <TabBarItem icon="bullhorn" label="Ads" path="/ads" active />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerContainer: {
    backgroundColor: Colors.light.darkElement,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  iconButton: {
    padding: Spacing.one,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roameoLogoImage: {
    height: 24,
    width: 100,
  },
  badge: {
    position: 'absolute',
    top: -Spacing.one,
    right: -Spacing.one,
    backgroundColor: Colors.light.orange,
    borderRadius: Radius.medium,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: '700',
  },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  content: { padding: 16 },

  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#111827'
  },

  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 4
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabButtonText: {
    color: '#6B7280',
    fontWeight: '500'
  },
  tabButtonTextActive: {
    color: '#111827',
    fontWeight: 'bold'
  },

  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  createBtn: { backgroundColor: '#FF5500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', marginTop: 12, fontSize: 16 },
  adCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  adImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F3F4F6' },
  placeholderImg: { justifyContent: 'center', alignItems: 'center' },
  adInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  adTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  adTypeBadge: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontWeight: '500', marginBottom: 8 },
  adStatus: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  row: { flexDirection: 'row' },
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, gap: 6 },
  typeBtnActive: { backgroundColor: '#FF5500', borderColor: '#FF5500' },
  typeBtnText: { fontWeight: '500', color: '#374151' },
  imagePicker: { height: 150, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  imagePickerText: { color: '#6B7280', marginTop: 8 },
  submitBtn: { backgroundColor: '#FF5500', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4, color: '#8A8A8A' },
  activeTabLabel: { color: '#208AEF', fontWeight: '600' },
});
