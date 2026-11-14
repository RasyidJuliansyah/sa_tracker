-- 001_init: struktur awal database sa_visit_tracker (9 tabel).
-- Idempotent: aman dijalankan dua kali. Tabel memakai CREATE TABLE IF NOT EXISTS,
-- foreign key dicek lewat information_schema sebelum dibuat.
-- Dihasilkan dari backend/prisma/schema.prisma (prisma migrate diff), lalu dirapikan.
-- Jalankan manual lewat DBeaver. JANGAN pakai prisma migrate di produksi.

-- CreateTable
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT true,
    `role` ENUM('ADMIN', 'MANAGER', 'AGENT') NOT NULL DEFAULT 'AGENT',
    `timezone` ENUM('WIB', 'WITA', 'WIT') NOT NULL DEFAULT 'WIB',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `jenjang` (
    `jenjang_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jenjang_name_key`(`name`),
    PRIMARY KEY (`jenjang_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `packages` (
    `package_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `packages_name_key`(`name`),
    PRIMARY KEY (`package_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `schools` (
    `school_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lms_school_id` INTEGER NULL,
    `npsn` VARCHAR(10) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `jenjang_id` INTEGER NOT NULL,
    `package_id` INTEGER NOT NULL,
    `timezone` ENUM('WIB', 'WITA', 'WIT') NOT NULL DEFAULT 'WIB',
    `partnership_start_date` DATE NOT NULL,
    `onboarding_date` DATE NULL,
    `active_since_date` DATE NULL,
    `partnership_end_date` DATE NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `pic_name` VARCHAR(120) NULL,
    `pic_contact` VARCHAR(60) NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `schools_lms_school_id_key`(`lms_school_id`),
    UNIQUE INDEX `schools_npsn_key`(`npsn`),
    INDEX `schools_jenjang_id_idx`(`jenjang_id`),
    INDEX `schools_package_id_idx`(`package_id`),
    PRIMARY KEY (`school_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `school_contracts` (
    `contract_id` INTEGER NOT NULL AUTO_INCREMENT,
    `school_id` INTEGER NOT NULL,
    `contract_type` ENUM('NEW', 'RENEWAL') NOT NULL,
    `previous_contract_id` INTEGER NULL,
    `signed_date` DATE NULL,
    `contract_start_date` DATE NOT NULL,
    `contract_end_date` DATE NOT NULL,
    `contract_value` DECIMAL(15, 2) NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_contracts_previous_contract_id_key`(`previous_contract_id`),
    INDEX `school_contracts_school_id_contract_start_date_idx`(`school_id`, `contract_start_date`),
    INDEX `school_contracts_contract_end_date_idx`(`contract_end_date`),
    INDEX `school_contracts_signed_date_idx`(`signed_date`),
    UNIQUE INDEX `school_contracts_school_id_contract_start_date_key`(`school_id`, `contract_start_date`),
    PRIMARY KEY (`contract_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `retention_targets` (
    `retention_target_id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `target_percent` DECIMAL(5, 2) NOT NULL DEFAULT 65,
    `set_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `retention_targets_year_key`(`year`),
    PRIMARY KEY (`retention_target_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `school_assignments` (
    `assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `school_id` INTEGER NOT NULL,
    `agent_id` INTEGER NOT NULL,
    `assigned_by_id` INTEGER NOT NULL,
    `share_percent` DECIMAL(5, 2) NOT NULL DEFAULT 100,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unassigned_at` DATETIME(3) NULL,

    INDEX `school_assignments_agent_id_unassigned_at_idx`(`agent_id`, `unassigned_at`),
    INDEX `school_assignments_school_id_unassigned_at_idx`(`school_id`, `unassigned_at`),
    PRIMARY KEY (`assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `visits` (
    `visit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `school_id` INTEGER NOT NULL,
    `timezone` ENUM('WIB', 'WITA', 'WIT') NOT NULL,
    `check_in_at` DATETIME(3) NOT NULL,
    `check_in_lat` DECIMAL(9, 6) NOT NULL,
    `check_in_lng` DECIMAL(9, 6) NOT NULL,
    `check_in_accuracy` DOUBLE NULL,
    `photo_path` VARCHAR(255) NOT NULL,
    `check_out_at` DATETIME(3) NULL,
    `report` TEXT NULL,
    `status` ENUM('ONGOING', 'DONE') NOT NULL DEFAULT 'ONGOING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `visits_agent_id_check_in_at_idx`(`agent_id`, `check_in_at`),
    INDEX `visits_school_id_check_in_at_idx`(`school_id`, `check_in_at`),
    INDEX `visits_check_in_at_idx`(`check_in_at`),
    PRIMARY KEY (`visit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_id` INTEGER NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DEACTIVATE', 'ASSIGN', 'UNASSIGN', 'CHECK_IN', 'CHECK_OUT', 'LOGIN', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'IMPORT', 'EXPORT') NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INTEGER NULL,
    `changes` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_created_at_idx`(`entity_type`, `entity_id`, `created_at`),
    INDEX `audit_logs_actor_id_created_at_idx`(`actor_id`, `created_at`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FK users_created_by_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'users_created_by_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `users` ADD CONSTRAINT `users_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK schools_jenjang_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'schools' AND CONSTRAINT_NAME = 'schools_jenjang_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `schools` ADD CONSTRAINT `schools_jenjang_id_fkey` FOREIGN KEY (`jenjang_id`) REFERENCES `jenjang`(`jenjang_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK schools_package_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'schools' AND CONSTRAINT_NAME = 'schools_package_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `schools` ADD CONSTRAINT `schools_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`package_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK school_contracts_school_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'school_contracts' AND CONSTRAINT_NAME = 'school_contracts_school_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `school_contracts` ADD CONSTRAINT `school_contracts_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK school_contracts_previous_contract_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'school_contracts' AND CONSTRAINT_NAME = 'school_contracts_previous_contract_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `school_contracts` ADD CONSTRAINT `school_contracts_previous_contract_id_fkey` FOREIGN KEY (`previous_contract_id`) REFERENCES `school_contracts`(`contract_id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK school_contracts_created_by_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'school_contracts' AND CONSTRAINT_NAME = 'school_contracts_created_by_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `school_contracts` ADD CONSTRAINT `school_contracts_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK retention_targets_set_by_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'retention_targets' AND CONSTRAINT_NAME = 'retention_targets_set_by_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `retention_targets` ADD CONSTRAINT `retention_targets_set_by_id_fkey` FOREIGN KEY (`set_by_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK school_assignments_school_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'school_assignments' AND CONSTRAINT_NAME = 'school_assignments_school_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `school_assignments` ADD CONSTRAINT `school_assignments_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK school_assignments_agent_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'school_assignments' AND CONSTRAINT_NAME = 'school_assignments_agent_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `school_assignments` ADD CONSTRAINT `school_assignments_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK school_assignments_assigned_by_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'school_assignments' AND CONSTRAINT_NAME = 'school_assignments_assigned_by_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `school_assignments` ADD CONSTRAINT `school_assignments_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK visits_agent_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'visits' AND CONSTRAINT_NAME = 'visits_agent_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `visits` ADD CONSTRAINT `visits_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK visits_school_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'visits' AND CONSTRAINT_NAME = 'visits_school_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `visits` ADD CONSTRAINT `visits_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE RESTRICT ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- FK audit_logs_actor_id_fkey
SET @n = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND CONSTRAINT_NAME = 'audit_logs_actor_id_fkey');
SET @s = IF(@n = 0, 'ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

