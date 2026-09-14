-- name: InsertEmbedLink :one
INSERT INTO embed_links (
    id,
    url,
    theme_color,
    og_title,
    og_site_name,
    og_description,
    og_image,
    oe_type,
    oe_author_name,
    oe_author_url,
    oe_provider_name,
    oe_provider_url,
    tw_card,
    expires_at,
    created_at
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15
) RETURNING *;

-- name: GetEmbedLink :one
SELECT * FROM embed_links WHERE id = $1;