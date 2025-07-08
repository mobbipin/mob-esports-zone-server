CREATE TABLE `Friend` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`friendId` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Message` (
	`id` text PRIMARY KEY NOT NULL,
	`senderId` text NOT NULL,
	`recipientId` text,
	`teamId` text,
	`content` text NOT NULL,
	`createdAt` text NOT NULL,
	`isRead` integer DEFAULT 0,
	`isBulk` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `Notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`link` text,
	`isRead` integer DEFAULT 0,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `User` ADD `isPublic` integer DEFAULT 1;