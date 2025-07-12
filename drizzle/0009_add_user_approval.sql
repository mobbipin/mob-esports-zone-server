-- Add isApproved field to User table for tournament organizers
ALTER TABLE User ADD COLUMN isApproved BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN approvedBy TEXT REFERENCES User(id);
ALTER TABLE User ADD COLUMN approvedAt TEXT; 