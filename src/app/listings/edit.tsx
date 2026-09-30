import { useLocalSearchParams } from 'expo-router';
import CouponForm from '@/components/coupon-form';

export default function EditListingScreen() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const couponId = Array.isArray(id) ? id[0] : id;
    return <CouponForm key={couponId} couponId={couponId ?? ''} />;
}
