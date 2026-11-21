-- FitPulse Database Schema
-- Compatible with MariaDB 10.4+ (XAMPP). Safe to re-import: CREATE TABLE IF NOT EXISTS.
-- Run in phpMyAdmin: Database → Import → select this file → Go

CREATE DATABASE IF NOT EXISTS fitpulse
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitpulse;

-- ── 1. Users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(255)  NOT NULL,
  password   VARCHAR(255)  NOT NULL,   -- bcrypt hash only
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Workouts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED    NOT NULL,
  workout_date DATE            NOT NULL,
  type         VARCHAR(100)    NOT NULL,
  duration_min SMALLINT UNSIGNED NOT NULL,
  calories     SMALLINT UNSIGNED NULL,
  distance_km  DECIMAL(6,2)    NULL,
  notes        TEXT            NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_workouts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workouts_user_date (user_id, workout_date),
  CONSTRAINT chk_duration CHECK (duration_min > 0),
  CONSTRAINT chk_calories  CHECK (calories IS NULL OR calories > 0),
  CONSTRAINT chk_distance  CHECK (distance_km IS NULL OR distance_km >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Goals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED  NOT NULL,
  title         VARCHAR(150)  NOT NULL,
  description   TEXT          NULL,
  goal_type     ENUM('workouts_count','duration_min','calories','distance_km','weight_kg','custom')
                NOT NULL DEFAULT 'custom',
  target_value  DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit          VARCHAR(50)   NULL,
  deadline      DATE          NULL,
  is_completed  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goals_user (user_id),
  CONSTRAINT chk_target_value  CHECK (target_value > 0),
  CONSTRAINT chk_current_value CHECK (current_value >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Exercises ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED  NOT NULL,
  name             VARCHAR(150)  NOT NULL,
  category         VARCHAR(100)  NOT NULL DEFAULT 'General',
  muscle_group     VARCHAR(100)  NULL,
  equipment        VARCHAR(100)  NULL,
  instructions     TEXT          NULL,
  calories_per_min DECIMAL(5,2)  NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ex_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ex_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Meals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meals (
  id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id   INT UNSIGNED  NOT NULL,
  meal_date DATE          NOT NULL,
  meal_type ENUM('Breakfast','Lunch','Dinner','Snack') NOT NULL DEFAULT 'Snack',
  name      VARCHAR(200)  NOT NULL,
  calories  SMALLINT UNSIGNED NOT NULL,
  protein_g DECIMAL(6,1)  NULL,
  carbs_g   DECIMAL(6,1)  NULL,
  fat_g     DECIMAL(6,1)  NULL,
  notes     TEXT          NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_meals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_meals_user_date (user_id, meal_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Achievements ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  key_name    VARCHAR(100)  NOT NULL,
  title       VARCHAR(150)  NOT NULL,
  description VARCHAR(255)  NULL,
  icon        VARCHAR(10)   NOT NULL DEFAULT '🏆',
  earned_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ach_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ach_user_key (user_id, key_name),
  INDEX idx_ach_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Body measurements ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_measurements (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  measured_at  DATE          NOT NULL,
  weight_kg    DECIMAL(5,2)  NULL,
  body_fat_pct DECIMAL(4,1)  NULL,
  chest_cm     DECIMAL(5,1)  NULL,
  waist_cm     DECIMAL(5,1)  NULL,
  hips_cm      DECIMAL(5,1)  NULL,
  notes        TEXT          NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bm_user_date (user_id, measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Water intake ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_intake (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  logged_date  DATE          NOT NULL,
  amount_ml    SMALLINT UNSIGNED NOT NULL,   -- e.g. 250 per glass
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_water_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_water_user_date (user_id, logged_date),
  CONSTRAINT chk_water_amount CHECK (amount_ml > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. Password reset tokens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED  NOT NULL,
  token_hash VARCHAR(255)  NOT NULL,   -- SHA-256 hash of the random token
  expires_at DATETIME      NOT NULL,
  used       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pr_token (token_hash),
  INDEX idx_pr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
