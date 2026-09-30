-- Run this once on the same database used by the API.
-- Replace `coupons` only if your actual table has a different name.

ALTER TABLE coupons
    MODIFY COLUMN coupon_code VARCHAR(255) NULL,
    ADD COLUMN max_quantity TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER coupon_code;

-- Optional protection for MySQL 8.0.16+.
ALTER TABLE coupons
    ADD CONSTRAINT chk_coupons_max_quantity
    CHECK (max_quantity BETWEEN 1 AND 5);
