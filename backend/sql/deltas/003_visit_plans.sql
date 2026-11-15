-- 003: rencana kunjungan (revisi 15). Lihat docs/prd-rencana-kunjungan.md.
-- Menambah tabel visit_plans, kolom visits.plan_id, dan nilai enum audit_logs.action.
-- Idempotent: aman dijalankan dua kali. Jalankan manual lewat DBeaver di produksi.
-- Dihasilkan dari backend/prisma/schema.prisma lalu dirapikan. JANGAN pakai prisma migrate di produksi.

-- CreateTable visit_plans
CREATE TABLE IF NOT EXISTS `visit_plans` (
    `plan_id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `school_id` INTEGER NOT NULL,
    `plan_date` DATE NOT NULL,
    `purpose` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_by_id` INTEGER NOT NULL,
    `decided_by_id` INTEGER NULL,
    `decided_at` DATETIME(3) NULL,
    `decision_note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `visit_plans_agent_id_plan_date_idx`(`agent_id`, `plan_date`),
    INDEX `visit_plans_school_id_plan_date_idx`(`school_id`, `plan_date`),
    INDEX `visit_plans_status_plan_date_idx`(`status`, `plan_date`),
    PRIMARY KEY (`plan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddColumn visits.plan_id (nullable, unik). Dicek lewat information_schema.
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'visits' AND COLUMN_NAME = 'plan_id');
SET @sql := IF(@has = 0, 'ALTER TABLE `visits` ADD COLUMN `plan_id` INTEGER NULL AFTER `status`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Unique index visits.plan_id (satu kunjungan per rencana)
SET @has := (SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'visits' AND INDEX_NAME = 'visits_plan_id_key');
SET @sql := IF(@has = 0, 'ALTER TABLE `visits` ADD UNIQUE INDEX `visits_plan_id_key`(`plan_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Perluas enum audit_logs.action dengan APPROVE, REJECT, CANCEL (idempotent: MODIFY penuh)
ALTER TABLE `audit_logs` MODIFY `action` ENUM(
    'CREATE', 'UPDATE', 'DEACTIVATE', 'ASSIGN', 'UNASSIGN', 'CHECK_IN', 'CHECK_OUT',
    'LOGIN', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'IMPORT', 'EXPORT',
    'APPROVE', 'REJECT', 'CANCEL'
) NOT NULL;

-- Foreign keys (dicek lewat information_schema sebelum dibuat)
SET @n := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'visit_plans_agent_id_fkey');
SET @s := IF(@n = 0, 'ALTER TABLE `visit_plans` ADD CONSTRAINT `visit_plans_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @n := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'visit_plans_school_id_fkey');
SET @s := IF(@n = 0, 'ALTER TABLE `visit_plans` ADD CONSTRAINT `visit_plans_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @n := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'visit_plans_created_by_id_fkey');
SET @s := IF(@n = 0, 'ALTER TABLE `visit_plans` ADD CONSTRAINT `visit_plans_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @n := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'visit_plans_decided_by_id_fkey');
SET @s := IF(@n = 0, 'ALTER TABLE `visit_plans` ADD CONSTRAINT `visit_plans_decided_by_id_fkey` FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @n := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'visits_plan_id_fkey');
SET @s := IF(@n = 0, 'ALTER TABLE `visits` ADD CONSTRAINT `visits_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `visit_plans`(`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
