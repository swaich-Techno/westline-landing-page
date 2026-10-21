CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  company TEXT NOT NULL CHECK (length(company) BETWEEN 1 AND 160),
  request_type TEXT NOT NULL CHECK (request_type IN ('sample', 'enquiry')),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 2000)
);

CREATE INDEX IF NOT EXISTS enquiries_created_at ON enquiries (created_at);
CREATE INDEX IF NOT EXISTS enquiries_email_created_at ON enquiries (email, created_at);
