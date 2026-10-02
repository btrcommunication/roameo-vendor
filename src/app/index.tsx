// app/index.tsx
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';

const ROAMEO_LOGO = require('../../assets/images/roameo-logo.png');
const DUMMY_BOOKING_1 = 'https://i.pravatar.cc/150?u=aroma';
const DUMMY_BOOKING_2 = 'https://i.pravatar.cc/150?u=signature';
const DUMMY_BOOKING_3 = 'https://i.pravatar.cc/150?u=sunset';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [vendorName, setVendorName] = useState('Loading...');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorImage, setVendorImage] = useState('');
  const [membershipTier, setMembershipTier] = useState('Free');
  const [loading, setLoading] = useState(true);
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    console.log('🟢 Dashboard Mounted');
    loadVendorData();
    fetchRecentOrders();
  }, []);

  // Load vendor data from AsyncStorage
  const loadVendorData = async () => {
    try {
      console.log('📂 Loading vendor data...');

      const vendorDataStr = await AsyncStorage.getItem('vendorData');

      console.log('📄 Vendor Data String:', vendorDataStr);

      if (vendorDataStr) {
        const vendorData = JSON.parse(vendorDataStr);

        console.log('✅ Vendor Data Parsed:', vendorData);

        setVendorName(vendorData.name || 'Vendor');
        setVendorEmail(vendorData.email || '');
        setMembershipTier(vendorData.membership_tier || 'Free');

        if (vendorData.image) {
          setVendorImage(vendorData.image);
        }
      } else {
        console.log('⚠️ No vendor data found');
        setVendorName('Vendor');
      }
    } catch (error) {
      console.error('❌ Error loading vendor data:', error);
      setVendorName('Vendor');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent vendor orders
  const fetchRecentOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = await AsyncStorage.getItem('vendorToken');
      if (!token) return;
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.orders)) {
        setRecentOrders(data.orders.slice(0, 3));
      }
    } catch (e) {
      console.error('❌ Error loading recent orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    console.log('🚪 Logout pressed');

    try {
      console.log('🗑️ Removing vendor session...');

      await AsyncStorage.removeItem('vendorToken');
      console.log('✅ vendorToken removed');

      await AsyncStorage.removeItem('vendorData');
      console.log('✅ vendorData removed');

      const tokenAfterLogout = await AsyncStorage.getItem('vendorToken');

      console.log('🔐 Token after logout:', tokenAfterLogout);

      if (tokenAfterLogout === null) {
        console.log('✅ Logout successful');
        console.log('➡️ Navigating to /auth/login...');
        router.replace('/auth/login');
        console.log('✅ Navigation command executed');
      } else {
        console.error('❌ Token still exists after logout');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Get membership color
  const getMembershipColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold':
        return '#D97706';
      case 'silver':
        return '#718096';
      case 'bronze':
      case 'free':
      default:
        return '#C26E25';
    }
  };

  // Get membership badge
  const getMembershipBadge = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold':
        return '🥇 Gold';
      case 'silver':
        return '🥈 Silver';
      case 'bronze':
      case 'free':
      default:
        return '🥉 Bronze';
    }
  };

  // Get membership benefits
  const getMembershipBenefits = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold':
        return [
          'Everything in Silver, plus:',
          '2 Free Featured Listings on Ads Panel Monthly',
          '2 Free Push Notifications Monthly',
          'Premium Placement: Stand out at the top of searches',
          'Highlighted Profile with badge',
          'Priority Support: Faster response from our team',
          'Detailed Reports & Analytics: Track performance & growth',
          'Automatic Upgrade: Qualify once you reach 21+ customers/mo',
          'Commission: 8% per sale made through Roameo app',
          'Monthly Membership: R149'
        ];
      case 'silver':
        return [
          'Everything in Bronze, plus:',
          '1 Free Featured Listing on Ads Panel Monthly',
          '1 Free Push Notification Monthly',
          'Automatic Upgrade: Receive 11 - 20 customers monthly',
          'Enhanced growth tools & exposure',
          'Commission: 5% per sale made through Roameo app',
          'Monthly Membership: R149'
        ];
      case 'bronze':
      case 'free':
      default:
        return [
          'Business Listing: Basic business profile on Roameo',
          'Location on Map: Show your location to thousands of locals',
          'Special Offers: Add your offers & promotions',
          'Favourites: Customers can save your business',
          'Basic Insights: View basic profile views & engagement',
          'Commission: 0% Platform Fee',
          'Monthly Membership: R149'
        ];
    }
  };

  // Handle plan selection
  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    const benefits = getMembershipBenefits(plan);
    
    Alert.alert(
      `${plan} Package`,
      `Benefits:\n\n${benefits.join('\n')}`,
      [
        {
          text: 'Subscribe Now',
          onPress: () => {
            Alert.alert('Success', `You have successfully upgraded to ${plan} Package!`);
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.mainContainer,
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  const benefits = getMembershipBenefits(membershipTier);
  const displayBenefits = showAllBenefits ? benefits : benefits.slice(0, 4);

  // Membership plans data
  const membershipPlans = [
    {
      tier: 'Bronze',
      icon: '🥉',
      color: '#C26E25',
      price: 'R149/month',
      description: 'Starter Level • Perfect for new businesses getting discovered',
      benefits: getMembershipBenefits('Bronze'),
      commission: '0%'
    },
    {
      tier: 'Silver',
      icon: '🥈',
      color: '#718096',
      price: 'R149/month',
      description: 'Growth Level • More exposure & tools to grow customer base',
      benefits: getMembershipBenefits('Silver'),
      commission: '5%'
    },
    {
      tier: 'Gold',
      icon: '🥇',
      color: '#D97706',
      price: 'R149/month',
      description: 'Premium Level • Maximum visibility & features for serious growth',
      benefits: getMembershipBenefits('Gold'),
      commission: '8%'
    }
  ];

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.six,
        }}
      >
        {/* --- HEADER SECTION --- */}
        <SafeAreaView
          style={styles.headerContainer}
          edges={['top']}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather
                name="bell"
                size={24}
                color={Colors.light.white}
              />

              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.logoGroup}>
              <Image
                source={ROAMEO_LOGO}
                style={styles.roameoLogoImage}
                resizeMode="contain"
              />

              <FontAwesome
                name="map-marker"
                size={20}
                color={Colors.light.orange}
                style={{ marginLeft: 4 }}
              />
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Feather
                name="log-out"
                size={24}
                color={Colors.light.white}
              />
            </TouchableOpacity>
          </View>

          {/* Profile Card with REAL Vendor Name */}
          <View style={styles.profileCard}>
            <Image
              source={{
                uri:
                  vendorImage ||
                  `https://i.pravatar.cc/150?u=${vendorName}`,
              }}
              style={styles.vendorImage}
            />

            <View style={styles.profileInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.vendorName}>
                  {vendorName}
                </Text>

                <View style={[
                  styles.verifiedTag,
                  { backgroundColor: getMembershipColor(membershipTier) + '33' }
                ]}>
                  <Text style={[
                    styles.verifiedText,
                    { color: getMembershipColor(membershipTier) }
                  ]}>
                    {getMembershipBadge(membershipTier)}
                  </Text>
                </View>
              </View>

              <Text style={styles.vendorType}>
                {vendorEmail}
              </Text>

              <View style={styles.ratingRow}>
                <FontAwesome
                  name="star"
                  size={14}
                  color="#FFC107"
                />

                <Text style={styles.ratingText}>
                  4.8{' '}
                  <Text style={styles.reviewCount}>
                    (128 Reviews)
                  </Text>
                </Text>
              </View>
            </View>

          </View>

          {/* Plan Info */}
          <View style={styles.planInfoRow}>
            <View>
              <Text style={styles.planLabel}>
                Your Plan
              </Text>

              <Text style={[
                styles.planName,
                { color: getMembershipColor(membershipTier) }
              ]}>
                {membershipTier} Membership
              </Text>
            </View>

            <View style={styles.validUntilGroup}>
              <Text style={styles.planLabel}>
                Plan Valid Till
              </Text>

              <Text style={styles.planDate}>
                24 Jun 2025
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* --- MAIN CONTENT AREA --- */}
        <View style={styles.contentContainer}>
          {/* Overview Grid */}
          <View
            style={[
              styles.sectionHeader,
              { marginTop: Spacing.four },
            ]}
          >
            <Text style={styles.sectionTitle}>
              Overview
            </Text>

            <TouchableOpacity
              style={styles.viewLinkGroup}
            >
              <Text style={styles.viewLink}>
                View Analytics
              </Text>

              <Feather
                name="chevron-right"
                size={16}
                color={Colors.light.orange}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewGrid}>
            <OverviewCard
              icon="calendar-check"
              iconColor={Colors.light.orange}
              label="Bookings"
              value="24"
              stat="+ 18% this week"
            />

            <OverviewCard
              icon="wallet-outline"
              iconColor={Colors.light.green}
              label="Earnings"
              value="$1,245"
              stat="+ 12% this week"
            />

            <OverviewCard
              icon="eye-outline"
              iconColor={Colors.light.purple}
              label="Profile Views"
              value="1,248"
              stat="+ 22% this week"
            />

            <OverviewCard
              icon="star-face"
              iconColor={Colors.light.blue}
              label="Avg. Rating"
              value="4.8"
              stat="+ 0.3 this week"
            />
          </View>

          {/* Membership Benefits Section */}
          <View style={styles.membershipSection}>
            <View style={styles.membershipHeader}>
              <View style={styles.membershipTitleRow}>
                <Text style={styles.membershipTitle}>
                  {membershipTier} Membership Benefits
                </Text>
                <View style={[
                  styles.membershipBadge,
                  { backgroundColor: getMembershipColor(membershipTier) }
                ]}>
                  <Text style={styles.membershipBadgeText}>
                    {membershipTier === 'Gold' ? '👑' : membershipTier === 'Silver' ? '⭐' : '🆓'}
                  </Text>
                </View>
              </View>
              <Text style={styles.membershipSubtitle}>
                {membershipTier === 'Gold' ? 'Maximum exposure & premium features' :
                 membershipTier === 'Silver' ? 'Enhanced visibility & growth tools' :
                 'Start with essential features'}
              </Text>
            </View>

            <View style={styles.benefitsList}>
              {displayBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[
                    styles.benefitDot,
                    { backgroundColor: getMembershipColor(membershipTier) }
                  ]} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {benefits.length > 4 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllBenefits(!showAllBenefits)}
              >
                <Text style={styles.showMoreText}>
                  {showAllBenefits ? 'Show Less ▲' : `Show ${benefits.length - 4} More Benefits ▼`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Upgrade Button for Bronze/Silver users */}
            {membershipTier.toLowerCase() !== 'gold' && (
              <TouchableOpacity
                style={styles.upgradeMembershipButton}
                onPress={() => setShowUpgradeModal(true)}
              >
                <Text style={styles.upgradeMembershipText}>
                  {membershipTier.toLowerCase() === 'gold' ? 'Gold Plan Active' : (membershipTier.toLowerCase() === 'silver' ? 'Upgrade to Gold' : 'Upgrade to Silver or Gold')}
                </Text>
                <Feather name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Recent Orders */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Orders
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push('/orders' as any)
              }
            >
              <Text style={styles.viewLink}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bookingList}>
            {recentOrders.length > 0 ? (
              recentOrders.map((ord: any) => {
                const firstItem = ord.items && ord.items[0];
                const rawImg = firstItem?.thumbnail_url || firstItem?.image_url;
                const fullImg = rawImg 
                  ? (rawImg.startsWith('http') ? rawImg : `${process.env.EXPO_PUBLIC_BASE_URL}/${rawImg.replace(/^\/+/, '')}`)
                  : DUMMY_BOOKING_1;
                const statusColor = ord.status === 'confirmed' || ord.status === 'completed' 
                  ? Colors.light.green 
                  : (ord.status === 'cancelled' ? '#E53935' : Colors.light.orange);
                const statusBg = ord.status === 'confirmed' || ord.status === 'completed'
                  ? Colors.light.greenBg
                  : (ord.status === 'cancelled' ? '#FFEBEE' : Colors.light.orangeBg);

                return (
                  <BookingItem
                    key={ord.id}
                    image={fullImg}
                    title={firstItem ? firstItem.title : `Order #${ord.id}`}
                    date={new Date(ord.created_at).toLocaleDateString()}
                    price={Number(ord.total_amount).toFixed(2)}
                    status={ord.status ? (ord.status.charAt(0).toUpperCase() + ord.status.slice(1)) : 'Placed'}
                    statusColor={statusColor}
                    statusBg={statusBg}
                    onPress={() =>
                      router.push('/orders' as any)
                    }
                  />
                );
              })
            ) : (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: Colors.light.textDim, fontSize: 14 }}>
                  {ordersLoading ? 'Loading recent orders...' : 'No recent orders yet'}
                </Text>
              </View>
            )}
          </View>


        </View>
      </ScrollView>

      {/* --- CUSTOM BOTTOM TAB BAR --- */}
      <View
        style={[
          styles.tabBar,
          {
            paddingBottom:
              insets.bottom + Spacing.two,
          },
        ]}
      >
        <TabBarItem
          icon="home"
          label="Dashboard"
          active
          path="/"
        />

        <TabBarItem
          icon="shopping-bag"
          label="Orders"
          path="/orders"
        />

        <TabBarItem
          icon="wallet"
          label="Revenue"
          path="/revenue"
        />

        <TabBarItem
          icon="tag"
          label="Coupons"
          path="/listings"
        />
        <TabBarItem
          icon="bullhorn"
          label="Ads"
          path="/ads"
        />

      </View>

      {/* --- UPGRADE MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUpgradeModal}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Plan</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Feather name="x" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {membershipPlans.map((plan, index) => {
                const isCurrentPlan = plan.tier.toLowerCase() === membershipTier.toLowerCase();
                const isUpgrade = !isCurrentPlan && membershipTier.toLowerCase() !== 'gold';
                const canUpgrade = plan.tier.toLowerCase() !== membershipTier.toLowerCase();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.planCard,
                      { borderColor: plan.color },
                      isCurrentPlan && styles.planCardActive,
                      isCurrentPlan && { backgroundColor: plan.color + '15' }
                    ]}
                    onPress={() => {
                      if (canUpgrade) {
                        handlePlanSelect(plan.tier);
                      } else {
                        Alert.alert('Current Plan', `You are already on the ${plan.tier} plan.`);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planCardHeader}>
                      <View style={[styles.planIconContainer, { backgroundColor: plan.color + '25' }]}>
                        <Text style={styles.planIcon}>{plan.icon}</Text>
                      </View>
                      <View style={styles.planHeaderContent}>
                        <Text style={[styles.planCardTitle, { color: plan.color }]}>
                          {plan.tier} Plan
                        </Text>
                        {isCurrentPlan && (
                          <View style={styles.currentPlanBadge}>
                            <Text style={styles.currentPlanBadgeText}>CURRENT</Text>
                          </View>
                        )}
                        {!isCurrentPlan && isUpgrade && (
                          <View style={styles.upgradeBadge}>
                            <Text style={styles.upgradeBadgeText}>UPGRADE</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.planPriceContainer}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      {plan.commission && (
                        <Text style={styles.planCommission}>
                          Commission: {plan.commission}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.planDescription}>{plan.description}</Text>

                    <View style={styles.planBenefitsContainer}>
                      {plan.benefits.slice(0, 4).map((benefit, idx) => (
                        <View key={idx} style={styles.planBenefitItem}>
                          <View style={[styles.planBenefitDot, { backgroundColor: plan.color }]} />
                          <Text style={styles.planBenefitText}>{benefit}</Text>
                        </View>
                      ))}
                      {plan.benefits.length > 4 && (
                        <Text style={styles.planMoreBenefits}>
                          +{plan.benefits.length - 4} more benefits
                        </Text>
                      )}
                    </View>

                    {canUpgrade ? (
                      <TouchableOpacity
                        style={[styles.planSelectButton, { backgroundColor: plan.color }]}
                        onPress={() => handlePlanSelect(plan.tier)}
                      >
                        <Text style={styles.planSelectButtonText}>
                          {membershipTier.toLowerCase() === 'free' ? `Upgrade to ${plan.tier}` : `Switch to ${plan.tier}`}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.planSelectButton, styles.planCurrentButton]}>
                        <Text style={styles.planSelectButtonText}>Current Plan</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- HELPER COMPONENTS ---

const OverviewCard = ({
  icon,
  iconColor,
  label,
  value,
  stat,
}: any) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={iconColor}
      />

      <Text style={styles.cardValue}>
        {value}
      </Text>
    </View>

    <Text style={styles.cardLabel}>
      {label}
    </Text>

    <Text
      style={[
        styles.cardStat,
        { color: Colors.light.green },
      ]}
    >
      {stat}
    </Text>
  </View>
);

const BookingItem = ({
  image,
  title,
  date,
  price,
  status,
  statusColor,
  statusBg,
  onPress,
}: any) => (
  <TouchableOpacity
    style={styles.bookingItem}
    onPress={onPress}
  >
    <Image
      source={{ uri: image }}
      style={styles.bookingImage}
    />

    <View style={styles.bookingInfo}>
      <View style={styles.bookingTitleRow}>
        <Text
          style={styles.bookingTitle}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusBg },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: statusColor },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetailsRow}>
        <Text style={styles.bookingDate}>
          {date}
        </Text>

        <Text style={styles.bookingPrice}>
          ${price}
        </Text>
      </View>
    </View>

    <Feather
      name="chevron-right"
      size={18}
      color={Colors.light.textDim}
      style={{ marginLeft: Spacing.one }}
    />
  </TouchableOpacity>
);

const QuickActionButton = ({
  icon,
  label,
  onPress,
}: any) => (
  <TouchableOpacity
    style={styles.qaButton}
    onPress={onPress}
  >
    <View style={styles.qaIconContainer}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={Colors.light.orange}
      />
    </View>

    <Text
      style={styles.qaLabel}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
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
      {icon === 'wallet' || icon === 'wallet-outline' ? (
        <Ionicons
          name={active ? 'wallet' : 'wallet-outline'}
          size={21}
          color={
            active
              ? Colors.light.orange
              : Colors.light.textDim
          }
        />
      ) : (
        <FontAwesome
          name={icon}
          size={22}
          color={
            active
              ? Colors.light.orange
              : Colors.light.textDim
          }
        />
      )}

      <Text
        style={[
          styles.tabLabel,
          active && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  scrollView: {
    flex: 1,
  },

  headerContainer: {
    backgroundColor: Colors.light.darkElement,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.four,
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

  profileCard: {
    backgroundColor: Colors.light.white,
    padding: Spacing.four,
    borderRadius: Radius.large,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  vendorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.three,
  },

  profileInfo: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.one,
    flexWrap: 'wrap',
  },

  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },

  verifiedTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.small,
    marginLeft: Spacing.two,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },

  vendorType: {
    fontSize: 12,
    color: Colors.light.textDim,
    marginBottom: Spacing.one,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  reviewCount: {
    fontWeight: '400',
    color: Colors.light.textDim,
  },

  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: Spacing.three,
  },

  validUntilGroup: {
    alignItems: 'flex-end',
  },

  planLabel: {
    fontSize: 12,
    color: '#BBBBBB',
    marginBottom: 2,
  },

  planName: {
    fontSize: 14,
    fontWeight: '600',
  },

  planDate: {
    fontSize: 14,
    color: Colors.light.white,
    fontWeight: '600',
  },

  contentContainer: {
    paddingHorizontal: Spacing.four,
    backgroundColor: Colors.light.background,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },

  viewLinkGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewLink: {
    fontSize: 12,
    color: Colors.light.orange,
    fontWeight: '600',
  },

  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },

  cardContainer: {
    width: '47.5%',
    backgroundColor: Colors.light.card,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderColor: Colors.light.border,
    borderWidth: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },

  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },

  cardLabel: {
    fontSize: 12,
    color: Colors.light.textDim,
    marginBottom: 2,
  },

  cardStat: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Membership Section Styles
  membershipSection: {
    backgroundColor: Colors.light.white,
    borderRadius: Radius.large,
    padding: Spacing.four,
    marginTop: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  membershipHeader: {
    marginBottom: Spacing.three,
  },

  membershipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  membershipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },

  membershipBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.medium,
    minWidth: 36,
    alignItems: 'center',
  },

  membershipBadgeText: {
    fontSize: 18,
  },

  membershipSubtitle: {
    fontSize: 12,
    color: Colors.light.textDim,
    marginTop: Spacing.one,
  },

  benefitsList: {
    gap: Spacing.two,
  },

  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },

  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  benefitText: {
    fontSize: 12,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 18,
  },

  showMoreButton: {
    marginTop: Spacing.three,
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },

  showMoreText: {
    fontSize: 13,
    color: Colors.light.orange,
    fontWeight: '600',
  },

  upgradeMembershipButton: {
    backgroundColor: Colors.light.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    marginTop: Spacing.three,
    gap: Spacing.one,
  },

  upgradeMembershipText: {
    color: Colors.light.white,
    fontSize: 14,
    fontWeight: '700',
  },

  bookingList: {
    gap: Spacing.three,
  },

  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  bookingImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: Spacing.three,
  },

  bookingInfo: {
    flex: 1,
  },

  bookingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  bookingTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: Spacing.two,
  },

  statusBadge: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bookingDate: {
    fontSize: 12,
    color: Colors.light.textDim,
  },

  bookingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },

  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },

  qaButton: {
    width: '23%',
    alignItems: 'center',
  },

  qaIconContainer: {
    backgroundColor: Colors.light.background,
    width: 50,
    height: 50,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.light.border,
    borderWidth: 1,
    marginBottom: Spacing.one,
  },

  qaLabel: {
    fontSize: 11,
    color: Colors.light.text,
    textAlign: 'center',
  },

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
    borderTopColor: Colors.light.border,
    justifyContent: 'space-between',
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  tabLabel: {
    fontSize: 11,
    color: Colors.light.textDim,
    marginTop: 4,
    fontWeight: '500',
  },

  tabLabelActive: {
    color: Colors.light.orange,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Radius.large,
    padding: Spacing.four,
    width: '92%',
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },

  modalCloseButton: {
    padding: Spacing.one,
  },

  modalScrollContent: {
    paddingBottom: Spacing.two,
  },

  planCard: {
    backgroundColor: Colors.light.white,
    borderRadius: Radius.large,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  planCardActive: {
    borderWidth: 2,
    shadowOpacity: 0.1,
  },

  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },

  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },

  planIcon: {
    fontSize: 22,
  },

  planHeaderContent: {
    flex: 1,
  },

  planCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  currentPlanBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.small,
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  currentPlanBadgeText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: '700',
  },

  upgradeBadge: {
    backgroundColor: Colors.light.orange,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.small,
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  upgradeBadgeText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: '700',
  },

  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },

  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },

  planCommission: {
    fontSize: 12,
    color: Colors.light.textDim,
    fontWeight: '500',
  },

  planDescription: {
    fontSize: 12,
    color: Colors.light.textDim,
    marginBottom: Spacing.three,
  },

  planBenefitsContainer: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },

  planBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },

  planBenefitDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  planBenefitText: {
    fontSize: 12,
    color: Colors.light.text,
    flex: 1,
  },

  planMoreBenefits: {
    fontSize: 12,
    color: Colors.light.orange,
    fontWeight: '600',
    marginTop: 2,
  },

  planSelectButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },

  planSelectButtonText: {
    color: Colors.light.white,
    fontSize: 14,
    fontWeight: '700',
  },

  planCurrentButton: {
    backgroundColor: '#E0E0E0',
  },
});
