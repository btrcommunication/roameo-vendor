import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { CouponPrice } from '@/components/coupon-price';

const ROAMEO_LOGO = require('../../../assets/images/roameo-logo.png');

const API_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api`;
const API_ORIGIN = process.env.EXPO_PUBLIC_BASE_URL;

export default function ListingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [coupons, setCoupons] = useState<any[]>([]);
    const [filteredCoupons, setFilteredCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        approved: 0,
        pending: 0,
    });

    const getVendorSession = async () => {
        try {
            const [token, vendorData] = await Promise.all([
                AsyncStorage.getItem('vendorToken'),
                AsyncStorage.getItem('vendorData'),
            ]);

            if (!token || !vendorData) {
                return null;
            }

            const vendor = JSON.parse(vendorData);
            const vendorId = Number(vendor.id ?? vendor.vendor_id);

            if (!Number.isInteger(vendorId) || vendorId <= 0) {
                return null;
            }

            return { token, vendorId };
        } catch (error) {
            console.error('Error getting vendor session:', error);
            return null;
        }
    };

    const fetchCoupons = async (search = '') => {
        try {
            setLoading(true);

            const session = await getVendorSession();

            if (!session) {
                Alert.alert('Session Expired', 'Please login again to view your coupons.');
                router.replace('/auth/login');
                return;
            }

            let url = `${API_URL}/coupons`;

            const params = new URLSearchParams();

            params.append('vendor_id', session.vendorId.toString());

            if (search) {
                params.append('search', search);
            }

            params.append('limit', '50');

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log('Fetching coupons from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message || 'Failed to fetch coupons'
                );
            }

            const couponsData = data?.data || [];

            setCoupons(couponsData);

            if (search) {
                const searchText = search.toLowerCase();

                const filtered = couponsData.filter((item: any) => {
                    const title = item?.title?.toLowerCase?.() || '';
                    const vendor = item?.vendor_name?.toLowerCase?.() || '';
                    const subtitle = item?.subtitle?.toLowerCase?.() || '';

                    return (
                        title.includes(searchText) ||
                        vendor.includes(searchText) ||
                        subtitle.includes(searchText)
                    );
                });

                setFilteredCoupons(filtered);
            } else {
                setFilteredCoupons(couponsData);
            }

            const activeCoupons = couponsData.filter(
                (item: any) => item?.is_active === 1
            ).length;

            const inactiveCoupons = couponsData.filter(
                (item: any) => item?.is_active === 0
            ).length;

            const approvedCoupons = couponsData.filter(
                (item: any) => item?.is_approved === 1
            ).length;

            const pendingCoupons = couponsData.filter(
                (item: any) => item?.is_approved === 0
            ).length;

            setStats({
                total: couponsData.length,
                active: activeCoupons,
                inactive: inactiveCoupons,
                approved: approvedCoupons,
                pending: pendingCoupons,
            });
        } catch (error) {
            console.error('Error fetching coupons:', error);

            Alert.alert(
                'Error',
                'Failed to load coupons'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCoupons();
        }, [])
    );

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        fetchCoupons(text);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCoupons(searchQuery);
    }, [searchQuery]);

    const formatDate = (dateString: string) => {
        if (!dateString) {
            return 'N/A';
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <View style={styles.mainContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{
                    paddingBottom:
                        insets.bottom + Spacing.six + 60,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                {/* HEADER */}

                <SafeAreaView
                    style={styles.headerContainer}
                    edges={['top']}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            activeOpacity={0.7}
                        >
                            <Feather
                                name="menu"
                                size={24}
                                color={Colors.light.white}
                            />
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
                            activeOpacity={0.7}
                        >
                            <Feather
                                name="bell"
                                size={24}
                                color={Colors.light.white}
                            />

                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    3
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {/* CONTENT */}

                <View style={styles.contentContainer}>
                    {/* TITLE */}

                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pageTitle}>
                                Coupon Listings
                            </Text>

                            <Text style={styles.pageSubtitle}>
                                Manage your business coupons
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.addButton}
                            activeOpacity={0.8}
                            onPress={() =>
                                router.push(
                                    '/listings/new' as any
                                )
                            }
                        >
                            <Feather
                                name="plus"
                                size={16}
                                color={Colors.light.white}
                            />

                            <Text style={styles.addButtonText}>
                                Add New Coupon
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* SEARCH */}

                    <View style={styles.searchFilterRow}>
                        <View style={styles.searchBar}>
                            <Feather
                                name="search"
                                size={18}
                                color="#999999"
                                style={{
                                    marginRight: Spacing.two,
                                }}
                            />

                            <TextInput
                                placeholder="Search coupons by title or vendor..."
                                placeholderTextColor="#999999"
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={handleSearch}
                            />

                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() =>
                                        handleSearch('')
                                    }
                                >
                                    <Feather
                                        name="x"
                                        size={16}
                                        color="#999999"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.filterButton}
                            activeOpacity={0.7}
                            onPress={() => {
                                Alert.alert(
                                    'Filter Coupons',
                                    'Select filter option',
                                    [
                                        {
                                            text: 'Show Active Only',
                                            onPress: () => {
                                                const filtered = coupons.filter(
                                                    (item: any) => item.is_active === 1
                                                );
                                                setFilteredCoupons(filtered);
                                            }
                                        },
                                        {
                                            text: 'Show Approved Only',
                                            onPress: () => {
                                                const filtered = coupons.filter(
                                                    (item: any) => item.is_approved === 1
                                                );
                                                setFilteredCoupons(filtered);
                                            }
                                        },
                                        {
                                            text: 'Show Pending Approval',
                                            onPress: () => {
                                                const filtered = coupons.filter(
                                                    (item: any) => item.is_approved === 0
                                                );
                                                setFilteredCoupons(filtered);
                                            }
                                        },
                                        {
                                            text: 'Reset Filters',
                                            onPress: () => {
                                                setFilteredCoupons(coupons);
                                                setSearchQuery('');
                                            }
                                        },
                                        { text: 'Cancel', style: 'cancel' },
                                    ]
                                );
                            }}
                        >
                            <Ionicons
                                name="options-outline"
                                size={18}
                                color={Colors.light.text}
                            />

                            <Text style={styles.filterText}>
                                Filter
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* STATS */}

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.statsScrollView}
                    >
                        <View style={styles.statsRow}>
                            <TouchableOpacity
                                style={styles.statCard}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityLabel="Show all coupons"
                                onPress={() => setFilteredCoupons(coupons)}
                            >
                                <View
                                    style={[
                                        styles.statIconContainer,
                                        {
                                            backgroundColor:
                                                '#FFF0EA',
                                        },
                                    ]}
                                >
                                    <Feather
                                        name="box"
                                        size={18}
                                        color={
                                            Colors.light.orange
                                        }
                                    />
                                </View>

                                <Text style={styles.statLabel}>
                                    Total Coupons
                                </Text>

                                <Text style={styles.statValue}>
                                    {stats.total}
                                </Text>

                                <Text style={styles.statSubText}>
                                    All Coupons
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statCard}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityLabel="Show active coupons"
                                onPress={() => setFilteredCoupons(coupons.filter((item: any) => item?.is_active === 1))}
                            >
                                <View
                                    style={[
                                        styles.statIconContainer,
                                        {
                                            backgroundColor:
                                                '#E8F8F0',
                                        },
                                    ]}
                                >
                                    <Feather
                                        name="check-circle"
                                        size={18}
                                        color={
                                            Colors.light.green
                                        }
                                    />
                                </View>

                                <Text style={styles.statLabel}>
                                    Active
                                </Text>

                                <Text style={styles.statValue}>
                                    {stats.active}
                                </Text>

                                <Text
                                    style={[
                                        styles.statSubText,
                                        {
                                            color:
                                                Colors.light.green,
                                        },
                                    ]}
                                >
                                    {stats.total > 0
                                        ? Math.round(
                                            (stats.active /
                                                stats.total) *
                                            100
                                        )
                                        : 0}
                                    % of total
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statCard}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityLabel="Show inactive coupons"
                                onPress={() => setFilteredCoupons(coupons.filter((item: any) => item?.is_active === 0))}
                            >
                                <View
                                    style={[
                                        styles.statIconContainer,
                                        {
                                            backgroundColor:
                                                '#FFEBEB',
                                        },
                                    ]}
                                >
                                    <Feather
                                        name="x-circle"
                                        size={18}
                                        color="#E53935"
                                    />
                                </View>

                                <Text style={styles.statLabel}>
                                    Inactive
                                </Text>

                                <Text style={styles.statValue}>
                                    {stats.inactive}
                                </Text>

                                <Text
                                    style={[
                                        styles.statSubText,
                                        {
                                            color: '#E53935',
                                        },
                                    ]}
                                >
                                    {stats.total > 0
                                        ? Math.round(
                                            (stats.inactive /
                                                stats.total) *
                                            100
                                        )
                                        : 0}
                                    % of total
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statCard}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityLabel="Show pending coupons"
                                onPress={() => setFilteredCoupons(coupons.filter((item: any) => item?.is_approved === 0))}
                            >
                                <View
                                    style={[
                                        styles.statIconContainer,
                                        {
                                            backgroundColor:
                                                '#FFF8E1',
                                        },
                                    ]}
                                >
                                    <Feather
                                        name="clock"
                                        size={18}
                                        color="#FFA000"
                                    />
                                </View>

                                <Text style={styles.statLabel}>
                                    Pending
                                </Text>

                                <Text style={styles.statValue}>
                                    {stats.pending}
                                </Text>

                                <Text
                                    style={[
                                        styles.statSubText,
                                        {
                                            color: '#FFA000',
                                        },
                                    ]}
                                >
                                    Awaiting approval
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* LOADING */}

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator
                                size="large"
                                color={Colors.light.orange}
                            />

                            <Text style={styles.loadingText}>
                                Loading coupons...
                            </Text>
                        </View>
                    ) : filteredCoupons.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Feather
                                name="box"
                                size={60}
                                color="#CCCCCC"
                            />

                            <Text style={styles.emptyTitle}>
                                No Coupons Found
                            </Text>

                            <Text style={styles.emptySubtitle}>
                                {searchQuery
                                    ? 'Try adjusting your search'
                                    : 'Create your first coupon now'}
                            </Text>

                            {!searchQuery && (
                                <TouchableOpacity
                                    style={styles.emptyButton}
                                    onPress={() =>
                                        router.push(
                                            '/listings/new' as any
                                        )
                                    }
                                >
                                    <Text
                                        style={
                                            styles.emptyButtonText
                                        }
                                    >
                                        Create New Coupon
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.listingsList}>
                            {filteredCoupons.map(
                                (item: any) => (
                                    <CouponCard
                                        key={item.id}
                                        item={item}
                                        formatDate={formatDate}
                                    />
                                )
                            )}
                        </View>
                    )}

                    {/* PROMO */}

                    {!loading &&
                        filteredCoupons.length > 0 && (
                            <View style={styles.promoBanner}>
                                <View
                                    style={
                                        styles.promoIconContainer
                                    }
                                >
                                    <FontAwesome
                                        name="award"
                                        size={18}
                                        color={
                                            Colors.light.orange
                                        }
                                    />
                                </View>

                                <View
                                    style={styles.promoTextGroup}
                                >
                                    <Text
                                        style={styles.promoTitle}
                                    >
                                        Want more bookings?
                                    </Text>

                                    <Text
                                        style={
                                            styles.promoSubtitle
                                        }
                                    >
                                        Upgrade to Pro and get
                                        higher visibility & more
                                        customer reach.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.promoButton}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={
                                            styles.promoButtonText
                                        }
                                    >
                                        Upgrade Now
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                </View>
            </ScrollView>

            {/* BOTTOM TAB */}

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
                    path="/"
                />

                <TabBarItem
                    icon="shopping-bag"
                    label="Orders"
                    path="/orders"
                />

                <TabBarItem
                    icon="tag"
                    label="Coupons"
                    active
                    path="/listings"
                />

                <TabBarItem
                    icon="bullhorn"
                    label="Ads"
                    path="/ads"
                />

            </View>
        </View>
    );
}

/* =========================================================
   COUPON CARD
========================================================= */

const CouponCard = ({
    item,
    formatDate,
}: {
    item: any;
    formatDate: (date: string) => string;
}) => {
    const router = useRouter();

    const [showOptions, setShowOptions] =
        useState(false);

    const status = item?.is_active === 1
        ? 'Active'
        : 'Inactive';

    const statusBg = item?.is_active === 1
        ? Colors.light.greenBg
        : '#FFEBEB';

    const statusColor = item?.is_active === 1
        ? Colors.light.green
        : '#E53935';

    const approvalStatus = item?.is_approved === 1
        ? 'Approved'
        : 'Pending';

    const approvalBg = item?.is_approved === 1
        ? '#E8F8F0'
        : '#FFF8E1';

    const approvalColor = item?.is_approved === 1
        ? Colors.light.green
        : '#FFA000';

    const vendorName =
        item?.vendor_name ||
        'Unknown Vendor';

    const bannerImage = item?.banner_image_url || item?.banner_image;
    const imageUrl = bannerImage
        ? bannerImage.startsWith('http')
            ? bannerImage
            : `${API_ORIGIN}${bannerImage.startsWith('/') ? '' : '/'}${bannerImage}`
        : 'https://via.placeholder.com/150';

    /*
     * Pass the COMPLETE coupon object to details page
     */

    const openDetails = () => {
        setShowOptions(false);

        router.push({
            pathname: `/listings/${item.id}`,
            params: {
                listing: JSON.stringify(item),
            },
        } as any);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Coupon',
            'Are you sure you want to delete this coupon?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token =
                                await AsyncStorage.getItem(
                                    'vendorToken'
                                );

                            const response =
                                await fetch(
                                    `${API_URL}/coupons/${item.id}`,
                                    {
                                        method: 'DELETE',
                                        headers: {
                                            Authorization:
                                                `Bearer ${token}`,
                                            'Content-Type':
                                                'application/json',
                                        },
                                    }
                                );

                            const data =
                                await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    data?.message ||
                                    'Failed to delete'
                                );
                            }

                            Alert.alert(
                                'Success',
                                'Coupon deleted successfully'
                            );

                            router.replace(
                                '/listings'
                            );
                        } catch (error) {
                            console.error(
                                'Delete error:',
                                error
                            );

                            Alert.alert(
                                'Error',
                                'Failed to delete coupon'
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleApprove = () => {
        Alert.alert(
            'Approve Coupon',
            'Are you sure you want to approve this coupon?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            const token =
                                await AsyncStorage.getItem(
                                    'vendorToken'
                                );

                            const response =
                                await fetch(
                                    `${API_URL}/coupons/${item.id}/approve`,
                                    {
                                        method: 'PUT',
                                        headers: {
                                            Authorization:
                                                `Bearer ${token}`,
                                            'Content-Type':
                                                'application/json',
                                        },
                                    }
                                );

                            const data =
                                await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    data?.message ||
                                    'Failed to approve'
                                );
                            }

                            Alert.alert(
                                'Success',
                                'Coupon approved successfully'
                            );

                            router.replace(
                                '/listings'
                            );
                        } catch (error) {
                            console.error(
                                'Approve error:',
                                error
                            );

                            Alert.alert(
                                'Error',
                                'Failed to approve coupon'
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleDisapprove = () => {
        Alert.prompt(
            'Disapprove Coupon',
            'Please enter a reason for disapproval:',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Disapprove',
                    style: 'destructive',
                    onPress: async (reason?: string) => {
                        if (!reason || reason.trim() === '') {
                            Alert.alert(
                                'Error',
                                'Please provide a reason for disapproval'
                            );
                            return;
                        }

                        try {
                            const token =
                                await AsyncStorage.getItem(
                                    'vendorToken'
                                );

                            const response =
                                await fetch(
                                    `${API_URL}/coupons/${item.id}/disapprove`,
                                    {
                                        method: 'PUT',
                                        headers: {
                                            Authorization:
                                                `Bearer ${token}`,
                                            'Content-Type':
                                                'application/json',
                                        },
                                        body: JSON.stringify({
                                            reason: reason.trim(),
                                        }),
                                    }
                                );

                            const data =
                                await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    data?.message ||
                                    'Failed to disapprove'
                                );
                            }

                            Alert.alert(
                                'Success',
                                'Coupon disapproved successfully'
                            );

                            router.replace(
                                '/listings'
                            );
                        } catch (error) {
                            console.error(
                                'Disapprove error:',
                                error
                            );

                            Alert.alert(
                                'Error',
                                'Failed to disapprove coupon'
                            );
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    return (
        <TouchableOpacity
            style={styles.listingCard}
            activeOpacity={0.75}
            onPress={openDetails}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item?.title || 'coupon'} details`}
        >
            <Image
                source={{ uri: imageUrl }}
                style={styles.listingImage}
            />

            <View style={styles.listingDetails}>
                <Text
                    style={styles.listingTitle}
                    numberOfLines={1}
                >
                    {item?.title || 'Untitled Coupon'}
                </Text>

                {item?.subtitle && (
                    <Text
                        style={styles.listingCategory}
                        numberOfLines={1}
                    >
                        {item.subtitle}
                    </Text>
                )}

                <CouponPrice coupon={item} />

                <View style={styles.vendorRow}>
                    <Text
                        style={styles.vendorName}
                        numberOfLines={1}
                    >
                        {vendorName}
                    </Text>

                    <View style={styles.ratingContainer}>
                        <Feather
                            name="shopping-cart"
                            size={12}
                            color={Colors.light.orange}
                        />

                        <Text style={styles.ratingText}>
                            Max {item?.max_quantity ?? 1}
                        </Text>
                    </View>
                </View>

                <View style={styles.statusDateRow}>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor:
                                    statusBg,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                {
                                    backgroundColor:
                                        statusColor,
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.statusText,
                                {
                                    color: statusColor,
                                },
                            ]}
                        >
                            {status}
                        </Text>
                    </View>

                    <Text style={styles.bulletSeparator}>
                        •
                    </Text>

                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor:
                                    approvalBg,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                {
                                    color: approvalColor,
                                },
                            ]}
                        >
                            {approvalStatus}
                        </Text>
                    </View>

                    <Text style={styles.bulletSeparator}>
                        •
                    </Text>

                    <Text style={styles.createdDate}>
                        {item?.valid_from && item?.valid_until ? (
                            <>
                                {formatDate(item.valid_from)}
                                {' - '}
                                {formatDate(item.valid_until)}
                            </>
                        ) : (
                            formatDate(item?.created_at)
                        )}
                    </Text>
                </View>
            </View>

            <View style={styles.priceActionColumn}>
                {item?.priority > 0 && (
                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>
                            ⭐ Featured
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.moreOptionsButton}
                    activeOpacity={0.6}
                    onPress={(event) => {
                        event.stopPropagation();
                        setShowOptions(!showOptions);
                    }}
                >
                    <Feather
                        name="more-vertical"
                        size={18}
                        color={
                            Colors.light.textDim
                        }
                    />
                </TouchableOpacity>

                {showOptions && (
                    <View style={styles.optionsMenu}>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={openDetails}
                        >
                            <Feather
                                name="eye"
                                size={14}
                                color={
                                    Colors.light.text
                                }
                            />

                            <Text
                                style={
                                    styles.optionText
                                }
                            >
                                View
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={(event) => {
                                event.stopPropagation();
                                setShowOptions(false);

                                router.push({
                                    pathname: '/listings/edit',
                                    params: { id: String(item.id) },
                                } as any);
                            }}
                        >
                            <Feather
                                name="edit-2"
                                size={14}
                                color={
                                    Colors.light.text
                                }
                            />

                            <Text
                                style={
                                    styles.optionText
                                }
                            >
                                Edit
                            </Text>
                        </TouchableOpacity>

                        {item?.is_approved === 0 && (
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    setShowOptions(false);
                                    handleApprove();
                                }}
                            >
                                <Feather
                                    name="check"
                                    size={14}
                                    color={Colors.light.green}
                                />

                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: Colors.light.green },
                                    ]}
                                >
                                    Approve
                                </Text>
                            </TouchableOpacity>
                        )}

                        {item?.is_approved === 0 && (
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    setShowOptions(false);
                                    handleDisapprove();
                                }}
                            >
                                <Feather
                                    name="x"
                                    size={14}
                                    color="#E53935"
                                />

                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: '#E53935' },
                                    ]}
                                >
                                    Disapprove
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.optionItem,
                                styles.optionItemDanger,
                            ]}
                            onPress={() => {
                                setShowOptions(false);
                                handleDelete();
                            }}
                        >
                            <Feather
                                name="trash-2"
                                size={14}
                                color="#E53935"
                            />

                            <Text
                                style={[
                                    styles.optionText,
                                    styles.optionTextDanger,
                                ]}
                            >
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

/* =========================================================
   TAB BAR
========================================================= */

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
            activeOpacity={0.7}
            onPress={() =>
                router.push(path as any)
            }
        >
            <FontAwesome
                name={icon}
                size={22}
                color={
                    active
                        ? Colors.light.orange
                        : Colors.light.textDim
                }
            />

            <Text
                style={[
                    styles.tabLabel,
                    active &&
                    styles.tabLabelActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },

    scrollView: {
        flex: 1,
    },

    headerContainer: {
        backgroundColor:
            Colors.light.darkElement,
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
        backgroundColor:
            Colors.light.orange,
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

    contentContainer: {
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
    },

    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.four,
    },

    pageTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.light.text,
    },

    pageSubtitle: {
        fontSize: 12,
        color: Colors.light.textDim,
        marginTop: 2,
    },

    addButton: {
        backgroundColor:
            Colors.light.orange,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.medium,
        shadowColor:
            Colors.light.orange,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },

    addButtonText: {
        color: Colors.light.white,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },

    searchFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        marginBottom: Spacing.four,
    },

    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor:
            Colors.light.white,
        borderRadius: Radius.medium,
        paddingHorizontal: Spacing.three,
        height: 44,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },

    searchInput: {
        flex: 1,
        fontSize: 13,
        color: Colors.light.text,
    },

    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor:
            Colors.light.white,
        borderRadius: Radius.medium,
        paddingHorizontal: Spacing.three,
        height: 44,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },

    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.text,
        marginLeft: 6,
    },

    statsScrollView: {
        marginHorizontal: -Spacing.four,
        paddingHorizontal: Spacing.four,
        marginBottom: Spacing.four,
    },

    statsRow: {
        flexDirection: 'row',
        gap: Spacing.two,
    },

    statCard: {
        backgroundColor:
            Colors.light.white,
        padding: Spacing.three,
        borderRadius: Radius.medium,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        minWidth: 110,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },

    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.two,
    },

    statLabel: {
        fontSize: 11,
        color: Colors.light.textDim,
        marginBottom: 2,
    },

    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.light.text,
        marginBottom: 2,
    },

    statSubText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.light.textDim,
    },

    loadingContainer: {
        paddingVertical: Spacing.five,
        alignItems: 'center',
    },

    loadingText: {
        marginTop: Spacing.two,
        color: Colors.light.textDim,
        fontSize: 14,
    },

    emptyContainer: {
        paddingVertical: Spacing.six,
        alignItems: 'center',
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: Spacing.three,
    },

    emptySubtitle: {
        fontSize: 14,
        color: Colors.light.textDim,
        marginTop: Spacing.one,
        marginBottom: Spacing.four,
    },

    emptyButton: {
        backgroundColor:
            Colors.light.orange,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        borderRadius: Radius.medium,
    },

    emptyButtonText: {
        color: Colors.light.white,
        fontSize: 14,
        fontWeight: '700',
    },

    listingsList: {
        gap: Spacing.three,
    },

    listingCard: {
        flexDirection: 'row',
        backgroundColor:
            Colors.light.white,
        borderRadius: Radius.medium,
        padding: Spacing.three,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },

    listingImage: {
        width: 60,
        height: 60,
        borderRadius: Radius.medium,
        marginRight: Spacing.three,
        backgroundColor: '#EEEEEE',
    },

    listingDetails: {
        flex: 1,
        minWidth: 0,
    },

    listingTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 2,
    },

    listingCategory: {
        fontSize: 11,
        color: Colors.light.textDim,
        marginBottom: 2,
    },

    vendorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.two,
        flexWrap: 'wrap',
    },

    vendorName: {
        fontSize: 10,
        color: Colors.light.textDim,
        marginRight: 8,
        maxWidth: 80,
    },

    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    ratingText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.light.text,
        marginLeft: 2,
    },

    reviewCount: {
        fontSize: 10,
        color: Colors.light.textDim,
        marginLeft: 2,
    },

    statusDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal:
            Spacing.one + 2,
        paddingVertical: 2,
        borderRadius: 4,
    },

    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginRight: 4,
    },

    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },

    bulletSeparator: {
        fontSize: 10,
        color: Colors.light.textDim,
        marginHorizontal: 4,
    },

    createdDate: {
        fontSize: 10,
        color: Colors.light.textDim,
    },

    priceActionColumn: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 60,
        position: 'relative',
    },

    priorityBadge: {
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFD54F',
    },

    priorityText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#F57F17',
    },

    moreOptionsButton: {
        padding: 4,
    },

    optionsMenu: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor:
            Colors.light.white,
        borderRadius: Radius.medium,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
        minWidth: 140,
        zIndex: 100,
    },

    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.two,
        gap: 8,
    },

    optionItemDanger: {
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },

    optionText: {
        fontSize: 13,
        color: Colors.light.text,
    },

    optionTextDanger: {
        color: '#E53935',
    },

    promoBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFF5EE',
        padding: Spacing.three,
        borderRadius: Radius.medium,
        alignItems: 'center',
        marginTop: Spacing.five,
        borderWidth: 1,
        borderColor: '#FFE0CC',
    },

    promoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFE0CC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.three,
    },

    promoTextGroup: {
        flex: 1,
        paddingRight: Spacing.two,
    },

    promoTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 2,
    },

    promoSubtitle: {
        fontSize: 10,
        color: Colors.light.textDim,
        lineHeight: 14,
    },

    promoButton: {
        backgroundColor: '#FFE0CC',
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.medium,
    },

    promoButtonText: {
        color: Colors.light.orange,
        fontSize: 11,
        fontWeight: '700',
    },

    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor:
            Colors.light.white,
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
});
