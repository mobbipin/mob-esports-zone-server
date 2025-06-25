CREATE TABLE `FileUpload` (
	`id` text PRIMARY KEY NOT NULL,
	`fileName` text NOT NULL,
	`fileType` text NOT NULL,
	`fileSize` integer NOT NULL,
	`fileUrl` text NOT NULL,
	`uploadedBy` text NOT NULL,
	`uploadDate` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `TournamentRegistration` (
	`tournamentId` text NOT NULL,
	`teamId` text NOT NULL,
	`registeredAt` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `Registration`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Match` (
	`id` text PRIMARY KEY NOT NULL,
	`tournamentId` text NOT NULL,
	`team1Id` text,
	`team2Id` text,
	`round` integer NOT NULL,
	`matchNumber` integer NOT NULL,
	`winnerId` text,
	`score1` integer,
	`score2` integer,
	`status` text DEFAULT 'pending'
);
--> statement-breakpoint
INSERT INTO `__new_Match`("id", "tournamentId", "team1Id", "team2Id", "round", "matchNumber", "winnerId", "score1", "score2", "status") SELECT "id", "tournamentId", "team1Id", "team2Id", "round", "matchNumber", "winnerId", "score1", "score2", "status" FROM `Match`;--> statement-breakpoint
DROP TABLE `Match`;--> statement-breakpoint
ALTER TABLE `__new_Match` RENAME TO `Match`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_Tournament` (
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
	`status` text DEFAULT 'upcoming' NOT NULL,
	`createdBy` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_Tournament`("id", "name", "description", "game", "startDate", "endDate", "maxTeams", "prizePool", "entryFee", "rules", "status", "createdBy", "createdAt") SELECT "id", "name", "description", "game", "startDate", "endDate", "maxTeams", "prizePool", "entryFee", "rules", "status", "createdBy", "createdAt" FROM `Tournament`;--> statement-breakpoint
DROP TABLE `Tournament`;--> statement-breakpoint
ALTER TABLE `__new_Tournament` RENAME TO `Tournament`;