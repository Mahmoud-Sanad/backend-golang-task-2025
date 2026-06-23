-- CreateTable
CREATE TABLE `peer_servers` (
    `server_id` VARCHAR(191) NOT NULL,
    `host` VARCHAR(191) NOT NULL,
    `port` INTEGER NOT NULL,
    `ws_url` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ONLINE',
    `last_seen` DATETIME(3) NOT NULL,

    PRIMARY KEY (`server_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
