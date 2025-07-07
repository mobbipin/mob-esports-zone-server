CREATE TABLE `TeamInvite` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`invitedUserId` text NOT NULL,
	`invitedBy` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` text NOT NULL
);
