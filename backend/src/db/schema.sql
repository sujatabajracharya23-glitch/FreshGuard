-- FreshGuard Database Schema
-- Run this in MySQL Workbench / phpMyAdmin (XAMPP) before starting the backend.
-- CREATE DATABASE freshguard; USE freshguard; then run this file.

CREATE DATABASE IF NOT EXISTS freshguard;
USE freshguard;

-- ============================================================
-- UC1: Register Users & Privacy Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id           INT AUTO_INCREMENT PRIMARY KEY,
  full_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(150) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  household_size    INT NULL,
  is_verified       TINYINT(1) NOT NULL DEFAULT 0,
  two_fa_enabled    TINYINT(1) NOT NULL DEFAULT 0,
  listing_visibility ENUM('public','household_only','private') NOT NULL DEFAULT 'public',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6-digit email verification / 2FA codes (UC1 typical + alt course: Line 6)
CREATE TABLE IF NOT EXISTS verification_codes (
  code_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  code         VARCHAR(6) NOT NULL,
  purpose      ENUM('email_verification','two_factor_login') NOT NULL DEFAULT 'email_verification',
  expires_at   DATETIME NOT NULL,
  used         TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Shared inventory / donation tables (owned by UC2/UC3, teammates)
-- Minimal shape included here only so UC4 Food Analytics has
-- something real to aggregate against.
-- ============================================================
CREATE TABLE IF NOT EXISTS food_items (
  item_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  item_name    VARCHAR(120) NOT NULL,
  quantity     DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit         VARCHAR(20) NOT NULL DEFAULT 'pcs',
  category     VARCHAR(50) NOT NULL,
  expiry_date  DATE NOT NULL,
  status       ENUM('active','used','donated','expired') NOT NULL DEFAULT 'active',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS donations (
  donation_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  item_id       INT NULL,
  item_name     VARCHAR(120) NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL DEFAULT 1,
  status        ENUM('listed','claimed','completed','cancelled') NOT NULL DEFAULT 'listed',
  posted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES food_items(item_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Helpful indexes for the analytics queries (UC4)
CREATE INDEX idx_food_items_user_status ON food_items(user_id, status);
CREATE INDEX idx_donations_user_status ON donations(user_id, status);
