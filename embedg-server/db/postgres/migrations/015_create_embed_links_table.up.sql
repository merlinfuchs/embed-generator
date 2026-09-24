CREATE TABLE IF NOT EXISTS embed_links (
    id TEXT PRIMARY KEY,

    url TEXT NOT NULL,
    theme_color TEXT,

    -- Additional OpenGraph metadata
    og_title TEXT,
    og_site_name TEXT,
    og_description TEXT,
    og_image TEXT,

    -- Additional oEmbed metadata
    oe_type TEXT,
    oe_author_name TEXT,
    oe_author_url TEXT,
    oe_provider_name TEXT,
    oe_provider_url TEXT,

    -- Additional Twitter metadata
    tw_card TEXT,

    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);
