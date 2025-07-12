CREATE TABLE `PendingPost` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`createdBy` text NOT NULL,
	`createdAt` text NOT NULL,
	`reviewedBy` text,
	`reviewedAt` text,
	`reviewStatus` text DEFAULT 'pending' NOT NULL,
	`reviewNotes` text
);
--> statement-breakpoint
CREATE TABLE `PendingTournament` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`game` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`maxTeams` integer NOT NULL,
	`prizePool` real,
	`entryFee` real,
	`rules` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdBy` text NOT NULL,
	`createdAt` text NOT NULL,
	`imageUrl` text,
	`type` text DEFAULT 'squad' NOT NULL,
	`reviewedBy` text,
	`reviewedAt` text,
	`reviewStatus` text DEFAULT 'pending' NOT NULL,
	`reviewNotes` text
);
