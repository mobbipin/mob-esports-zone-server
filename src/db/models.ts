import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const User = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull(),
  username: text('username'),
  displayName: text('displayName'),
  avatar: text('avatar'),
  createdAt: text('createdAt').notNull(),
  banned: integer('banned').default(0),
  isPublic: integer('isPublic').default(1),
  emailVerified: integer('emailVerified').default(0),
  emailVerificationToken: text('emailVerificationToken'),
  isDeleted: integer('isDeleted').default(0),
  deletedAt: text('deletedAt'),
  isApproved: integer('isApproved').default(0), // For tournament organizers
  approvedBy: text('approvedBy'), // Admin who approved the organizer
  approvedAt: text('approvedAt'), // When the organizer was approved
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
  type: text('type').notNull().default('squad'), // 'solo', 'duo', 'squad'
  isApproved: integer('isApproved').default(0),
  approvedBy: text('approvedBy'),
  approvedAt: text('approvedAt'),
});

export const TournamentRegistration = sqliteTable('TournamentRegistration', {
  tournamentId: text('tournamentId').notNull(),
  teamId: text('teamId'),
  userId: text('userId'), // For solo tournaments
  registeredAt: text('registeredAt').notNull(),
  registeredPlayers: text('registeredPlayers'), // JSON array of player IDs for squad tournaments
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
  isApproved: integer('isApproved').default(0),
  approvedBy: text('approvedBy'),
  approvedAt: text('approvedAt'),
  likes: integer('likes').default(0),
});

export const PendingTournament = sqliteTable('PendingTournament', {
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
  status: text('status').notNull().default('pending'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
  imageUrl: text('imageUrl'),
  type: text('type').notNull().default('squad'),
  reviewedBy: text('reviewedBy'),
  reviewedAt: text('reviewedAt'),
  reviewStatus: text('reviewStatus').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reviewNotes: text('reviewNotes'),
  originalId: text('originalId'), // For update/delete operations on approved content
  action: text('action').notNull().default('create'), // 'create', 'update', 'delete'
});

export const PendingPost = sqliteTable('PendingPost', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('imageUrl'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
  reviewedBy: text('reviewedBy'),
  reviewedAt: text('reviewedAt'),
  reviewStatus: text('reviewStatus').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reviewNotes: text('reviewNotes'),
  originalId: text('originalId'), // For update/delete operations on approved content
  action: text('action').notNull().default('create'), // 'create', 'update', 'delete'
});

export const PostLikes = sqliteTable('PostLikes', {
  postId: text('postId').notNull(),
  userId: text('userId').notNull(),
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
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('isRead').default(0),
  createdAt: text('createdAt').notNull(),
  data: text('data'), // JSON string for additional data
});

export const FriendRequest = sqliteTable('FriendRequest', {
  id: text('id').primaryKey(),
  senderId: text('senderId').notNull(),
  receiverId: text('receiverId').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'cancelled'
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const PasswordReset = sqliteTable('PasswordReset', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  token: text('token').notNull().unique(),
  otp: text('otp').notNull(),
  expiresAt: text('expiresAt').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const Friend = sqliteTable('Friend', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  friendId: text('friendId').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('createdAt').notNull(),
}); 