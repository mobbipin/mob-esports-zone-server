import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const User = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull(),
  username: text('username'),
  displayName: text('displayName'),
  createdAt: text('createdAt').notNull(),
  banned: integer('banned').default(0),
  isPublic: integer('isPublic').default(1),
});

export const PlayerProfile = sqliteTable('PlayerProfile', {
  userId: text('userId').primaryKey(),
  bio: text('bio'),
  region: text('region'),
  gameId: text('gameId'),
  avatar: text('avatar'),
  rank: text('rank'),
  winRate: real('winRate'),
  kills: integer('kills'),
  social: text('social'), // JSON string
  achievements: text('achievements'), // JSON array string
});

export const Team = sqliteTable('Team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tag: text('tag'),
  bio: text('bio'),
  logoUrl: text('logoUrl'),
  region: text('region'),
  ownerId: text('ownerId').notNull(),
  matchesPlayed: integer('matchesPlayed').default(0),
  wins: integer('wins').default(0),
  createdAt: text('createdAt') ,
});

export const TeamMembership = sqliteTable('TeamMembership', {
  userId: text('userId').notNull(),
  teamId: text('teamId').notNull(),
  role: text('role').notNull(),
});

export const TeamInvite = sqliteTable('TeamInvite', {
  id: text('id').primaryKey(),
  teamId: text('teamId').notNull(),
  invitedUserId: text('invitedUserId').notNull(),
  invitedBy: text('invitedBy').notNull(),
  status: text('status').notNull().default('pending'), // pending, accepted, rejected
  createdAt: text('createdAt').notNull(),
});

export const Tournament = sqliteTable('Tournament', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  game: text('game').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate').notNull(),
  maxTeams: integer('maxTeams').notNull(),
  prizePool: real('prizePool'),
  entryFee: real('entryFee'),
  rules: text('rules'),
  status: text('status').notNull().default('upcoming'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
  imageUrl: text('imageUrl'), // Added field for tournament image
});

export const TournamentRegistration = sqliteTable('TournamentRegistration', {
  tournamentId: text('tournamentId').notNull(),
  teamId: text('teamId').notNull(),
  registeredAt: text('registeredAt').notNull(),
});

export const Match = sqliteTable('Match', {
  id: text('id').primaryKey(),
  tournamentId: text('tournamentId').notNull(),
  team1Id: text('team1Id'),
  team2Id: text('team2Id'),
  round: integer('round').notNull(),
  matchNumber: integer('matchNumber').notNull(),
  winnerId: text('winnerId'),
  score1: integer('score1'),
  score2: integer('score2'),
  status: text('status').default('pending'),
});

export const Post = sqliteTable('Post', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('imageUrl'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const FileUpload = sqliteTable('FileUpload', {
  id: text('id').primaryKey(),
  fileName: text('fileName').notNull(),
  fileType: text('fileType').notNull(),
  fileSize: integer('fileSize').notNull(),
  fileUrl: text('fileUrl').notNull(),
  uploadedBy: text('uploadedBy').notNull(),
  uploadDate: text('uploadDate').notNull(),
});

export const Message = sqliteTable('Message', {
  id: text('id').primaryKey(),
  senderId: text('senderId').notNull(),
  recipientId: text('recipientId'),
  teamId: text('teamId'),
  content: text('content').notNull(),
  createdAt: text('createdAt').notNull(),
  isRead: integer('isRead').default(0),
  isBulk: integer('isBulk').default(0),
});

export const Notification = sqliteTable('Notification', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  content: text('content').notNull(),
  link: text('link'),
  isRead: integer('isRead').default(0),
  createdAt: text('createdAt').notNull(),
});

export const Friend = sqliteTable('Friend', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  friendId: text('friendId').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('createdAt').notNull(),
}); 