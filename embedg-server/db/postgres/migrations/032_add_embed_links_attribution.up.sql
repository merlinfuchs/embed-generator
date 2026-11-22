-- Who created the link, when they were logged in, so it can be traced back to them.
ALTER TABLE embed_links ADD COLUMN user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
-- Whether the component embed ends with a line saying it's a link preview from message.style.
-- Without it, the preview looks like a message from whoever posted the link. Only paid plans can
-- turn it off, and links created before it existed get it too.
ALTER TABLE embed_links ADD COLUMN attribution BOOLEAN NOT NULL DEFAULT true;
