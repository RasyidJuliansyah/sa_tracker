-- 002: kolom users.last_login_at (layar Akun: "Login terakhir"). Idempotent.
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at');
SET @sql := IF(@has = 0, 'ALTER TABLE users ADD COLUMN last_login_at DATETIME(3) NULL AFTER is_active', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
