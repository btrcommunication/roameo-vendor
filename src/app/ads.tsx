import { Colors, Radius, Spacing } from '@/constants/theme';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');

const API_BASE_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api`;

const TabBarItem = ({ icon, label, active = false, path }: any) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.tabItem} onPress={() => router.push(path)}>
      {icon === 'wallet' || icon === 'wallet-outline' ? (
        <Ionicons name={active ? 'wallet' : 'wallet-outline'} size={21} color={active ? '#FF6B00' : '#8A8A8A'} />
      ) : (
        <FontAwesome name={icon} size={21} color={active ? '#FF6B00' : '#8A8A8A'} />
      )}
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function Ads() {
  const [ads, setAds] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendorCoupons, setVendorCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'featured' | 'notification'>('featured');

  // View Mode: 'ads' or 'analytics'
  const [viewSection, setViewSection] = useState<'ads' | 'analytics'>('ads');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsSearch, setAnalyticsSearch] = useState('');

  // Targeting State
  const [targetScopeTab, setTargetScopeTab] = useState<'all' | 'category' | 'coupon'>('all');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    id: null as number | null,
    title: '',
    description: '',
    price: '',
    discount: '',
    discount_type: 'percentage' as 'percentage' | 'lumpsum',
    campaign_type: 'featured',
    image_uri: null as string | null,
    image_file_name: '',
    image_base64: null as string | null,
    start_date: '',
    end_date: '',
    approval_status: '',
    disapproval_reason: ''
  });

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchAnalyticsSummary = async (vId: string) => {
    if (!vId) return;
    try {
      setAnalyticsLoading(true);
      const res = await fetch(`${API_BASE_URL}/vendorcreation/ads/reports/summary?vendor_id=${vId}`);
      const json = await res.json();
      if (json.status === 'success') {
        setAnalyticsData(json.data);
      }
    } catch (e) {
      console.error('Fetch analytics summary failed:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const downloadReportPDF = (data: any, titlePrefix: string = 'Vendor_Ads_Report') => {
    if (!data) return;
    const adsList = data.ads || [];
    const summary = data.summary || {};
    const generatedAt = new Date().toLocaleString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titlePrefix}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; padding: 24px; margin: 0; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FF5500; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #111827; margin: 0; }
          .subtitle { font-size: 13px; color: #6B7280; margin-top: 4px; }
          .badge { background: #FFF5EB; color: #FF5500; border: 1px solid #FFE0CC; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center; }
          .kpi-val { font-size: 20px; font-weight: bold; color: #FF5500; }
          .kpi-lbl { font-size: 11px; color: #6B7280; text-transform: uppercase; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
          th { background: #F3F4F6; color: #374151; font-weight: 600; text-align: left; padding: 10px 8px; border-bottom: 1px solid #D1D5DB; }
          td { padding: 9px 8px; border-bottom: 1px solid #E5E7EB; color: #1F2937; }
          tr:nth-child(even) { background-color: #FAFAFA; }
          .status-approved { color: #059669; font-weight: 600; }
          .status-pending { color: #D97706; font-weight: 600; }
          .status-disapproved { color: #DC2626; font-weight: 600; }
          .footer { margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">📢 Ad Performance & Analytics Report</h1>
            <div class="subtitle">Generated on ${generatedAt} • Roameo Vendor Portal</div>
          </div>
          <div class="badge">Official Report</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-val">${summary.total_ads || adsList.length}</div><div class="kpi-lbl">Total Ads</div></div>
          <div class="kpi-card"><div class="kpi-val">${summary.total_impressions || 0}</div><div class="kpi-lbl">Total Impressions</div></div>
          <div class="kpi-card"><div class="kpi-val">${summary.total_clicks || 0}</div><div class="kpi-lbl">Total Clicks</div></div>
          <div class="kpi-card"><div class="kpi-val">${summary.average_ctr || 0}%</div><div class="kpi-lbl">Avg CTR</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#ID</th>
              <th>Ad Title / Campaign</th>
              <th>Type</th>
              <th>Target Scope</th>
              <th style="text-align: right;">Impressions</th>
              <th style="text-align: right;">Clicks</th>
              <th style="text-align: right;">CTR (%)</th>
              <th>Status</th>
              <th>Dates</th>
            </tr>
          </thead>
          <tbody>
            ${adsList.map((a: any) => `
              <tr>
                <td>#${a.id}</td>
                <td><strong>${a.title}</strong>${a.category_name ? `<br><small style="color:#6B7280">${a.category_name}</small>` : ''}</td>
                <td>${a.campaign_type === 'notification' ? 'Notification' : 'Featured'}</td>
                <td>${a.target_type === 'coupon' ? 'Coupons' : a.target_type === 'category' ? 'Category' : 'Store-Wide'}</td>
                <td style="text-align: right; font-weight: 600;">${a.total_impressions || 0}</td>
                <td style="text-align: right; font-weight: 600; color: #2563EB;">${a.total_clicks || 0}</td>
                <td style="text-align: right; font-weight: 600; color: #FF5500;">${a.ctr || 0}%</td>
                <td class="status-${a.approval_status || 'pending'}">${(a.approval_status || 'pending').toUpperCase()}</td>
                <td>${a.start_date ? new Date(a.start_date).toLocaleDateString() : 'N/A'} - ${a.end_date ? new Date(a.end_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Roameo Ads Management Analytics System</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    } else {
      Alert.alert('Download Report', 'Report generation is ready. Please view or print on web.');
    }
  };

  const openReportModal = async (ad: any) => {
    try {
      setReportLoading(true);
      setReportData(null);
      setReportModalVisible(true);
      const res = await fetch(`${API_BASE_URL}/vendorcreation/ads/${ad.id}/report`);
      const json = await res.json();
      if (json.status === 'success') {
        setReportData(json.data);
      } else {
        Alert.alert('Error', json.message || 'Failed to fetch report');
      }
    } catch (e) {
      console.error('Fetch report error:', e);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadVendorAndAds();
  }, []);

  const loadVendorAndAds = async () => {
    try {
      setLoading(true);
      const dataStr = await AsyncStorage.getItem('vendorData');
      if (dataStr) {
        const vendor = JSON.parse(dataStr);
        const vId = vendor.id || vendor.vendor_id;
        if (vId) {
          setVendorId(String(vId));
          await Promise.all([
            fetchAds(String(vId)),
            fetchCategoriesAndCoupons(String(vId)),
            fetchAnalyticsSummary(String(vId))
          ]);
        } else {
          setAds([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndCoupons = async (vId: string) => {
    try {
      const [catRes, coupRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`).catch(() => null),
        fetch(`${API_BASE_URL}/coupons?vendor_id=${vId}`).catch(() => null)
      ]);

      if (catRes) {
        const catData = await catRes.json();
        const list = catData.data || catData.categories || (Array.isArray(catData) ? catData : []);
        setCategories(list);
      }

      if (coupRes) {
        const coupData = await coupRes.json();
        const list = coupData.data || coupData.coupons || (Array.isArray(coupData) ? coupData : []);
        setVendorCoupons(list);
      }
    } catch (e) {
      console.error('Error fetching categories/coupons:', e);
    }
  };

  const fetchAds = async (vId: string) => {
    if (!vId) {
      setAds([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/vendorcreation/ads?vendor_id=${vId}`);
      const data = await response.json();
      if (data.status === 'success') {
        const myAds = (data.data || []).filter((ad: any) => String(ad.vendor_id) === String(vId));
        setAds(myAds);
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

  const toggleCategorySelection = (catId: number) => {
    if (modalMode === 'view') return;
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const toggleCouponSelection = (coupId: number) => {
    if (modalMode === 'view') return;
    setSelectedCoupons(prev => {
      if (prev.includes(coupId)) {
        return prev.filter(id => id !== coupId);
      } else {
        return [...prev, coupId];
      }
    });
  };

  // Coupons auto-filtered by selected categories
  const filteredVendorCoupons = vendorCoupons.filter((c: any) => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(Number(c.category_id));
  });

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
      dataToSend.append('discount_type', formData.discount_type || 'percentage');

      // Determine Target Scope
      let finalTargetType = targetScopeTab;
      if (targetScopeTab === 'coupon' && selectedCoupons.length === 0 && selectedCategories.length > 0) {
        finalTargetType = 'category';
      } else if (targetScopeTab !== 'all' && selectedCategories.length === 0 && selectedCoupons.length === 0) {
        finalTargetType = 'all';
      }

      dataToSend.append('target_type', finalTargetType);
      dataToSend.append('category_ids', JSON.stringify(selectedCategories));
      dataToSend.append('coupon_ids', JSON.stringify(selectedCoupons));
      if (selectedCategories.length > 0) {
        dataToSend.append('category_id', String(selectedCategories[0]));
      }
      if (selectedCoupons.length > 0) {
        dataToSend.append('coupon_id', String(selectedCoupons[0]));
      }

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
      discount_type: 'percentage',
      campaign_type: 'featured',
      image_uri: null,
      image_file_name: '',
      image_base64: null,
      start_date: '',
      end_date: '',
      approval_status: '',
      disapproval_reason: ''
    });
    setTargetScopeTab('all');
    setSelectedCategories([]);
    setSelectedCoupons([]);
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
      discount_type: (ad.discount_type as 'percentage' | 'lumpsum') || 'percentage',
      campaign_type: ad.campaign_type || 'featured',
      image_uri: getFullImageUrl(ad.image_url),
      image_file_name: '',
      image_base64: null,
      start_date: ad.start_date || '',
      end_date: ad.end_date || '',
      approval_status: ad.approval_status || 'pending',
      disapproval_reason: ad.disapproval_reason || ''
    });

    // Parse category IDs
    let catIds: number[] = [];
    if (ad.category_ids) {
      try {
        const parsed = typeof ad.category_ids === 'string' ? JSON.parse(ad.category_ids) : ad.category_ids;
        if (Array.isArray(parsed)) catIds = parsed.map(Number).filter((n: number) => !isNaN(n) && n > 0);
        else if (typeof ad.category_ids === 'string') catIds = ad.category_ids.split(',').map(Number).filter((n: number) => !isNaN(n) && n > 0);
      } catch (e) {
        catIds = String(ad.category_ids).split(',').map(Number).filter(n => !isNaN(n) && n > 0);
      }
    }
    if (ad.category_id && !catIds.includes(Number(ad.category_id))) {
      catIds.push(Number(ad.category_id));
    }

    // Parse coupon IDs
    let coupIds: number[] = [];
    if (ad.coupon_ids) {
      try {
        const parsed = typeof ad.coupon_ids === 'string' ? JSON.parse(ad.coupon_ids) : ad.coupon_ids;
        if (Array.isArray(parsed)) coupIds = parsed.map(Number).filter((n: number) => !isNaN(n) && n > 0);
        else if (typeof ad.coupon_ids === 'string') coupIds = ad.coupon_ids.split(',').map(Number).filter((n: number) => !isNaN(n) && n > 0);
      } catch (e) {
        coupIds = String(ad.coupon_ids).split(',').map(Number).filter(n => !isNaN(n) && n > 0);
      }
    }
    if (ad.coupon_id && !coupIds.includes(Number(ad.coupon_id))) {
      coupIds.push(Number(ad.coupon_id));
    }

    const tType = (ad.target_type as 'all' | 'category' | 'coupon') || (coupIds.length > 0 ? 'coupon' : catIds.length > 0 ? 'category' : 'all');
    setTargetScopeTab(tType);
    setSelectedCategories(catIds);
    setSelectedCoupons(coupIds);

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

      {/* TOP VIEW MODE SWITCHER */}
      <View style={styles.viewSectionTabs}>
        <TouchableOpacity
          style={[styles.viewSectionBtn, viewSection === 'ads' && styles.viewSectionBtnActive]}
          onPress={() => setViewSection('ads')}
        >
          <Ionicons name="megaphone" size={15} color={viewSection === 'ads' ? '#FF5500' : '#6B7280'} />
          <Text style={[styles.viewSectionBtnText, viewSection === 'ads' && styles.viewSectionBtnTextActive]}>
            My Ads ({ads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewSectionBtn, viewSection === 'analytics' && styles.viewSectionBtnActive]}
          onPress={() => {
            setViewSection('analytics');
            if (vendorId) fetchAnalyticsSummary(vendorId);
          }}
        >
          <Ionicons name="bar-chart" size={15} color={viewSection === 'analytics' ? '#FF5500' : '#6B7280'} />
          <Text style={[styles.viewSectionBtnText, viewSection === 'analytics' && styles.viewSectionBtnTextActive]}>
            Ad Reports & Analysis
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ANALYTICS SECTION */}
        {viewSection === 'analytics' ? (
          <View style={styles.analyticsSection}>
            {/* Analytics Header & Controls */}
            <View style={styles.analyticsControlRow}>
              <View style={[styles.searchContainer, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="search" size={18} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filter campaigns..."
                  value={analyticsSearch}
                  onChangeText={setAnalyticsSearch}
                />
              </View>
              <TouchableOpacity
                style={styles.pdfDownloadBtn}
                onPress={() => downloadReportPDF(analyticsData, 'Vendor_Ad_Analytics_Report')}
              >
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.pdfDownloadBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Analytics KPI strip */}
            {analyticsData?.summary && (
              <View style={styles.analyticsKpiGrid}>
                <View style={styles.analyticsKpiCard}>
                  <Text style={styles.analyticsKpiValue}>{analyticsData.summary.total_ads || 0}</Text>
                  <Text style={styles.analyticsKpiLabel}>Total Ads</Text>
                </View>
                <View style={styles.analyticsKpiCard}>
                  <Text style={[styles.analyticsKpiValue, { color: '#3B82F6' }]}>{analyticsData.summary.total_impressions || 0}</Text>
                  <Text style={styles.analyticsKpiLabel}>Views (Impr.)</Text>
                </View>
                <View style={styles.analyticsKpiCard}>
                  <Text style={[styles.analyticsKpiValue, { color: '#10B981' }]}>{analyticsData.summary.total_clicks || 0}</Text>
                  <Text style={styles.analyticsKpiLabel}>Total Clicks</Text>
                </View>
                <View style={styles.analyticsKpiCard}>
                  <Text style={[styles.analyticsKpiValue, { color: '#FF5500' }]}>{analyticsData.summary.average_ctr || 0}%</Text>
                  <Text style={styles.analyticsKpiLabel}>Avg CTR</Text>
                </View>
              </View>
            )}

            {/* Analytics Table */}
            {analyticsLoading ? (
              <ActivityIndicator color="#FF5500" style={{ marginVertical: 30 }} />
            ) : !analyticsData?.ads || analyticsData.ads.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No ad analytics found.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollWrapper}>
                <View style={[styles.analyticsTableContainer, { minWidth: 740 }]}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 50, textAlign: 'left', paddingLeft: 6 }]}>#ID</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 150, textAlign: 'left', paddingHorizontal: 6 }]}>Campaign</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 85, textAlign: 'center' }]}>Type</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 100, textAlign: 'left', paddingHorizontal: 6 }]}>Targeting</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 70, textAlign: 'center' }]}>Views</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 70, textAlign: 'center' }]}>Clicks</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 70, textAlign: 'center' }]}>CTR</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 70, textAlign: 'center' }]}>Orders</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 85, textAlign: 'center' }]}>Status</Text>
                    <Text style={[styles.analyticsTableHeaderCell, { width: 60, textAlign: 'center' }]}>Detail</Text>
                  </View>

                  {/* Table Rows */}
                  {analyticsData.ads
                    .filter((a: any) => {
                      if (!analyticsSearch.trim()) return true;
                      const q = analyticsSearch.toLowerCase();
                      return (a.title && a.title.toLowerCase().includes(q)) || (a.category_name && a.category_name.toLowerCase().includes(q));
                    })
                    .map((item: any, idx: number) => {
                      const isApproved = item.approval_status === 'approved';
                      const isDisapproved = item.approval_status === 'disapproved';
                      return (
                        <View key={idx} style={[styles.tableDataRow, idx % 2 === 1 && { backgroundColor: '#FAFAFA' }]}>
                          <Text style={[styles.tableDataCell, { width: 50, fontWeight: '700', color: '#6B7280', textAlign: 'left', paddingLeft: 6 }]}>#{item.id}</Text>
                          <View style={{ width: 150, paddingHorizontal: 6 }}>
                            <Text style={styles.tableAdTitle} numberOfLines={1}>{item.title}</Text>
                            {item.category_name && <Text style={styles.tableAdSub} numberOfLines={1}>{item.category_name}</Text>}
                          </View>
                          <View style={{ width: 85, alignItems: 'center' }}>
                            <Text style={[styles.typeBadgePill, item.campaign_type === 'notification' ? styles.typeBadgeNotification : styles.typeBadgeFeatured]}>
                              {item.campaign_type === 'notification' ? 'Notif' : 'Featured'}
                            </Text>
                          </View>
                          <Text style={[styles.tableDataCell, { width: 100, textAlign: 'left', paddingHorizontal: 6 }]} numberOfLines={1}>
                            {item.target_type === 'coupon' ? '🎟️ Coupons' : item.target_type === 'category' ? '📁 Category' : '🌐 Store'}
                          </Text>
                          <Text style={[styles.tableDataCell, { width: 70, textAlign: 'center', fontWeight: '600' }]}>{item.total_impressions || 0}</Text>
                          <Text style={[styles.tableDataCell, { width: 70, textAlign: 'center', fontWeight: '600', color: '#2563EB' }]}>{item.total_clicks || 0}</Text>
                          <Text style={[styles.tableDataCell, { width: 70, textAlign: 'center', fontWeight: '700', color: '#FF5500' }]}>{item.ctr || 0}%</Text>
                          <Text style={[styles.tableDataCell, { width: 70, textAlign: 'center', fontWeight: '700', color: '#059669' }]}>{item.total_orders || 0}</Text>
                          <View style={{ width: 85, alignItems: 'center' }}>
                            <View style={[styles.statusBadgePill, isApproved ? styles.statusApproved : isDisapproved ? styles.statusDisapproved : styles.statusPending]}>
                              <Text style={[styles.statusBadgeText, isApproved ? { color: '#047857' } : isDisapproved ? { color: '#B91C1C' } : { color: '#B45309' }]}>
                                {item.approval_status ? item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1) : 'Pending'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ width: 60, alignItems: 'center' }}>
                            <TouchableOpacity
                              style={styles.tableActionBtn}
                              onPress={() => openReportModal(item)}
                            >
                              <Ionicons name="stats-chart" size={14} color="#FF5500" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                </View>
              </ScrollView>
            )}
          </View>
        ) : (
          <>

        {/* STATS STRIP */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{ads.length}</Text>
            <Text style={styles.statLabel}>All Ads</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{disapprovedCount}</Text>
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
          filteredAds.map((ad, idx) => {
            const isCouponTarget = ad.target_type === 'coupon' || ad.coupon_id;
            const isCategoryTarget = ad.target_type === 'category' || ad.category_id;
            return (
              <TouchableOpacity key={idx} style={styles.adCard} onPress={() => openAdDetails(ad)}>
                {ad.image_url ? (
                  <Image source={{ uri: getFullImageUrl(ad.image_url) || undefined }} style={styles.adImage} />
                ) : (
                  <View style={[styles.adImage, styles.placeholderImg]}>
                    <Ionicons name="image-outline" size={30} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.adInfo}>
                  <Text style={styles.adTitle}>{ad.title}</Text>

                  {/* Targeting Tag */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.adTypeBadge}>{ad.campaign_type === 'notification' ? 'Notification' : 'Featured'}</Text>
                    <View style={styles.targetBadge}>
                      <Ionicons
                        name={isCouponTarget ? 'pricetag-outline' : isCategoryTarget ? 'grid-outline' : 'globe-outline'}
                        size={11}
                        color="#4B5563"
                      />
                      <Text style={styles.targetBadgeText} numberOfLines={1}>
                        {isCouponTarget
                          ? (ad.coupon_title ? `Coupon: ${ad.coupon_title}` : 'Specific Coupon(s)')
                          : isCategoryTarget
                            ? (ad.category_name ? `Category: ${ad.category_name}` : 'By Category')
                            : 'Store-Wide'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.adBottomRow}>
                    <View style={styles.adStatus}>
                      <View style={[styles.statusDot, { backgroundColor: ad.approval_status === 'approved' ? '#10B981' : ad.approval_status === 'disapproved' ? '#EF4444' : '#F59E0B' }]} />
                      <Text style={styles.statusText}>{ad.approval_status ? ad.approval_status.charAt(0).toUpperCase() + ad.approval_status.slice(1) : 'Pending'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewReportBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        openReportModal(ad);
                      }}
                    >
                      <Ionicons name="bar-chart-outline" size={13} color="#FF5500" />
                      <Text style={styles.viewReportBtnText}>Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
          </>
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
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Start Date</Text>
                    <Text style={styles.input}>{new Date(formData.start_date).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>End Date</Text>
                    <Text style={styles.input}>{new Date(formData.end_date).toLocaleDateString()}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Campaign Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeBtn, formData.campaign_type === 'featured' && styles.typeBtnActive]}
                  onPress={() => modalMode !== 'view' && setFormData({ ...formData, campaign_type: 'featured' })}
                  disabled={modalMode === 'view'}
                >
                  <Ionicons name="star" size={16} color={formData.campaign_type === 'featured' ? '#fff' : '#6B7280'} />
                  <Text style={[styles.typeBtnText, formData.campaign_type === 'featured' && { color: '#fff' }]}>Featured Ad</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, formData.campaign_type === 'notification' && styles.typeBtnActive]}
                  onPress={() => modalMode !== 'view' && setFormData({ ...formData, campaign_type: 'notification' })}
                  disabled={modalMode === 'view'}
                >
                  <Ionicons name="notifications" size={16} color={formData.campaign_type === 'notification' ? '#fff' : '#6B7280'} />
                  <Text style={[styles.typeBtnText, formData.campaign_type === 'notification' && { color: '#fff' }]}>Notification</Text>
                </TouchableOpacity>
              </View>

              {/* TARGETING & PROMOTION SCOPE */}
              <View style={styles.targetSection}>
                <View style={styles.targetHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="funnel" size={14} color="#FF5500" />
                    <Text style={styles.targetSectionTitle}>Ad Promotion Scope</Text>
                  </View>
                  <Text style={styles.targetHintText}>
                    {targetScopeTab === 'all'
                      ? 'Store-Wide'
                      : targetScopeTab === 'category'
                      ? `${selectedCategories.length} Categories`
                      : `${selectedCoupons.length} Selected`}
                  </Text>
                </View>

                {/* Scope selector tabs */}
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, targetScopeTab === 'all' && styles.segmentBtnActive]}
                    onPress={() => {
                      if (modalMode !== 'view') {
                        setTargetScopeTab('all');
                        setSelectedCategories([]);
                        setSelectedCoupons([]);
                      }
                    }}
                    disabled={modalMode === 'view'}
                  >
                    <Ionicons name="globe-outline" size={14} color={targetScopeTab === 'all' ? '#FF5500' : '#6B7280'} />
                    <Text style={[styles.segmentBtnText, targetScopeTab === 'all' && styles.segmentBtnTextActive]} numberOfLines={1}>
                      Store-Wide
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, targetScopeTab === 'category' && styles.segmentBtnActive]}
                    onPress={() => modalMode !== 'view' && setTargetScopeTab('category')}
                    disabled={modalMode === 'view'}
                  >
                    <Ionicons name="grid-outline" size={14} color={targetScopeTab === 'category' ? '#FF5500' : '#6B7280'} />
                    <Text style={[styles.segmentBtnText, targetScopeTab === 'category' && styles.segmentBtnTextActive]} numberOfLines={1}>
                      By Category
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, targetScopeTab === 'coupon' && styles.segmentBtnActive]}
                    onPress={() => modalMode !== 'view' && setTargetScopeTab('coupon')}
                    disabled={modalMode === 'view'}
                  >
                    <Ionicons name="pricetag-outline" size={14} color={targetScopeTab === 'coupon' ? '#FF5500' : '#6B7280'} />
                    <Text style={[styles.segmentBtnText, targetScopeTab === 'coupon' && styles.segmentBtnTextActive]} numberOfLines={1}>
                      Coupons
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Store-Wide Notice */}
                {targetScopeTab === 'all' && (
                  <View style={styles.scopeInfoCard}>
                    <Ionicons name="information-circle" size={16} color="#FF5500" />
                    <Text style={styles.scopeInfoText}>
                      Promotes all active listings and coupons across your entire store.
                    </Text>
                  </View>
                )}

                {/* Category Selection Panel */}
                {targetScopeTab !== 'all' && (
                  <View style={styles.subTargetBox}>
                    <View style={styles.subTargetHeader}>
                      <Text style={styles.subTargetTitle}>
                        {targetScopeTab === 'category' ? 'Choose Categories:' : 'Filter by Category:'}
                      </Text>
                      {selectedCategories.length > 0 && modalMode !== 'view' && (
                        <TouchableOpacity onPress={() => setSelectedCategories([])}>
                          <Text style={styles.clearBtnText}>Reset</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.chipsContainer}>
                      {categories.map((cat: any) => {
                        const isSelected = selectedCategories.includes(Number(cat.id));
                        const catName = cat.name || cat.category_name || `Category #${cat.id}`;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => toggleCategorySelection(Number(cat.id))}
                            disabled={modalMode === 'view'}
                          >
                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                              size={14}
                              color={isSelected ? '#fff' : '#6B7280'}
                            />
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{catName}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Category Mode Summary */}
                    {targetScopeTab === 'category' && (
                      <View style={[styles.scopeInfoCard, { marginTop: 12 }]}>
                        <Ionicons name="checkmark-done-circle" size={16} color="#059669" />
                        <Text style={[styles.scopeInfoText, { color: '#065F46' }]}>
                          {selectedCategories.length === 0
                            ? 'Select categories above to focus this promotion on specific categories.'
                            : `Promotes all active deals under ${selectedCategories.length} selected category(ies).`}
                        </Text>
                      </View>
                    )}

                    {/* Specific Coupons Picker */}
                    {targetScopeTab === 'coupon' && (
                      <View style={{ marginTop: 14 }}>
                        <View style={styles.subTargetHeader}>
                          <Text style={styles.subTargetTitle}>
                            Select Coupons {selectedCoupons.length > 0 ? `(${selectedCoupons.length} selected)` : ''}
                          </Text>
                          {selectedCoupons.length > 0 && modalMode !== 'view' && (
                            <TouchableOpacity onPress={() => setSelectedCoupons([])}>
                              <Text style={styles.clearBtnText}>Clear Selected</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {filteredVendorCoupons.length === 0 ? (
                          <View style={styles.emptyCard}>
                            <Ionicons name="pricetag-outline" size={22} color="#D1D5DB" />
                            <Text style={styles.emptyCouponsText}>No coupons found matching category selection.</Text>
                          </View>
                        ) : (
                          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                            {filteredVendorCoupons.map((c: any) => {
                              const isChecked = selectedCoupons.includes(Number(c.id));
                              return (
                                <TouchableOpacity
                                  key={c.id}
                                  style={[styles.couponPickItem, isChecked && styles.couponPickItemActive]}
                                  onPress={() => toggleCouponSelection(Number(c.id))}
                                  disabled={modalMode === 'view'}
                                  activeOpacity={0.7}
                                >
                                  <View style={[styles.checkboxCustom, isChecked && styles.checkboxCustomChecked]}>
                                    {isChecked && <Ionicons name="checkmark" size={12} color="#fff" />}
                                  </View>
                                  <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.couponPickTitle, isChecked && styles.couponPickTitleActive]} numberOfLines={1}>
                                      {c.title}
                                    </Text>
                                    <View style={styles.couponMetaRow}>
                                      <View style={styles.couponCatBadge}>
                                        <Text style={styles.couponCatBadgeText} numberOfLines={1}>{c.category_name || 'Category'}</Text>
                                      </View>
                                      {c.price ? (
                                        <Text style={styles.couponPriceTag}>${c.price}</Text>
                                      ) : null}
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Ad Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={t => setFormData({ ...formData, title: t })}
                placeholder="Summer Sale 50% Off"
                editable={modalMode !== 'view'}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={formData.description}
                onChangeText={t => setFormData({ ...formData, description: t })}
                placeholder="Add details..."
                editable={modalMode !== 'view'}
              />

              {/* PRICE SECTION (Commented out per user requirements)
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Price (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={t => setFormData({ ...formData, price: t })}
                    placeholder="$0.00"
                    keyboardType="numeric"
                    editable={modalMode !== 'view'}
                  />
                </View>
              </View>
              */}

              {/* DISCOUNT / OFFER SECTION */}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Discount / Offer</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>
                    {formData.discount_type === 'lumpsum' ? 'Flat Amount' : 'Percentage'}
                  </Text>
                </View>

                {/* Discount Type Selector */}
                <View style={styles.discountTypeSelector}>
                  <TouchableOpacity
                    style={[styles.discountTypeBtn, formData.discount_type !== 'lumpsum' && styles.discountTypeBtnActive]}
                    onPress={() => modalMode !== 'view' && setFormData({ ...formData, discount_type: 'percentage' })}
                    disabled={modalMode === 'view'}
                  >
                    <Ionicons name="pricetag" size={13} color={formData.discount_type !== 'lumpsum' ? '#FF5500' : '#6B7280'} />
                    <Text style={[styles.discountTypeBtnText, formData.discount_type !== 'lumpsum' && styles.discountTypeBtnTextActive]}>
                      Percentage (%)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.discountTypeBtn, formData.discount_type === 'lumpsum' && styles.discountTypeBtnActive]}
                    onPress={() => modalMode !== 'view' && setFormData({ ...formData, discount_type: 'lumpsum' })}
                    disabled={modalMode === 'view'}
                  >
                    <Ionicons name="cash" size={14} color={formData.discount_type === 'lumpsum' ? '#FF5500' : '#6B7280'} />
                    <Text style={[styles.discountTypeBtnText, formData.discount_type === 'lumpsum' && styles.discountTypeBtnTextActive]}>
                      Lump Sum ($ Flat)
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={formData.discount}
                  onChangeText={t => setFormData({ ...formData, discount: t })}
                  placeholder={
                    formData.discount_type === 'lumpsum'
                      ? 'Enter Lump Sum amount (e.g. 50.00)'
                      : 'Enter discount percentage (e.g. 15)'
                  }
                  keyboardType="numeric"
                  editable={modalMode !== 'view'}
                />
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

      {/* AD PERFORMANCE REPORT MODAL */}
      <Modal visible={reportModalVisible} animationType="slide" transparent onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="stats-chart" size={20} color="#FF5500" />
                <Text style={styles.modalTitle}>Ad Performance Report</Text>
              </View>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {reportLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#FF5500" />
                  <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading live analytics...</Text>
                </View>
              ) : reportData ? (
                <>
                  {/* Ad Header Summary */}
                  <View style={styles.reportAdCard}>
                    {reportData.ad?.image_url && (
                      <Image source={{ uri: getFullImageUrl(reportData.ad.image_url) || undefined }} style={styles.reportAdImg} />
                    )}
                    <View style={{ flex: 1, marginLeft: reportData.ad?.image_url ? 12 : 0 }}>
                      <Text style={styles.reportAdTitle}>{reportData.ad?.title}</Text>
                      <Text style={styles.reportAdSubtitle}>
                        {reportData.ad?.campaign_type === 'notification' ? '📢 Notification Campaign' : '⭐ Featured Campaign'}
                      </Text>
                      <Text style={styles.reportAdDates}>
                        {reportData.ad?.start_date ? new Date(reportData.ad.start_date).toLocaleDateString() : 'N/A'} - {reportData.ad?.end_date ? new Date(reportData.ad.end_date).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* KPI Metrics */}
                  <Text style={styles.sectionHeader}>Performance Overview</Text>
                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                      <Ionicons name="eye-outline" size={20} color="#3B82F6" />
                      <Text style={styles.kpiValue}>{reportData.metrics?.total_impressions || 0}</Text>
                      <Text style={styles.kpiLabel}>Total Views</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Ionicons name="people-outline" size={20} color="#10B981" />
                      <Text style={styles.kpiValue}>{reportData.metrics?.unique_viewers || 0}</Text>
                      <Text style={styles.kpiLabel}>Unique Viewers</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Ionicons name="hand-left-outline" size={20} color="#F59E0B" />
                      <Text style={styles.kpiValue}>{reportData.metrics?.total_clicks || 0}</Text>
                      <Text style={styles.kpiLabel}>Total Clicks</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                      <Text style={styles.kpiValue}>{reportData.metrics?.unique_clickers || 0}</Text>
                      <Text style={styles.kpiLabel}>Unique Clickers</Text>
                    </View>
                  </View>

                  {/* CTR Card */}
                  <View style={styles.ctrCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ctrTitle}>Click-Through Rate (CTR)</Text>
                      <Text style={styles.ctrSubtitle}>Ratio of clicks to total views</Text>
                    </View>
                    <Text style={styles.ctrValue}>{reportData.metrics?.ctr || 0}%</Text>
                  </View>

                  {/* Daily Activity History */}
                  <Text style={styles.sectionHeader}>Activity History (Last 30 Days)</Text>
                  {reportData.daily_trends && reportData.daily_trends.length > 0 ? (
                    <View style={styles.tableContainer}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
                        <Text style={styles.tableHeaderCell}>Views</Text>
                        <Text style={styles.tableHeaderCell}>Clicks</Text>
                        <Text style={styles.tableHeaderCell}>CTR</Text>
                      </View>
                      {reportData.daily_trends.map((row: any, i: number) => (
                        <View key={i} style={[styles.tableRow, i % 2 === 1 && { backgroundColor: '#F9FAFB' }]}>
                          <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '500' }]}>{row.date}</Text>
                          <Text style={styles.tableCell}>{row.impressions}</Text>
                          <Text style={styles.tableCell}>{row.clicks}</Text>
                          <Text style={[styles.tableCell, { color: '#FF5500', fontWeight: 'bold' }]}>{row.ctr}%</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noDataBox}>
                      <Ionicons name="calendar-outline" size={28} color="#9CA3AF" />
                      <Text style={styles.noDataText}>No activity recorded in the selected period yet.</Text>
                    </View>
                  )}

                  <View style={styles.reportFooter}>
                    <Text style={styles.reportFooterText}>Generated dynamically: {new Date(reportData.generated_at).toLocaleString()}</Text>
                  </View>
                </>
              ) : (
                <Text style={{ textAlign: 'center', marginVertical: 30, color: '#6B7280' }}>No report data available.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={[styles.tabBar, { paddingBottom: 20 }]}>
        <TabBarItem icon="home" label="Dashboard" path="/" />
        <TabBarItem icon="shopping-bag" label="Orders" path="/orders" />
        <TabBarItem icon="wallet" label="Revenue" path="/revenue" />
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
  discountTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F2',
    borderRadius: 8,
    padding: 3,
    gap: 4,
    marginBottom: 8,
  },
  discountTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    gap: 4,
  },
  discountTypeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  discountTypeBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  discountTypeBtnTextActive: {
    color: '#FF5500',
    fontWeight: '700',
  },
  submitBtn: { backgroundColor: '#FF5500', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
    maxWidth: 180,
  },
  targetBadgeText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  targetSection: {
    marginTop: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  targetHintText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F2',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 6,
    gap: 4,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: '#FF5500',
    fontWeight: '700',
  },
  scopeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  scopeInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 16,
  },
  subTargetBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subTargetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subTargetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  clearBtnText: {
    fontSize: 11,
    color: '#FF5500',
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 4,
  },
  chipActive: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
  },
  chipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyCouponsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  couponPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  couponPickItemActive: {
    borderColor: '#FF5500',
    backgroundColor: '#FFFBF7',
  },
  checkboxCustom: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxCustomChecked: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
  },
  couponPickTitle: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  couponPickTitleActive: {
    color: '#EA580C',
  },
  couponMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  couponCatBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  couponCatBadgeText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  couponPriceTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },

  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4, color: '#8A8A8A' },
  activeTabLabel: { color: '#208AEF', fontWeight: '600' },
  adBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  viewReportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FFE0CC', gap: 4 },
  viewReportBtnText: { fontSize: 12, color: '#FF5500', fontWeight: '600' },
  reportAdCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  reportAdImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#E5E7EB' },
  reportAdTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  reportAdSubtitle: { fontSize: 13, color: '#4F46E5', marginTop: 2, fontWeight: '500' },
  reportAdDates: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginTop: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  kpiCard: { width: '48%', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginVertical: 4 },
  kpiLabel: { fontSize: 12, color: '#6B7280' },
  ctrCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF5EB', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#FED7AA', marginBottom: 16 },
  ctrTitle: { fontSize: 14, fontWeight: 'bold', color: '#9A3412' },
  ctrSubtitle: { fontSize: 11, color: '#C2410C', marginTop: 2 },
  ctrValue: { fontSize: 22, fontWeight: 'bold', color: '#EA580C' },
  tableContainer: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeaderCell: { flex: 1, fontSize: 12, fontWeight: 'bold', color: '#4B5563', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableCell: { flex: 1, fontSize: 12, color: '#1F2937', textAlign: 'center' },
  noDataBox: { padding: 24, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  noDataText: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  reportFooter: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', marginBottom: 20 },
  reportFooterText: { fontSize: 11, color: '#9CA3AF' },
  viewSectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
    padding: 4,
  },
  viewSectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  viewSectionBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewSectionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewSectionBtnTextActive: {
    color: '#FF5500',
    fontWeight: '700',
  },
  analyticsSection: {
    flex: 1,
    paddingBottom: 20,
  },
  analyticsControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  pdfDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  analyticsKpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  analyticsKpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  analyticsKpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  analyticsKpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  analyticsTableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  analyticsTableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableDataCell: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  tableAdTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  tableAdSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  typeBadgePill: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  typeBadgeNotification: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  typeBadgeFeatured: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusDisapproved: {
    backgroundColor: '#FEE2E2',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  tableActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFF5EB',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
