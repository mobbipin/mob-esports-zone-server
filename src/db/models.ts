import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const User = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const PlayerProfile = sqliteTable('PlayerProfile', {
  userId: text('userId').primaryKey(),
  bio: text('bio'),
  gameId: text('gameId'),
  avatar: text('avatar'),
});

export const Team = sqliteTable('Team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logoUrl'),
  ownerId: text('ownerId').notNull(),
});

export const TeamMembership = sqliteTable('TeamMembership', {
  userId: text('userId').notNull(),
  teamId: text('teamId').notNull(),
  role: text('role').notNull(),
});

export const Tournament = sqliteTable('Tournament', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  date: text('date').notNull(),
  status: text('status').notNull(),
  createdBy: text('createdBy').notNull(),
});

export const Registration = sqliteTable('Registration', {
  teamId: text('teamId').notNull(),
  tournamentId: text('tournamentId').notNull(),
});

export const Match = sqliteTable('Match', {
  id: text('id').primaryKey(),
  tournamentId: text('tournamentId').notNull(),
  teamAId: text('teamAId').notNull(),
  teamBId: text('teamBId').notNull(),
  scoreA: integer('scoreA'),
  scoreB: integer('scoreB'),
  winnerId: text('winnerId'),
});

export const Post = sqliteTable('Post', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('imageUrl'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
}); 