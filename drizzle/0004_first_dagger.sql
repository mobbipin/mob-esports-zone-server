PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tag` text,
	`bio` text,
	`logoUrl` text,
	`region` text,
	`ownerId` text NOT NULL,
	`matchesPlayed` integer DEFAULT 0,
	`wins` integer DEFAULT 0,
	`createdAt` text
);
--> statement-breakpoint
INSERT INTO `__new_Team`("id", "name", "tag", "bio", "logoUrl", "region", "ownerId", "matchesPlayed", "wins", "createdAt") SELECT "id", "name", "tag", "bio", "logoUrl", "region", "ownerId", "matchesPlayed", "wins", "createdAt" FROM `Team`;--> statement-breakpoint
DROP TABLE `Team`;--> statement-breakpoint
ALTER TABLE `__new_Team` RENAME TO `Team`;--> statement-breakpoint
PRAGMA foreign_keys=ON;