import { Feather, FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatPrice, parsePrice } from '@/utils/couponPricing';

const ROAMEO_LOGO = require('../../../assets/images/roameo-logo.png');

export default function ListingDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const params = useLocalSearchParams<{
        id: string;
        listing?: string;
    }>();

    /*
     * IMPORTANT:
     *
     * We DO NOT call any API here.
     *
     * The listing object was already fetched
     * from listings/index.tsx.
     */

    const listing = useMemo(() => {
        try {
            if (!params.listing) {
                return null;
            }

            return JSON.parse(params.listing);
        } catch (error) {
            console.error(
                'Failed to parse listing:',
                error
            );

            return null;
        }
    }, [params.listing]);

    const formatDate = (
        dateString?: string
    ) => {
        if (!dateString) {
            return 'N/A';
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        return date.toLocaleDateString(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }
        );
    };

    /*
     * If no listing was passed,
     * show an error instead of calling API.
     */

    if (!listing) {
        return (
            <View style={styles.errorScreen}>
                <Feather
                    name="alert-circle"
                    size={60}
                    color="#CCCCCC"
                />

                <Text style={styles.errorTitle}>
                    Coupon Data Not Found
                </Text>

                <Text
                    style={styles.errorSubtitle}
                >
                    Please go back and select the
                    coupon again.
                </Text>

                <TouchableOpacity
                    style={styles.backButtonLarge}
                    onPress={() => router.back()}
                >
                    <Text
                        style={
                            styles.backButtonLargeText
                        }
                    >
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    /*
     * Support multiple possible API field names.
     */

    const rawImageUrl =
        listing.banner_image_url ||
        listing.banner_image ||
        listing.thumbnail ||
        listing.image_url ||
        listing.image ||
        listing.images?.[0]?.url ||
        listing.images?.[0];
    const imageUrl = rawImageUrl
        ? rawImageUrl.startsWith('http')
            ? rawImageUrl
            : `${process.env.EXPO_PUBLIC_BASE_URL}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`
        : 'https://via.placeholder.com/600x400';

    const categoryName =
        listing.category?.name ||
        listing.category?.category_name ||
        listing.category_name ||
        'Uncategorized';

    const vendorName =
        listing.vendor?.name ||
        listing.vendor_name ||
        'Unknown Vendor';

    const price = parsePrice(listing.price);

    const rating =
        listing.rating ??
        listing.average_rating ??
        0;

    const reviewCount =
        listing.review_count ??
        listing.reviews_count ??
        0;

    const isActive =
        Boolean(listing.is_active);

    const location =
        listing.address ||
        listing.location ||
        [
            listing.city,
            listing.state,
            listing.country,
        ]
            .filter(Boolean)
            .join(', ') ||
        'Location not available';

    return (
        <View style={styles.mainContainer}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom:
                        insets.bottom + 30,
                }}
            >
                {/* ======================================
                    HEADER
                ====================================== */}

                <SafeAreaView
                    style={
                        styles.headerContainer
                    }
                    edges={['top']}
                >
                    <View
                        style={styles.headerRow}
                    >
                        <TouchableOpacity
                            style={
                                styles.headerIcon
                            }
                            onPress={() =>
                                router.back()
                            }
                            activeOpacity={0.7}
                        >
                            <Feather
                                name="arrow-left"
                                size={23}
                                color={
                                    Colors.light
                                        .white
                                }
                            />
                        </TouchableOpacity>

                        <View
                            style={
                                styles.logoGroup
                            }
                        >
                            <Image
                                source={
                                    ROAMEO_LOGO
                                }
                                style={
                                    styles.logo
                                }
                                resizeMode="contain"
                            />

                            <FontAwesome
                                name="map-marker"
                                size={19}
                                color={
                                    Colors.light
                                        .orange
                                }
                                style={{
                                    marginLeft: 4,
                                }}
                            />
                        </View>

                        <TouchableOpacity
                            style={
                                styles.headerIcon
                            }
                            activeOpacity={0.7}
                        >
                            <Feather
                                name="share-2"
                                size={21}
                                color={
                                    Colors.light
                                        .white
                                }
                            />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {/* ======================================
                    HERO IMAGE
                ====================================== */}

                <View
                    style={
                        styles.heroContainer
                    }
                >
                    <Image
                        source={{
                            uri: imageUrl,
                        }}
                        style={styles.heroImage}
                    />

                    {/* Status */}

                    <View
                        style={
                            styles.statusBadge
                        }
                    >
                        <View
                            style={[
                                styles.statusDot,
                                {
                                    backgroundColor:
                                        isActive
                                            ? Colors
                                                .light
                                                .green
                                            : '#E53935',
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.statusText,
                                {
                                    color: isActive
                                        ? Colors
                                            .light
                                            .green
                                        : '#E53935',
                                },
                            ]}
                        >
                            {isActive
                                ? 'Active'
                                : 'Inactive'}
                        </Text>
                    </View>

                    {/* Photo badge */}

                    <View
                        style={
                            styles.photoBadge
                        }
                    >
                        <Feather
                            name="image"
                            size={13}
                            color={
                                Colors.light.white
                            }
                        />

                        <Text
                            style={
                                styles.photoBadgeText
                            }
                        >
                            Coupon Photo
                        </Text>
                    </View>
                </View>

                {/* ======================================
                    CONTENT
                ====================================== */}

                <View
                    style={
                        styles.contentContainer
                    }
                >
                    {/* Category */}

                    <View
                        style={
                            styles.categoryBadge
                        }
                    >
                        <Text
                            style={
                                styles.categoryText
                            }
                        >
                            {categoryName}
                        </Text>
                    </View>

                    {/* Title */}

                    <Text style={styles.title}>
                        {listing.title ||
                            'Untitled Coupon'}
                    </Text>

                    {/* Rating */}

                    <View
                        style={
                            styles.ratingRow
                        }
                    >
                        <View
                            style={
                                styles.ratingGroup
                            }
                        >
                            <FontAwesome
                                name="star"
                                size={16}
                                color="#FFB800"
                            />

                            <Text
                                style={
                                    styles.ratingValue
                                }
                            >
                                {Number(
                                    rating
                                ).toFixed(1)}
                            </Text>

                            <Text
                                style={
                                    styles.reviewText
                                }
                            >
                                ({reviewCount}{' '}
                                reviews)
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.createdText
                            }
                        >
                            Created{' '}
                            {formatDate(
                                listing.created_at
                            )}
                        </Text>
                    </View>

                    {/* ======================================
                        PRICE
                    ====================================== */}

                    <View
                        style={
                            styles.priceCard
                        }
                    >
                        <View>
                            <Text
                                style={
                                    styles.priceLabel
                                }
                            >
                                Coupon Price
                            </Text>

                            <View
                                style={
                                    styles.priceRow
                                }
                            >
                                <Text
                                    style={
                                        styles.price
                                    }
                                >
                                    {formatPrice(price)}
                                </Text>

                            </View>
                        </View>

                    </View>

                    {/* ======================================
                        OVERVIEW
                    ====================================== */}

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Coupon Overview
                    </Text>

                    <View
                        style={
                            styles.overviewGrid
                        }
                    >
                        <InfoCard
                            icon="tag"
                            title="Category"
                            value={categoryName}
                        />

                        <InfoCard
                            icon="user"
                            title="Vendor"
                            value={vendorName}
                        />

                        <InfoCard
                            icon="star"
                            title="Rating"
                            value={`${Number(
                                rating
                            ).toFixed(
                                1
                            )} / 5`}
                        />

                        <InfoCard
                            icon="message-circle"
                            title="Reviews"
                            value={`${reviewCount}`}
                        />
                    </View>

                    {/* ======================================
                        DESCRIPTION
                    ====================================== */}

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Description
                    </Text>

                    <View
                        style={
                            styles.whiteCard
                        }
                    >
                        <Text
                            style={
                                styles.description
                            }
                        >
                            {listing.description ||
                                'No description available for this coupon.'}
                        </Text>
                    </View>

                    {/* ======================================
                        LOCATION
                    ====================================== */}

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Location
                    </Text>

                    <View
                        style={
                            styles.locationCard
                        }
                    >
                        <View
                            style={
                                styles.locationIconContainer
                            }
                        >
                            <FontAwesome
                                name="map-marker"
                                size={21}
                                color={
                                    Colors.light
                                        .orange
                                }
                            />
                        </View>

                        <View
                            style={
                                styles.locationContent
                            }
                        >
                            <Text
                                style={
                                    styles.locationTitle
                                }
                            >
                                Business Location
                            </Text>

                            <Text
                                style={
                                    styles.locationText
                                }
                            >
                                {location}
                            </Text>
                        </View>

                        <Feather
                            name="chevron-right"
                            size={20}
                            color={
                                Colors.light
                                    .textDim
                            }
                        />
                    </View>

                    {/* ======================================
                        LISTING INFORMATION
                    ====================================== */}

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Coupon Information
                    </Text>

                    <View
                        style={
                            styles.detailsCard
                        }
                    >
                        <DetailRow
                            label="Coupon ID"
                            value={String(
                                listing.id ||
                                params.id ||
                                'N/A'
                            )}
                        />

                        <DetailRow
                            label="Vendor"
                            value={vendorName}
                        />

                        <DetailRow
                            label="Category"
                            value={categoryName}
                        />

                        <DetailRow
                            label="Status"
                            value={
                                isActive
                                    ? 'Active'
                                    : 'Inactive'
                            }
                        />

                        <DetailRow
                            label="Created"
                            value={formatDate(
                                listing.created_at
                            )}
                        />

                        <DetailRow
                            label="Maximum Quantity Per Cart"
                            value={String(listing.max_quantity ?? 1)}
                            last
                        />
                    </View>

                    {/* ======================================
                        ACTION BUTTONS
                    ====================================== */}

                    <View
                        style={
                            styles.actionRow
                        }
                    >
                        <TouchableOpacity
                            style={
                                styles.editButton
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                                router.push({
                                    pathname: `/listings/${listing.id}/edit`,
                                    params: {
                                        listing:
                                            JSON.stringify(
                                                listing
                                            ),
                                    },
                                } as any)
                            }
                        >
                            <Feather
                                name="edit-2"
                                size={17}
                                color={
                                    Colors.light
                                        .orange
                                }
                            />

                            <Text
                                style={
                                    styles.editButtonText
                                }
                            >
                                Edit Coupon
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={
                                styles.backButton
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                                router.back()
                            }
                        >
                            <Feather
                                name="arrow-left"
                                size={17}
                                color={
                                    Colors.light
                                        .white
                                }
                            />

                            <Text
                                style={
                                    styles.backButtonText
                                }
                            >
                                Back
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({
    icon,
    title,
    value,
}: {
    icon: any;
    title: string;
    value: string;
}) => {
    return (
        <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
                <Feather
                    name={icon}
                    size={17}
                    color={
                        Colors.light.orange
                    }
                />
            </View>

            <Text
                style={styles.infoTitle}
            >
                {title}
            </Text>

            <Text
                style={styles.infoValue}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
    );
};

/* =========================================================
   DETAIL ROW
========================================================= */

const DetailRow = ({
    label,
    value,
    last,
}: {
    label: string;
    value: string;
    last?: boolean;
}) => {
    return (
        <View
            style={[
                styles.detailRow,
                !last &&
                styles.detailBorder,
            ]}
        >
            <Text
                style={styles.detailLabel}
            >
                {label}
            </Text>

            <Text
                style={styles.detailValue}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
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

    headerContainer: {
        backgroundColor:
            Colors.light.darkElement,
        paddingHorizontal:
            Spacing.four,
        paddingBottom:
            Spacing.three,
    },

    headerRow: {
        height: 48,
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
    },

    headerIcon: {
        width: 40,
        height: 40,
        justifyContent:
            'center',
        alignItems: 'center',
    },

    logoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logo: {
        width: 100,
        height: 24,
    },

    heroContainer: {
        height: 280,
        backgroundColor: '#111111',
        position: 'relative',
    },

    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    statusBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor:
            Colors.light.white,
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 6,
    },

    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },

    photoBadge: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        backgroundColor:
            'rgba(0,0,0,0.65)',
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
    },

    photoBadgeText: {
        color: Colors.light.white,
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 5,
    },

    contentContainer: {
        paddingHorizontal:
            Spacing.four,
        paddingTop: Spacing.four,
    },

    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF0E7',
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: Spacing.two,
    },

    categoryText: {
        color: Colors.light.orange,
        fontSize: 11,
        fontWeight: '700',
    },

    title: {
        fontSize: 25,
        lineHeight: 31,
        fontWeight: '800',
        color: Colors.light.text,
        marginBottom: Spacing.two,
    },

    ratingRow: {
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
        marginBottom:
            Spacing.four,
    },

    ratingGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    ratingValue: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.light.text,
        marginLeft: 5,
    },

    reviewText: {
        fontSize: 12,
        color: Colors.light.textDim,
        marginLeft: 4,
    },

    createdText: {
        fontSize: 10,
        color: Colors.light.textDim,
    },

    priceCard: {
        backgroundColor:
            Colors.light.darkElement,
        borderRadius:
            Radius.large,
        padding: Spacing.four,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
        marginBottom:
            Spacing.five,
    },

    priceLabel: {
        fontSize: 11,
        color: '#AAAAAA',
        marginBottom: 3,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    price: {
        fontSize: 27,
        color: Colors.light.white,
        fontWeight: '800',
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.light.text,
        marginBottom:
            Spacing.three,
    },

    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent:
            'space-between',
        marginBottom:
            Spacing.four,
    },

    infoCard: {
        width: '48%',
        backgroundColor:
            Colors.light.white,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius:
            Radius.medium,
        padding: Spacing.three,
        marginBottom:
            Spacing.two,
    },

    infoIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFF0E7',
        justifyContent:
            'center',
        alignItems: 'center',
        marginBottom:
            Spacing.two,
    },

    infoTitle: {
        fontSize: 10,
        color: Colors.light.textDim,
        marginBottom: 3,
    },

    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.text,
    },

    whiteCard: {
        backgroundColor:
            Colors.light.white,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius:
            Radius.medium,
        padding: Spacing.four,
        marginBottom:
            Spacing.five,
    },

    description: {
        fontSize: 13,
        lineHeight: 21,
        color: Colors.light.textDim,
    },

    locationCard: {
        backgroundColor:
            Colors.light.white,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius:
            Radius.medium,
        padding: Spacing.three,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom:
            Spacing.five,
    },

    locationIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF0E7',
        justifyContent:
            'center',
        alignItems: 'center',
    },

    locationContent: {
        flex: 1,
        marginLeft: Spacing.three,
        marginRight: Spacing.two,
    },

    locationTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 3,
    },

    locationText: {
        fontSize: 11,
        lineHeight: 16,
        color: Colors.light.textDim,
    },

    detailsCard: {
        backgroundColor:
            Colors.light.white,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius:
            Radius.medium,
        paddingHorizontal:
            Spacing.four,
        marginBottom:
            Spacing.five,
    },

    detailRow: {
        minHeight: 49,
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
    },

    detailBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },

    detailLabel: {
        fontSize: 12,
        color: Colors.light.textDim,
    },

    detailValue: {
        flex: 1,
        textAlign: 'right',
        marginLeft: Spacing.three,
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.text,
    },

    actionRow: {
        flexDirection: 'row',
        gap: Spacing.two,
        marginBottom:
            Spacing.four,
    },

    editButton: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor:
            Colors.light.orange,
        borderRadius:
            Radius.medium,
        backgroundColor:
            Colors.light.white,
        flexDirection: 'row',
        justifyContent:
            'center',
        alignItems: 'center',
    },

    editButtonText: {
        color: Colors.light.orange,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 7,
    },

    backButton: {
        flex: 1,
        height: 50,
        borderRadius:
            Radius.medium,
        backgroundColor:
            Colors.light.orange,
        flexDirection: 'row',
        justifyContent:
            'center',
        alignItems: 'center',
    },

    backButtonText: {
        color: Colors.light.white,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 7,
    },

    errorScreen: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        justifyContent:
            'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    errorTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.light.text,
        marginTop: 15,
    },

    errorSubtitle: {
        fontSize: 13,
        color: Colors.light.textDim,
        marginTop: 5,
        textAlign: 'center',
    },

    backButtonLarge: {
        marginTop: 20,
        backgroundColor:
            Colors.light.orange,
        paddingHorizontal: 30,
        paddingVertical: 13,
        borderRadius:
            Radius.medium,
    },

    backButtonLargeText: {
        color: Colors.light.white,
        fontWeight: '700',
    },
});
