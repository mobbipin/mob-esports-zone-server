ALTER TABLE Team ADD COLUMN createdAt TEXT;
UPDATE Team SET createdAt = datetime('now') WHERE createdAt IS NULL; 