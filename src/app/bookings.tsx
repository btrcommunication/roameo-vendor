import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';

// Logo Asset
const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');

// Filter Tabs for Vendor Orders
const TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

// Dummy Orders Data for Vendor
const ORDERS_DATA = [
  {
    id: 'ORD-2025-0001',
    service: 'Aroma Relaxation Massage & Spa Wellness',
    location: 'Glow Wellness Spa, Bali',
    date: '29 May 2025',
    time: '10:00 AM',
    customer: 'Sarah Johnson',
    phone: '+1 202-555-0187',
    amount: '$98.00',
    items: 1,
    status: 'Pending',
    statusColor: '#FF6B00',
    statusBg: '#FFF3E0',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150',
    notes: 'Prefers lavender oil',
  },
  {
    id: 'ORD-2025-0002',
    service: 'Signature Facial Therapy',
    location: 'Glow Wellness Spa, Bali',
    date: '17 May 2025',
    time: '2:00 PM',
    customer: 'Mike Davis',
    phone: '+1 303-555-0123',
    amount: '$75.00',
    items: 1,
    status: 'Pending',
    statusColor: '#FF6B00',
    statusBg: '#FFF3E0',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=150',
    notes: 'Allergic to nuts',
  },
  {
    id: 'ORD-2025-0003',
    service: 'Sunset Yoga Sessions',
    location: 'Yoga With Soul, Goa',
    date: '18 May 2025',
    time: '4:00 PM',
    customer: 'Emma Wilson',
    phone: '+1 415-555-0199',
    amount: '$49.00',
    items: 1,
    status: 'Confirmed',
    statusColor: '#4CAF50',
    statusBg: '#E8F5E9',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=150',
    notes: 'Bring your own mat',
  },
  {
    id: 'ORD-2025-0004',
    service: 'Quantum Dinner Experience',
    location: "Chef's Table, Dubai",
    date: '19 May 2025',
    time: '6:00 PM',
    customer: 'Emily Jones',
    phone: '+1 212-555-0145',
    amount: '$129.00',
    items: 2,
    status: 'Pending',
    statusColor: '#FF6B00',
    statusBg: '#FFF3E0',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150',
    notes: 'Table for 2, window seat preferred',
  },
  {
    id: 'ORD-2025-0005',
    service: 'Deep Tissue Sports Massage',
    location: 'Glow Wellness Spa, Bali',
    date: '20 May 2025',
    time: '11:30 AM',
    customer: 'John Smith',
    phone: '+1 646-555-0101',
    amount: '$110.00',
    items: 1,
    status: 'Completed',
    statusColor: '#7E57C2',
    statusBg: '#EDE7F6',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150',
    notes: 'Focus on lower back',
  },
  {
    id: 'ORD-2025-0006',
    service: 'Aromatherapy Session',
    location: 'Glow Wellness Spa, Bali',
    date: '21 May 2025',
    time: '3:00 PM',
    customer: 'Lisa Brown',
    phone: '+1 303-555-0189',
    amount: '$85.00',
    items: 1,
    status: 'Cancelled',
    statusColor: '#E53935',
    statusBg: '#FFEBEE',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150',
    notes: 'Reschedule requested',
  },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState(ORDERS_DATA);

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'All') return true;
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  // Handle order status update
  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  // Get status color mapping for action buttons
  const getStatusActionConfig = (currentStatus: string) => {
    if (currentStatus === 'Pending') {
      return {
        nextStatus: 'Confirmed',
        label: 'Confirm',
        icon: 'check',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
      };
    } else if (currentStatus === 'Confirmed') {
      return {
        nextStatus: 'Completed',
        label: 'Complete',
        icon: 'checkbox',
        color: '#2196F3',
        bgColor: '#E3F2FD',
      };
    }
    return null;
  };

  // Calculate summary stats
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const totalEarnings = orders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + parseFloat(o.amount.replace('$', '')), 0)
    .toFixed(0);

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + Spacing.seven + Spacing.four 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADER --- */}
        <SafeAreaView style={styles.headerContainer} edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="menu" size={24} color={Colors.light.white} />
            </TouchableOpacity>

            <View style={styles.logoGroup}>
              <Image source={ROAMEO_LOGO} style={styles.roameoLogoImage} resizeMode="contain" />
              <FontAwesome name="map-marker" size={20} color={Colors.light.orange} style={{ marginLeft: 4 }} />
            </View>

            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={24} color={Colors.light.white} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* --- TITLE & ACTIONS ROW --- */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.pageTitle}>📋 Orders</Text>
            <Text style={styles.pageSubtitle}>Manage and track your bookings</Text>
          </View>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="search" size={18} color="#444444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="filter-outline" size={18} color="#444444" />
              <View style={styles.filterDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- FILTER TABS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- ORDERS LIST --- */}
        <View style={styles.ordersList}>
          {filteredOrders.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />

              <View style={styles.cardContent}>
                {/* Header: Order ID & Status */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.id}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.statusBg }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Service Name */}
                <Text style={styles.serviceName} numberOfLines={1}>
                  {item.service}
                </Text>

                {/* Customer Info */}
                <View style={styles.infoRow}>
                  <Feather name="user" size={12} color={Colors.light.textDim} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {item.customer}
                  </Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Feather name="phone" size={12} color={Colors.light.textDim} />
                  <Text style={styles.infoText}>{item.phone}</Text>
                </View>

                {/* Date & Time */}
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={12} color={Colors.light.textDim} />
                  <Text style={styles.infoText}>{item.date}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Feather name="clock" size={12} color={Colors.light.textDim} />
                  <Text style={styles.infoText}>{item.time}</Text>
                </View>

                {/* Notes if available */}
                {item.notes && (
                  <View style={styles.notesRow}>
                    <Feather name="file-text" size={12} color={Colors.light.textDim} />
                    <Text style={styles.notesText} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  </View>
                )}

                {/* Footer: Price & Actions */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Total:</Text>
                    <Text style={styles.priceText}>{item.amount}</Text>
                    <Text style={styles.itemsCount}>
                      ({item.items} {item.items > 1 ? 'Items' : 'Item'})
                    </Text>
                  </View>

                  {/* Action Buttons based on status */}
                  <View style={styles.actionButtons}>
                    {item.status !== 'Completed' && item.status !== 'Cancelled' && (
                      <>
                        {item.status === 'Pending' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.confirmBtn]}
                            onPress={() => handleStatusUpdate(item.id, 'Confirmed')}
                          >
                            <Feather name="check" size={14} color="#fff" />
                            <Text style={styles.btnText}>Confirm</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'Confirmed' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.completeBtn]}
                            onPress={() => handleStatusUpdate(item.id, 'Completed')}
                          >
                            <Feather name="check-square" size={14} color="#fff" />
                            <Text style={styles.btnText}>Complete</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.cancelBtn]}
                          onPress={() => handleStatusUpdate(item.id, 'Cancelled')}
                        >
                          <Feather name="x" size={14} color="#fff" />
                          <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {item.status === 'Completed' && (
                      <View style={styles.statusCompleted}>
                        <Feather name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                    {item.status === 'Cancelled' && (
                      <View style={styles.statusCancelled}>
                        <Feather name="x-circle" size={16} color="#E53935" />
                        <Text style={styles.cancelledText}>Cancelled</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* --- BOTTOM SUMMARY STATS GRID --- */}
        <View style={styles.statsGrid}>
          <SummaryStatCard
            icon="clipboard-list-outline"
            iconBg="#E3F2FD"
            iconColor="#2196F3"
            value={totalOrders.toString()}
            label="Total Orders"
          />
          <SummaryStatCard
            icon="check-circle-outline"
            iconBg="#E8F5E9"
            iconColor="#4CAF50"
            value={confirmedOrders.toString()}
            label="Confirmed"
          />
          <SummaryStatCard
            icon="clock-outline"
            iconBg="#FFF3E0"
            iconColor="#FF6B00"
            value={pendingOrders.toString()}
            label="Pending"
          />
          <SummaryStatCard
            icon="wallet-outline"
            iconBg="#EDE7F6"
            iconColor="#7E57C2"
            value={`$${totalEarnings}`}
            label="Total Earnings"
          />
        </View>
      </ScrollView>

      {/* --- CUSTOM BOTTOM TAB BAR WITH ROUTING --- */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + Spacing.two }]}>
        <TabBarItem icon="home" label="Dashboard" path="/" />
        <TabBarItem icon="shopping-bag" label="Orders" path="/orders" />
        <TabBarItem icon="tag" label="Coupons" path="/listings" />
        <TabBarItem icon="bullhorn" label="Ads" path="/ads" />
      </View>
    </View>
  );
}

{/* --- HELPER COMPONENTS --- */}

const SummaryStatCard = ({ icon, iconBg, iconColor, value, label }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TabBarItem = ({
  icon,
  label,
  active,
  path,
}: {
  icon: any;
  label: string;
  active?: boolean;
  path: string;
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={() => router.push(path as any)}
    >
      <FontAwesome
        name={icon}
        size={20}
        color={active ? Colors.light.orange : Colors.light.textDim}
      />
      <Text style={[styles.tabBarLabel, active && styles.tabBarLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

{/* --- STYLESHEET --- */}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAF9F8',
  },
  scrollView: {
    flex: 1,
  },

  // Header
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
    top: -2,
    right: -2,
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

  // Title Section
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.light.textDim,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.orange,
  },

  // Filter Tabs
  tabsContainer: {
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.three,
    gap: Spacing.four,
  },
  tabButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.light.orange,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textDim,
  },
  tabTextActive: {
    color: Colors.light.orange,
    fontWeight: '700',
  },

  // Orders List & Cards
  ordersList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.light.white,
    borderRadius: Radius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.medium,
    marginRight: Spacing.three,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginRight: Spacing.two,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: Colors.light.textDim,
    flexShrink: 1,
  },
  dotSeparator: {
    fontSize: 12,
    color: Colors.light.textDim,
    paddingHorizontal: 2,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  notesText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.light.textDim,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemsCount: {
    fontSize: 11,
    color: Colors.light.textDim,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
  },
  completeBtn: {
    backgroundColor: '#2196F3',
  },
  cancelBtn: {
    backgroundColor: '#E53935',
  },
  btnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  statusCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statusCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelledText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E53935',
  },

  // Summary Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.white,
    borderRadius: Radius.large,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textDim,
  },

  // Bottom Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.white,
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabBarLabel: {
    fontSize: 11,
    color: Colors.light.textDim,
    marginTop: 4,
    fontWeight: '500',
  },
  tabBarLabelActive: {
    color: Colors.light.orange,
    fontWeight: '600',
  },
});
