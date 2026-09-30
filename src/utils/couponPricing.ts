// Match DECIMAL(10,2) in the coupon API. Calculate money in cents.
export function parsePrice(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value).trim();
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function validatePricing(price: string): string | null {
    if (parsePrice(price) === null) {
        return 'Enter a price from $0 to $99,999,999.99, with up to 2 decimal places.';
    }
    return null;
}

export function formatPrice(cents: number | null): string {
    return cents === null ? 'Price not set' : `$${(cents / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
