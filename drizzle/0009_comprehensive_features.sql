-- Migration: Comprehensive Features Update
-- This migration adds support for:
-- 1. Tournament organizers role
-- 2. Email verification
-- 3. Friend requests
-- 4. Post likes
-- 5. Enhanced tournament registration (solo/duo/squad)
-- 6. Notifications
-- 7. Password reset
-- 8. Soft delete for users

-- Update User table
ALTER TABLE User ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN emailVerificationToken TEXT;
ALTER TABLE User ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN deletedAt TEXT;

-- Update role constraint to include tournament_organizer
-- Note: SQLite doesn't support modifying CHECK constraints, so we'll need to recreate the table
-- This is handled in the schema.sql file

-- Update Tournament table
ALTER TABLE Tournament ADD COLUMN type TEXT NOT NULL DEFAULT 'squad';
ALTER TABLE Tournament ADD COLUMN isApproved BOOLEAN DEFAULT FALSE;
ALTER TABLE Tournament ADD COLUMN approvedBy TEXT REFERENCES User(id);
ALTER TABLE Tournament ADD COLUMN approvedAt TEXT;

-- Update TournamentRegistration table
ALTER TABLE TournamentRegistration ADD COLUMN userId TEXT REFERENCES User(id);
ALTER TABLE TournamentRegistration ADD COLUMN registeredPlayers TEXT;

-- Update Post table
ALTER TABLE Post ADD COLUMN isApproved BOOLEAN DEFAULT FALSE;
ALTER TABLE Post ADD COLUMN approvedBy TEXT REFERENCES User(id);
ALTER TABLE Post ADD COLUMN approvedAt TEXT;
ALTER TABLE Post ADD COLUMN likes INTEGER DEFAULT 0;

-- Create new tables
CREATE TABLE IF NOT EXISTS PostLikes (
  postId TEXT NOT NULL REFERENCES Post(id),
  userId TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  PRIMARY KEY (postId, userId)
);

CREATE TABLE IF NOT EXISTS FriendRequest (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL REFERENCES User(id),
  receiverId TEXT NOT NULL REFERENCES User(id),
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  data TEXT
);

CREATE TABLE IF NOT EXISTS PasswordReset (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id),
  token TEXT NOT NULL UNIQUE,
  otp TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
); 