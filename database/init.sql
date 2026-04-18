-- SmartPay database schema
-- MySQL 8.0+ recommended

CREATE DATABASE IF NOT EXISTS `smartpay`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `smartpay`;

-- ============================================================
-- users
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(64)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name`  VARCHAR(64)  DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default account is seeded on server boot (see src/utils/seed.js).
-- Credentials: demo / demo1234
-- A real bcrypt hash is generated at runtime to avoid shipping a fake hash here.

-- ============================================================
-- financial_accounts
--   account_type is INT; JS constants map to human label.
--     1 = BANK_ACCOUNT     (銀行帳戶)
--     2 = CREDIT_CARD      (信用卡)
--     3 = DEBIT_CARD       (Debit 卡)
--     4 = MOBILE_PAYMENT   (行動支付)
-- ============================================================
DROP TABLE IF EXISTS `financial_accounts`;
CREATE TABLE `financial_accounts` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`               INT UNSIGNED NOT NULL,
  `account_type`          TINYINT UNSIGNED NOT NULL,
  `bank_or_provider_name` VARCHAR(64)  NOT NULL,
  `card_or_account_name`  VARCHAR(96)  NOT NULL,
  `last_four_digits`      VARCHAR(4)   DEFAULT NULL,
  `image_path`            VARCHAR(255) DEFAULT NULL,
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fa_user`  (`user_id`),
  KEY `idx_fa_type`  (`account_type`),
  CONSTRAINT `fk_fa_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- reward_campaigns
--   reward_cap_period is INT; JS constants map to human label.
--     1 = PER_TRANSACTION  (單筆)
--     2 = MONTHLY          (每月)
--     3 = CAMPAIGN_TOTAL   (總活動)
--     0 = NONE             (無上限)
-- ============================================================
DROP TABLE IF EXISTS `reward_campaigns`;
CREATE TABLE `reward_campaigns` (
  `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `financial_account_id`  INT UNSIGNED NOT NULL,
  `campaign_name`         VARCHAR(128) NOT NULL,
  `description`           TEXT         NOT NULL,
  `start_date`            DATE         DEFAULT NULL,
  `end_date`              DATE         DEFAULT NULL,
  `reward_rate`           DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `reward_cap_amount`     DECIMAL(12,2) DEFAULT NULL,
  `reward_cap_period`     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `min_spend_amount`      DECIMAL(12,2) DEFAULT NULL,
  `applicable_days`       JSON          DEFAULT NULL,
  `target_merchants`      JSON          DEFAULT NULL,
  `requires_registration` TINYINT(1)   NOT NULL DEFAULT 0,
  `is_quota_limited`      TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rc_account` (`financial_account_id`),
  KEY `idx_rc_dates`   (`start_date`, `end_date`),
  CONSTRAINT `fk_rc_account`
    FOREIGN KEY (`financial_account_id`) REFERENCES `financial_accounts`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
