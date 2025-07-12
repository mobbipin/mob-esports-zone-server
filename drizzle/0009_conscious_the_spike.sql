CREATE TABLE `FriendRequest` (
	`id` text PRIMARY KEY NOT NULL,
	`senderId` text NOT NULL,
	`receiverId` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `PasswordReset` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`otp` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PasswordReset_token_unique` ON `PasswordReset` (`token`);--> statement-breakpoint
CREATE TABLE `PostLikes` (
	`postId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_TournamentRegistration` (
	`tournamentId` text NOT NULL,
	`teamId` text,
	`userId` text,
	`registeredAt` text NOT NULL,
	`registeredPlayers` text
);
--> statement-breakpoint
INSERT INTO `__new_TournamentRegistration`("tournamentId", "teamId", "userId", "registeredAt", "registeredPlayers") SELECT "tournamentId", "teamId", "userId", "registeredAt", "registeredPlayers" FROM `TournamentRegistration`;--> statement-breakpoint
DROP TABLE `TournamentRegistration`;--> statement-breakpoint
ALTER TABLE `__new_TournamentRegistration` RENAME TO `TournamentRegistration`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `Notification` ADD `title` text NOT NULL;--> statement-breakpoint
ALTER TABLE `Notification` ADD `message` text NOT NULL;--> statement-breakpoint
ALTER TABLE `Notification` ADD `data` text;--> statement-breakpoint
ALTER TABLE `Notification` DROP COLUMN `content`;--> statement-breakpoint
ALTER TABLE `Notification` DROP COLUMN `link`;--> statement-breakpoint
ALTER TABLE `Post` ADD `isApproved` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `Post` ADD `approvedBy` text;--> statement-breakpoint
ALTER TABLE `Post` ADD `approvedAt` text;--> statement-breakpoint
ALTER TABLE `Post` ADD `likes` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `Tournament` ADD `type` text DEFAULT 'squad' NOT NULL;--> statement-breakpoint
ALTER TABLE `Tournament` ADD `isApproved` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `Tournament` ADD `approvedBy` text;--> statement-breakpoint
ALTER TABLE `Tournament` ADD `approvedAt` text;--> statement-breakpoint
ALTER TABLE `User` ADD `emailVerified` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `User` ADD `emailVerificationToken` text;--> statement-breakpoint
ALTER TABLE `User` ADD `isDeleted` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `User` ADD `deletedAt` text;