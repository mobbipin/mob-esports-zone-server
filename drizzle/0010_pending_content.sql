-- Create PendingTournament table for organizer submissions
CREATE TABLE IF NOT EXISTS PendingTournament (
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
  status TEXT NOT NULL DEFAULT 'pending',
  createdBy TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'squad',
  imageUrl TEXT,
  reviewedBy TEXT REFERENCES User(id),
  reviewedAt TEXT,
  reviewNotes TEXT
);

-- Create PendingPost table for organizer submissions
CREATE TABLE IF NOT EXISTS PendingPost (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  imageUrl TEXT,
  createdBy TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL,
  reviewedBy TEXT REFERENCES User(id),
  reviewedAt TEXT,
  reviewNotes TEXT
); 