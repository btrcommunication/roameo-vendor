import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing } from '@/constants/theme';

const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');

type TimeFilter = 'all' | 'month' | 'week' | 'today' | 'custom';

const TabBarItem = ({
  icon,
  label,
  active = false,
  path,
}: {
  icon: any;
  label: string;
  active?: boolean;
  path: '/' | '/orders' | '/revenue' | '/listings' | '/ads' | any;
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.tabItem} onPress={() => router.push(path)}>
      {icon === 'wallet' || icon === 'wallet-outline' ? (
        <Ionicons
          name={active ? 'wallet' : 'wallet-outline'}
          size={21}
          color={active ? '#FF6B00' : '#8A8A8A'}
        />
      ) : (
        <FontAwesome name={icon} size={21} color={active ? '#FF6B00' : '#8A8A8A'} />
      )}
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function RevenueScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [membershipTier, setMembershipTier] = useState('Bronze');

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadVendorData();
    fetchOrders();
  }, []);

  const loadVendorData = async () => {
    try {
      const token = await AsyncStorage.getItem('vendorToken');
      if (token) {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.vendor) {
          setMembershipTier(data.vendor.tier_status || data.vendor.membership_tier || 'Bronze');
          return;
        }
      }
      const vendorDataStr = await AsyncStorage.getItem('vendorData');
      if (vendorDataStr) {
        const vendorData = JSON.parse(vendorDataStr);
        setMembershipTier(vendorData.tier_status || vendorData.membership_tier || 'Bronze');
      }
    } catch (e) {
      console.error('Failed to load vendor data:', e);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('vendorToken');
      if (!token) return;
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch orders for revenue:', e);
    } finally {
      setLoading(false);
    }
  };

  const getCommissionRate = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold':
        return 0.08;
      case 'silver':
        return 0.05;
      case 'bronze':
      case 'free':
      default:
        return 0.00;
    }
  };

  const commissionRate = getCommissionRate(membershipTier);

  // Filter orders by time period
  const filterByTime = (orderList: any[], filter: TimeFilter) => {
    const now = new Date();
    return orderList.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (filter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo;
      } else if (filter === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (filter === 'custom') {
        let valid = true;
        if (customStart) {
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) valid = false;
        }
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) valid = false;
        }
        return valid;
      }
      return true;
    });
  };

  const timeFilteredOrders = filterByTime(orders, timeFilter);

  const displayedOrders = timeFilteredOrders.filter((order) => {
    const firstTitle = order.items && order.items[0] ? order.items[0].title : '';
    const customer = order.customer_name || '';
    const idStr = String(order.id);
    const query = searchQuery.toLowerCase();
    return (
      idStr.includes(query) ||
      firstTitle.toLowerCase().includes(query) ||
      customer.toLowerCase().includes(query)
    );
  });

  // Financial calculations
  const totalGrossRevenue = timeFilteredOrders.reduce(
    (sum, ord) => sum + (Number(ord.total_amount) || 0),
    0
  );
  const totalCommission = totalGrossRevenue * commissionRate;
  const netPayout = totalGrossRevenue - totalCommission;
  const totalOrdersCount = timeFilteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalGrossRevenue / totalOrdersCount : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.darkElement} />

      {/* --- TOP BRANDED HEADER --- */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Feather name="bell" size={24} color={Colors.light.white} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.logoGroup}>
            <Image source={ROAMEO_LOGO} style={styles.roameoLogoImage} resizeMode="contain" />
            <FontAwesome
              name="map-marker"
              size={20}
              color={Colors.light.orange}
              style={{ marginLeft: 4 }}
            />
          </View>

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={28} color={Colors.light.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#F8FAFC', zIndex: 10 }}>
        {/* Title Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Revenue Analytics</Text>
            <Text style={styles.pageSubtitle}>Track earnings, payouts & sales performance</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
            <Ionicons name="refresh" size={18} color="#FF6B00" />
          </TouchableOpacity>
        </View>

        {/* Time Filters */}
        <View style={styles.filterRow}>
          {(['all', 'month', 'week', 'today', 'custom'] as TimeFilter[]).map((f) => {
            const labelMap: Record<TimeFilter, string> = {
              all: 'All Time',
              month: 'This Month',
              week: 'This Week',
              today: 'Today',
              custom: 'Custom',
            };
            const active = timeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setTimeFilter(f)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {labelMap[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Date Range Pickers */}
        {timeFilter === 'custom' && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {Platform.OS === 'web' ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Start Date</Text>
                <input
                  type="date"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Start Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text style={{ fontSize: 13, color: customStart ? '#1E293B' : '#94A3B8', marginLeft: 6 }}>
                    {customStart || 'Select'}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={customStart ? new Date(customStart) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartPicker(Platform.OS === 'ios');
                      if (date) setCustomStart(date.toISOString().split('T')[0]);
                    }}
                  />
                )}
              </View>
            )}

            {Platform.OS === 'web' ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>End Date</Text>
                <input
                  type="date"
                  style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>End Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text style={{ fontSize: 13, color: customEnd ? '#1E293B' : '#94A3B8', marginLeft: 6 }}>
                    {customEnd || 'Select'}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={customEnd ? new Date(customEnd) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndPicker(Platform.OS === 'ios');
                      if (date) setCustomEnd(date.toISOString().split('T')[0]);
                    }}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Revenue Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Gross Revenue */}
          <View style={[styles.metricCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Gross Sales</Text>
              <View style={[styles.metricIconBg, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="trending-up-outline" size={18} color="#10B981" />
              </View>
            </View>
            <Text style={styles.metricValue}>R{totalGrossRevenue.toFixed(2)}</Text>
            <Text style={styles.metricSub}>Total customer payments</Text>
          </View>

          {/* Net Payout */}
          <View style={[styles.metricCard, { borderLeftColor: '#FF6B00', borderLeftWidth: 4 }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Net Payout</Text>
              <View style={[styles.metricIconBg, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="wallet-outline" size={18} color="#FF6B00" />
              </View>
            </View>
            <Text style={[styles.metricValue, { color: '#FF6B00' }]}>R{netPayout.toFixed(2)}</Text>
            <Text style={styles.metricSub}>
              {commissionRate > 0
                ? `After ${(commissionRate * 100).toFixed(0)}% commission`
                : '100% payout (0% commission)'}
            </Text>
          </View>

          {/* Total Orders */}
          <View style={[styles.metricCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Total Orders</Text>
              <View style={[styles.metricIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="receipt-outline" size={18} color="#3B82F6" />
              </View>
            </View>
            <Text style={styles.metricValue}>{totalOrdersCount}</Text>
            <Text style={styles.metricSub}>Sales in selected period</Text>
          </View>

          {/* Avg Order Value */}
          <View style={[styles.metricCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Avg. Sale</Text>
              <View style={[styles.metricIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="stats-chart-outline" size={18} color="#8B5CF6" />
              </View>
            </View>
            <Text style={styles.metricValue}>R{avgOrderValue.toFixed(2)}</Text>
            <Text style={styles.metricSub}>Average per transaction</Text>
          </View>
        </View>

        {/* Membership Tier Commission Banner */}
        <View style={styles.commissionBanner}>
          <View style={styles.commissionHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#FF6B00" />
            <Text style={styles.commissionTitle}>
              {membershipTier} Package • {(commissionRate * 100).toFixed(0)}% Platform Fee
            </Text>
          </View>
          <Text style={styles.commissionText}>
            {commissionRate > 0
              ? `Commission (${(commissionRate * 100).toFixed(0)}%) is deducted automatically on successful sales. Net earnings are credited to your account.`
              : 'Bronze package includes 0% platform commission on all coupon sales. You keep 100% of your earnings!'}
          </Text>
        </View>

        {/* Transactions Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <Text style={styles.sectionCount}>({displayedOrders.length} sales)</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, customer, or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Loading revenue data...</Text>
          </View>
        ) : displayedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySub}>Sales will appear here when customers purchase your coupons.</Text>
          </View>
        ) : (
          displayedOrders.map((ord: any) => {
            const firstItem = ord.items && ord.items[0];
            const gross = Number(ord.total_amount) || 0;
            const comm = gross * commissionRate;
            const net = gross - comm;

            return (
              <View key={ord.id} style={styles.transactionCard}>
                <View style={styles.txHeader}>
                  <View style={styles.txIdGroup}>
                    <Text style={styles.txId}>ORD-{ord.id}</Text>
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={styles.paidBadgeText}>
                        {(ord.payment_status || 'PAID').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.txDate}>
                    {new Date(ord.created_at).toLocaleDateString()} •{' '}
                    {new Date(ord.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <Text style={styles.txTitle}>{firstItem ? firstItem.title : 'Coupon Purchase'}</Text>

                <View style={styles.txCustomerRow}>
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <Text style={styles.txCustomer}>
                    {ord.customer_name || `Customer #${ord.user_id}`}
                  </Text>
                </View>

                <View style={styles.txDivider} />

                <View style={styles.txFinancials}>
                  <View style={styles.txFinancialItem}>
                    <Text style={styles.txFinancialLabel}>Gross</Text>
                    <Text style={styles.txGrossVal}>R{gross.toFixed(2)}</Text>
                  </View>
                  <View style={styles.txFinancialItem}>
                    <Text style={styles.txFinancialLabel}>Fee ({(commissionRate * 100).toFixed(0)}%)</Text>
                    <Text style={styles.txFeeVal}>-R{comm.toFixed(2)}</Text>
                  </View>
                  <View style={styles.txFinancialItem}>
                    <Text style={styles.txFinancialLabel}>Net Payout</Text>
                    <Text style={styles.txNetVal}>+R{net.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- BOTTOM TAB BAR --- */}
      <View style={styles.tabBar}>
        <TabBarItem icon="home" label="Dashboard" path="/" />
        <TabBarItem icon="shopping-bag" label="Orders" path="/orders" />
        <TabBarItem icon="wallet" label="Revenue" path="/revenue" active />
        <TabBarItem icon="tag" label="Coupons" path="/listings" />
        <TabBarItem icon="bullhorn" label="Ads" path="/ads" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: Colors.light.darkElement,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roameoLogoImage: {
    width: 110,
    height: 32,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metricIconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  commissionBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },
  commissionText: {
    fontSize: 12,
    color: '#C2410C',
    lineHeight: 17,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  txDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  txCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  txCustomer: {
    fontSize: 12,
    color: '#64748B',
  },
  txDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  txFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  txFinancialItem: {
    alignItems: 'center',
  },
  txFinancialLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  txGrossVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  txFeeVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  txNetVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-around',
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#8A8A8A',
  },
  activeTabLabel: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
});
