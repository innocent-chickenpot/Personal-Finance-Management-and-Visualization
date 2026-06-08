-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `source` VARCHAR(20) NULL,
    ADD COLUMN `source_transaction_id` VARCHAR(128) NULL;

-- CreateTable
CREATE TABLE `category_mappings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `source` VARCHAR(20) NOT NULL,
    `source_name` VARCHAR(100) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `category_mappings_user_id_source_source_name_key`(`user_id`, `source`, `source_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `category_mappings` ADD CONSTRAINT `category_mappings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_mappings` ADD CONSTRAINT `category_mappings_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
