import { StyleSheet, Text, View } from 'react-native';
import { formatPrice, parsePrice } from '@/utils/couponPricing';
import { Colors } from '@/constants/theme';

export function CouponPrice({ coupon }: { coupon: { price?: unknown } }) {
    return (
        <View style={styles.row}>
            <Text style={styles.price}>{formatPrice(parsePrice(coupon.price))}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginVertical: 6 },
    price: { fontSize: 15, fontWeight: '700', color: Colors.light.orange },
});
