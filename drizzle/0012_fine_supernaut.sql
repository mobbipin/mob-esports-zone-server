ALTER TABLE `PendingPost` ADD `originalId` text;--> statement-breakpoint
ALTER TABLE `PendingPost` ADD `action` text DEFAULT 'create' NOT NULL;--> statement-breakpoint
ALTER TABLE `PendingTournament` ADD `originalId` text;--> statement-breakpoint
ALTER TABLE `PendingTournament` ADD `action` text DEFAULT 'create' NOT NULL;