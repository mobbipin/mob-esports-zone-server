ALTER TABLE `User` ADD `isApproved` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `User` ADD `approvedBy` text;--> statement-breakpoint
ALTER TABLE `User` ADD `approvedAt` text;