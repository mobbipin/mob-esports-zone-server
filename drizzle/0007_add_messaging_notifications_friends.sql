-- Message table
CREATE TABLE IF NOT EXISTS Message (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL,
  recipientId TEXT,
  teamId TEXT,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  isRead INTEGER DEFAULT 0,
  isBulk INTEGER DEFAULT 0,
  FOREIGN KEY(senderId) REFERENCES User(id),
  FOREIGN KEY(recipientId) REFERENCES User(id),
  FOREIGN KEY(teamId) REFERENCES Team(id)
);

-- Notification table
CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id)
);

-- Friend table
CREATE TABLE IF NOT EXISTS Friend (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  friendId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, blocked
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id),
  FOREIGN KEY(friendId) REFERENCES User(id)
);

-- Add isPublic to User
ALTER TABLE User ADD COLUMN isPublic INTEGER DEFAULT 1; 