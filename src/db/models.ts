import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const User = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull(),
  username: text('username'),
  displayName: text('displayName'),
  createdAt: text('createdAt').notNull(),
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
  rules: text('rules'),
  bannerUrl: text('bannerUrl'),
  maxTeams: integer('maxTeams'),
  registrationDeadline: text('registrationDeadline'),
  prizePool: text('prizePool'),
  isOnline: integer('isOnline'),
  mapPool: text('mapPool'), // JSON array string
  contactDiscord: text('contactDiscord'),
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
  round: text('round'),
  map: text('map'),
  format: text('format'),
  matchTime: text('matchTime'),
  maxPoints: integer('maxPoints'),
});

export const Post = sqliteTable('Post', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('imageUrl'),
  createdBy: text('createdBy').notNull(),
  createdAt: text('createdAt').notNull(),
}); 