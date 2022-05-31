use serde::{Deserialize, Serialize};
use twilight_cache_inmemory::model::{CachedEmoji, CachedGuild, CachedSticker};
use twilight_model::channel::{Channel, ChannelType};
use twilight_model::channel::message::sticker::StickerFormatType;
use twilight_model::guild::Role;

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildWire {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
}

impl From<&CachedGuild> for GuildWire {
    fn from(g: &CachedGuild) -> Self {
        Self {
            id: g.id().to_string(),
            name: g.name().to_string(),
            description: g.description().map(|d| d.to_string()),
            icon: g.icon().map(|h| h.to_string()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildRoleWire {
    pub id: String,
    pub name: String,
    pub color: u32,
    pub mentionable: bool,
    pub managed: bool
}

impl From<&Role> for GuildRoleWire {
    fn from(r: &Role) -> Self {
        Self {
            id: r.id.to_string(),
            name: r.name.to_string(),
            color: r.color,
            mentionable: r.mentionable,
            managed: r.managed
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildChannelWire {
    pub id: String,
    pub name: Option<String>,
    pub position: Option<i64>,
    pub parent_id: Option<String>,
    #[serde(rename = "type")]
    pub kind: ChannelType,
}

impl From<&Channel> for GuildChannelWire {
    fn from(c: &Channel) -> Self {
        Self {
            id: c.id.to_string(),
            name: c.name.clone(),
            position: c.position,
            parent_id: c.parent_id.map(|p| p.to_string()),
            kind: c.kind
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildEmojiWire {
    pub id: String,
    pub name: String,
    pub available: bool,
    pub animated: bool,
    pub managed: bool
}

impl From<&CachedEmoji> for GuildEmojiWire {
    fn from(e: &CachedEmoji) -> Self {
        Self {
            id: e.id().to_string(),
            name: e.name().to_string(),
            available: e.available(),
            animated: e.animated(),
            managed: e.managed()
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildStickerWire {
    pub id: String,
    pub name: String,
    pub description: String,
    pub available: bool,
    pub format_type: StickerFormatType
}

impl From<&CachedSticker> for GuildStickerWire {
    fn from(s: &CachedSticker) -> Self {
        Self {
            id: s.id().to_string(),
            name: s.name().to_string(),
            description: s.description().to_string(),
            available: s.available(),
            format_type: s.format_type()
        }
    }
}
