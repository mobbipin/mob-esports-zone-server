-- User table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('player', 'admin', 'tournament_organizer')),
  username TEXT,
  displayName TEXT,
  avatar TEXT,
  createdAt TEXT NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  emailVerificationToken TEXT,
  isDeleted BOOLEAN DEFAULT FALSE,
  deletedAt TEXT
);

-- PlayerProfile table
CREATE TABLE IF NOT EXISTS PlayerProfile (
  userId TEXT PRIMARY KEY REFERENCES User(id),
  bio TEXT,
  region TEXT,
  gameId TEXT,
  avatar TEXT,
  rank TEXT,
  winRate REAL,
  kills INTEGER,
  social TEXT, -- JSON string: { twitch, discord }
  achievements TEXT -- JSON array string
);

-- Team table
CREATE TABLE IF NOT EXISTS Team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT,
  bio TEXT,
  logoUrl TEXT,
  region TEXT,
  ownerId TEXT NOT NULL REFERENCES User(id),
  matchesPlayed INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0
);

-- TeamMembership table
CREATE TABLE IF NOT EXISTS TeamMembership (
  userId TEXT NOT NULL REFERENCES User(id),
  teamId TEXT NOT NULL REFERENCES Team(id),
  role TEXT NOT NULL,
  PRIMARY KEY (userId, teamId)
);

-- Tournament table (updated to match our controller usage)
CREATE TABLE IF NOT EXISTS Tournament (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  game TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  maxTeams INTEGER NOT NULL,
  prizePool REAL,
  entryFee REAL,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  createdBy TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'squad', -- 'solo', 'duo', 'squad'
  isApproved BOOLEAN DEFAULT FALSE,
  approvedBy TEXT REFERENCES User(id),
  approvedAt TEXT
);

-- TournamentRegistration table (for team registrations)
CREATE TABLE IF NOT EXISTS TournamentRegistration (
  tournamentId TEXT NOT NULL REFERENCES Tournament(id),
  teamId TEXT REFERENCES Team(id),
  userId TEXT REFERENCES User(id), -- For solo tournaments
  registeredAt TEXT NOT NULL,
  registeredPlayers TEXT, -- JSON array of player IDs for squad tournaments
  PRIMARY KEY (tournamentId, teamId, userId)
);

-- Match table (updated to match our controller usage)
CREATE TABLE IF NOT EXISTS Match (
  id TEXT PRIMARY KEY,
  tournamentId TEXT NOT NULL REFERENCES Tournament(id),
  team1Id TEXT REFERENCES Team(id),
  team2Id TEXT REFERENCES Team(id),
  round INTEGER NOT NULL,
  matchNumber INTEGER NOT NULL,
  winnerId TEXT REFERENCES Team(id),
  score1 INTEGER,
  score2 INTEGER,
  status TEXT DEFAULT 'pending'
);

-- Post table
CREATE TABLE IF NOT EXISTS Post (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  imageUrl TEXT,
  createdBy TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  isApproved BOOLEAN DEFAULT FALSE,
  approvedBy TEXT REFERENCES User(id),
  approvedAt TEXT,
  likes INTEGER DEFAULT 0
);

-- PostLikes table
CREATE TABLE IF NOT EXISTS PostLikes (
  postId TEXT NOT NULL REFERENCES Post(id),
  userId TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  PRIMARY KEY (postId, userId)
);

-- FriendRequest table
CREATE TABLE IF NOT EXISTS FriendRequest (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL REFERENCES User(id),
  receiverId TEXT NOT NULL REFERENCES User(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Notification table
CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id),
  type TEXT NOT NULL, -- 'friend_request', 'tournament_invite', 'admin_message', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  data TEXT -- JSON string for additional data
);

-- PasswordReset table
CREATE TABLE IF NOT EXISTS PasswordReset (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id),
  token TEXT NOT NULL UNIQUE,
  otp TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

-- FileUpload table
CREATE TABLE IF NOT EXISTS FileUpload (
  id TEXT PRIMARY KEY,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileUrl TEXT NOT NULL,
  uploadedBy TEXT NOT NULL REFERENCES User(id),
  uploadDate TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TeamInvite (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL REFERENCES Team(id),
  invitedBy TEXT NOT NULL REFERENCES User(id),
  invitedEmail TEXT NOT NULL,
  invitedUserId TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  createdAt TEXT NOT NULL
); 