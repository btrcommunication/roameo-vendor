import React, { useState } from 'react';
import { Modal, ActivityIndicator, Image } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius, Spacing } from '@/constants/theme';

const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');

const OrderCard = ({ order, rawOrder, onStatusUpdate, onFetchIssues, onSelectOrder }: any) => {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#FF9800',
      confirmed: '#4CAF50',
      completed: '#2196F3',
      cancelled: '#F44336',
    };
    return colors[status as keyof typeof colors] || '#999';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: 'time-outline',
      confirmed: 'checkmark-circle-outline',
      completed: 'checkbox-outline',
      cancelled: 'close-circle-outline',
    };
    return icons[status as keyof typeof icons] || 'help-circle-outline';
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{order.id}</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {order.payment_status && (
            <View style={[styles.statusBadge, { backgroundColor: order.payment_status === 'paid' ? '#10B981' : '#F59E0B' }]}>
              <Ionicons name="card" size={12} color="#fff" />
              <Text style={styles.statusText}>{order.payment_status === 'paid' ? 'PAID' : String(order.payment_status).toUpperCase()}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status) as any} size={14} color="#fff" />
            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.serviceName}>{order.service}</Text>
      
      <View style={styles.customerInfo}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.customerName}>{order.customer}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{order.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{order.time}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Total:</Text>
          <Text style={styles.priceAmount}>{order.amount}</Text>
          <Text style={styles.itemsCount}>({order.items} {order.items > 1 ? 'Items' : 'Item'})</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#FF6B00', marginRight: 8 }]}
            onPress={() => onSelectOrder(rawOrder)}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.btnText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
            onPress={() => onFetchIssues(Number(order.id.replace('ORD-', '')))}
          >
            <Ionicons name="warning-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Issues</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TabBarItem = ({
  icon,
  label,
  active = false,
  path,
}: {
  icon: any;
  label: string;
  active?: boolean;
  path: '/' | '/orders' | '/listings' | '/ads' | any;
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.tabItem} onPress={() => router.push(path)}>
      <FontAwesome name={icon} size={21} color={active ? '#208AEF' : '#8A8A8A'} />
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuesModalVisible, setIssuesModalVisible] = useState(false);
  const [selectedOrderIssues, setSelectedOrderIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const openDetails = (order: any) => {
    setSelectedOrderDetails(order);
    setDetailsModalVisible(true);
  };

  const fetchIssues = async (orderId: number) => {
    try {
      setLoadingIssues(true);
      setIssuesModalVisible(true);
      setSelectedOrderIssues([]);
      const token = await AsyncStorage.getItem('vendorToken');
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/orders/${orderId}/issues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrderIssues(data.issues);
      }
    } catch (e) {
      console.error('Failed to fetch issues', e);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = String(order.id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
        <Text style={styles.headerTitle}>📋 Orders</Text>
        <Text style={styles.headerSubtitle}>Manage and track your customer orders</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard 
            rawOrder={item}
            onFetchIssues={fetchIssues} 
            onSelectOrder={openDetails}
            order={{
              id: 'ORD-' + item.id,
              service: item.items && item.items[0] ? item.items[0].title : 'Coupon',
              date: new Date(item.created_at).toLocaleDateString(),
              time: new Date(item.created_at).toLocaleTimeString(),
              customer: 'Customer #' + item.user_id,
              amount: '$' + Number(item.total_amount).toFixed(2),
              items: item.total_items,
              status: item.status,
              payment_status: item.payment_status || 'paid',
              payment_method: item.payment_method || 'Stripe Card',
              transaction_id: item.transaction_id,
              phone: undefined,
              notes: undefined
            }} 
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No orders found'}</Text>
          </View>
        }
      />

      <View style={styles.tabBar}>
        <TabBarItem icon="home" label="Dashboard" path="/" />
        <TabBarItem icon="shopping-bag" label="Orders" path="/orders" active />
        <TabBarItem icon="tag" label="Coupons" path="/listings" />
        <TabBarItem icon="bullhorn" label="Ads" path="/ads" />
      </View>
    
      {/* Order Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', width: '90%', maxHeight: '85%', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Order #{selectedOrderDetails?.id} Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedOrderDetails && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Customer: <Text style={{ fontWeight: '600', color: '#111827' }}>Customer #{selectedOrderDetails.user_id}</Text></Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Date: <Text style={{ fontWeight: '500', color: '#111827' }}>{new Date(selectedOrderDetails.created_at).toLocaleString()}</Text></Text>
                </View>

                {/* Items */}
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Order Items</Text>
                {selectedOrderDetails.items?.map((item: any, idx: number) => (
                  <View key={idx} style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{item.title}</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      ${Number(item.price).toFixed(2)} × {item.quantity} = <Text style={{ fontWeight: '600', color: '#111827' }}>${Number(item.subtotal).toFixed(2)}</Text>
                    </Text>
                    {item.redemption_codes?.[0] && (
                      <Text selectable style={{ fontSize: 12, color: '#FF6B00', marginTop: 4, fontWeight: '600' }}>
                        Coupon Code: {item.redemption_codes[0]}
                      </Text>
                    )}
                  </View>
                ))}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Total</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FF6B00' }}>${Number(selectedOrderDetails.total_amount).toFixed(2)}</Text>
                </View>

                {/* Payment Information */}
                <View style={{ marginTop: 12, padding: 14, backgroundColor: selectedOrderDetails.payment_status === 'paid' ? '#F0FDF4' : '#FEF3C7', borderRadius: 10, borderWidth: 1, borderColor: selectedOrderDetails.payment_status === 'paid' ? '#BBF7D0' : '#FDE68A' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="card" size={16} color={selectedOrderDetails.payment_status === 'paid' ? '#15803D' : '#92400E'} />
                    <Text style={{ fontWeight: '700', fontSize: 14, color: selectedOrderDetails.payment_status === 'paid' ? '#15803D' : '#92400E', marginLeft: 6 }}>
                      Payment Information
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>
                    Status: <Text style={{ fontWeight: '700', color: selectedOrderDetails.payment_status === 'paid' ? '#16A34A' : '#D97706' }}>{(selectedOrderDetails.payment_status || 'paid').toUpperCase()}</Text>
                  </Text>
                  <Text style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>
                    Method: <Text style={{ fontWeight: '600' }}>{selectedOrderDetails.payment_method || 'Stripe Card'} {selectedOrderDetails.payment_details?.card_last4 ? `(•••• ${selectedOrderDetails.payment_details.card_last4})` : ''}</Text>
                  </Text>
                  {selectedOrderDetails.transaction_id && (
                    <Text selectable style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      Transaction ID: {selectedOrderDetails.transaction_id}
                    </Text>
                  )}
                  {selectedOrderDetails.payment_details?.customer_email && (
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Customer Email: {selectedOrderDetails.payment_details.customer_email}
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Issues Modal */}
      <Modal
        visible={issuesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssuesModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', width: '90%', maxHeight: '80%', borderRadius: 12, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Customer Issues</Text>
              <TouchableOpacity onPress={() => setIssuesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {loadingIssues ? (
              <ActivityIndicator color="#F59E0B" style={{ marginVertical: 20 }} />
            ) : selectedOrderIssues.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 20 }}>No issues reported by the customer.</Text>
            ) : (
              <FlatList
                data={selectedOrderIssues}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#92400E', marginBottom: 4 }}>
                      <Ionicons name="person" size={12} /> {item.customer_name || 'Customer'}
                    </Text>
                    <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>{item.issue_text}</Text>
                    <Text style={{ fontSize: 12, color: '#B45309', marginTop: 8, textAlign: 'right' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f7fa',
    marginRight: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#1a1a2e',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    paddingTop: 10,
    paddingBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#208AEF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  cardFooter: {
    gap: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  itemsCount: {
    fontSize: 13,
    color: '#999',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  notesText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
  },
  completeBtn: {
    backgroundColor: '#2196F3',
  },
  cancelBtn: {
    backgroundColor: '#F44336',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default Orders;
