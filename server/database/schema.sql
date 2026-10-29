-- FitPulse Database Schema
-- Run this in phpMyAdmin or via MySQL CLI after creating the database.
-- Compatible with MySQL 5.7+ and MariaDB 10.4+

-- ─────────────────────────────────────────
-- 1. Create and select database
-- ─────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS fitpulse
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitpulse;

-- ─────────────────────────────────────────
-- 2. Create dedicated app user
--    Run this as root. Change the password!
-- ─────────────────────────────────────────
-- CREATE USER IF NOT EXISTS 'fitpulse_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fitpulse.* TO 'fitpulse_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ─────────────────────────────────────────
-- 3. Tables
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)    NOT NULL,
  email        VARCHAR(255)    NOT NULL,
  password     VARCHAR(255)    NOT NULL,   -- bcrypt hash, never the real password
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS workouts (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  workout_date  DATE            NOT NULL,
  type          VARCHAR(100)    NOT NULL,                  -- e.g. 'Running', 'Cycling'
  duration_min  SMALLINT UNSIGNED NOT NULL,               -- minutes, must be > 0
  calories      SMALLINT UNSIGNED NULL,                   -- optional
  distance_km   DECIMAL(6,2)    NULL,                     -- optional, metric
  notes         TEXT            NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_workouts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  -- Fast lookup for "my workouts sorted by date"
  INDEX idx_workouts_user_date (user_id, workout_date DESC),

  CONSTRAINT chk_duration CHECK (duration_min > 0),
  CONSTRAINT chk_calories  CHECK (calories IS NULL OR calories > 0),
  CONSTRAINT chk_distance  CHECK (distance_km IS NULL OR distance_km >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS goals (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED    NOT NULL,
  title           VARCHAR(150)    NOT NULL,
  description     TEXT            NULL,
  goal_type       ENUM('workouts_count','duration_min','calories','distance_km','weight_kg','custom')
                  NOT NULL DEFAULT 'custom',
  target_value    DECIMAL(10,2)   NOT NULL,
  current_value   DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  unit            VARCHAR(50)     NULL,                   -- e.g. 'km', 'kg', 'sessions'
  deadline        DATE            NULL,
  is_completed    TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goals_user (user_id),

  CONSTRAINT chk_target_value  CHECK (target_value > 0),
  CONSTRAINT chk_current_value CHECK (current_value >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────
-- 4. Optional: body_measurements (Step 6)
-- ─────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS body_measurements (
--   id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
--   user_id       INT UNSIGNED  NOT NULL,
--   measured_at   DATE          NOT NULL,
--   weight_kg     DECIMAL(5,2)  NULL,
--   body_fat_pct  DECIMAL(4,1)  NULL,
--   notes         TEXT          NULL,
--   created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   PRIMARY KEY (id),
--   CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   INDEX idx_bm_user_date (user_id, measured_at DESC)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
