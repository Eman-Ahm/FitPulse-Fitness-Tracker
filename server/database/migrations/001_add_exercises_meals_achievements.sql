-- Migration 001: Add exercises, meals, achievements tables
-- Run this ONLY if you already have users/workouts/goals from an older schema.
-- Safe to re-run: all statements use CREATE TABLE IF NOT EXISTS.
-- Compatible with MariaDB 10.4+ (XAMPP)

USE fitpulse;

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
  CONSTRAINT fk_ex_user_m001 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ex_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meals (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  meal_date   DATE          NOT NULL,
  meal_type   ENUM('Breakfast','Lunch','Dinner','Snack') NOT NULL DEFAULT 'Snack',
  name        VARCHAR(200)  NOT NULL,
  calories    SMALLINT UNSIGNED NOT NULL,
  protein_g   DECIMAL(6,1)  NULL,
  carbs_g     DECIMAL(6,1)  NULL,
  fat_g       DECIMAL(6,1)  NULL,
  notes       TEXT          NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_meals_user_m001 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_meals_user_date (user_id, meal_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  key_name    VARCHAR(100)  NOT NULL,
  title       VARCHAR(150)  NOT NULL,
  description VARCHAR(255)  NULL,
  icon        VARCHAR(10)   NOT NULL DEFAULT '🏆',
  earned_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ach_user_m001 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ach_user_key (user_id, key_name),
  INDEX idx_ach_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
