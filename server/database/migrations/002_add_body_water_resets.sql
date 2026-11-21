-- Migration 002: Add body_measurements, water_intake, password_resets
-- Run if you already have the 6-table schema (users/workouts/goals/exercises/meals/achievements)
USE fitpulse;

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
  CONSTRAINT fk_bm_user_m002 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bm_user_date (user_id, measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS water_intake (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  logged_date DATE          NOT NULL,
  amount_ml   SMALLINT UNSIGNED NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_water_user_m002 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_water_user_date (user_id, logged_date),
  CONSTRAINT chk_water_amount CHECK (amount_ml > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED  NOT NULL,
  token_hash VARCHAR(255)  NOT NULL,
  expires_at DATETIME      NOT NULL,
  used       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pr_user_m002 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pr_token (token_hash),
  INDEX idx_pr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
