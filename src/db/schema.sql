-- User table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('player', 'admin')),
  createdAt TEXT NOT NULL
);

-- PlayerProfile table
CREATE TABLE IF NOT EXISTS PlayerProfile (
  userId TEXT PRIMARY KEY REFERENCES User(id),
  bio TEXT,
  gameId TEXT,
  avatar TEXT
);

-- Team table
CREATE TABLE IF NOT EXISTS Team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logoUrl TEXT,
  ownerId TEXT NOT NULL REFERENCES User(id)
);

-- TeamMembership table
CREATE TABLE IF NOT EXISTS TeamMembership (
  userId TEXT NOT NULL REFERENCES User(id),
  teamId TEXT NOT NULL REFERENCES Team(id),
  role TEXT NOT NULL,
  PRIMARY KEY (userId, teamId)
);

-- Tournament table
CREATE TABLE IF NOT EXISTS Tournament (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  createdBy TEXT NOT NULL REFERENCES User(id)
);

-- Registration table
CREATE TABLE IF NOT EXISTS Registration (
  teamId TEXT NOT NULL REFERENCES Team(id),
  tournamentId TEXT NOT NULL REFERENCES Tournament(id),
  PRIMARY KEY (teamId, tournamentId)
);

-- Match table
CREATE TABLE IF NOT EXISTS Match (
  id TEXT PRIMARY KEY,
  tournamentId TEXT NOT NULL REFERENCES Tournament(id),
  teamAId TEXT NOT NULL REFERENCES Team(id),
  teamBId TEXT NOT NULL REFERENCES Team(id),
  scoreA INTEGER,
  scoreB INTEGER,
  winnerId TEXT REFERENCES Team(id)
);

-- Post table
CREATE TABLE IF NOT EXISTS Post (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  imageUrl TEXT,
  createdBy TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL
); 