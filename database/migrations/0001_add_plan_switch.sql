-- =============================================================
-- Migration 0001: add plan-switch fields to reward_campaigns
-- Run this on databases that were initialised before these
-- columns existed. Safe to re-run — each ALTER checks
-- information_schema so duplicate columns won't be added twice.
-- =============================================================

USE `smartpay`;

-- ---- requires_plan_switch -----------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'reward_campaigns'
     AND COLUMN_NAME  = 'requires_plan_switch'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `reward_campaigns`
     ADD COLUMN `requires_plan_switch` TINYINT(1) NOT NULL DEFAULT 0
     AFTER `is_quota_limited`',
  'SELECT "skip: requires_plan_switch already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---- required_plan_name -------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'reward_campaigns'
     AND COLUMN_NAME  = 'required_plan_name'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `reward_campaigns`
     ADD COLUMN `required_plan_name` VARCHAR(255) DEFAULT NULL
     AFTER `requires_plan_switch`',
  'SELECT "skip: required_plan_name already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
