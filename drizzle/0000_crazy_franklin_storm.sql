CREATE TABLE `Match` (
	`id` text PRIMARY KEY NOT NULL,
	`tournamentId` text NOT NULL,
	`teamAId` text NOT NULL,
	`teamBId` text NOT NULL,
	`scoreA` integer,
	`scoreB` integer,
	`winnerId` text,
	`round` text,
	`map` text,
	`format` text,
	`matchTime` text,
	`maxPoints` integer
);
--> statement-breakpoint
CREATE TABLE `PlayerProfile` (
	`userId` text PRIMARY KEY NOT NULL,
	`bio` text,
	`region` text,
	`gameId` text,
	`avatar` text,
	`rank` text,
	`winRate` real,
	`kills` integer,
	`social` text,
	`achievements` text
);
--> statement-breakpoint
CREATE TABLE `Post` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`createdBy` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Registration` (
	`teamId` text NOT NULL,
	`tournamentId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tag` text,
	`bio` text,
	`logoUrl` text,
	`region` text,
	`ownerId` text NOT NULL,
	`matchesPlayed` integer DEFAULT 0,
	`wins` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `TeamMembership` (
	`userId` text NOT NULL,
	`teamId` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Tournament` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`createdBy` text NOT NULL,
	`rules` text,
	`bannerUrl` text,
	`maxTeams` integer,
	`registrationDeadline` text,
	`prizePool` text,
	`isOnline` integer,
	`mapPool` text,
	`contactDiscord` text
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`role` text NOT NULL,
	`username` text,
	`displayName` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);