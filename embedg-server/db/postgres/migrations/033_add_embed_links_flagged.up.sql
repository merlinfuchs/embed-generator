-- When the link was found to lead to a phishing site. Flagged links show a notice instead of their
-- preview and no longer send visitors to their URL.
ALTER TABLE embed_links ADD COLUMN flagged_at TIMESTAMP;
-- Why it was flagged, like the phishing domain it leads to.
ALTER TABLE embed_links ADD COLUMN flagged_reason TEXT;
