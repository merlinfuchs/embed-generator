use serde::{Deserialize, Serialize};
use twilight_model::channel::message::sticker::StickerFormatType;
use twilight_model::channel::ChannelType;

use twilight_model::id::marker::{
    ChannelMarker, EmojiMarker, GuildMarker, RoleMarker, StickerMarker,
};
use twilight_model::id::Id;

use crate::bot::cache::{CacheChannel, CacheEmoji, CacheGuild, CacheRole};

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildWire {
    pub id: Id<GuildMarker>,
    pub name: String,
    pub icon: Option<String>,
}

impl From<&CacheGuild> for GuildWire {
    fn from(g: &CacheGuild) -> Self {
        Self {
            id: g.id,
            name: g.name.clone(),
            icon: g.icon.as_ref().map(|h| h.to_string()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildRoleWire {
    pub id: Id<RoleMarker>,
    pub name: String,
    pub managed: bool,
}

impl From<&CacheRole> for GuildRoleWire {
    fn from(r: &CacheRole) -> Self {
        Self {
            id: r.id,
            name: r.name.to_string(),
            managed: r.managed,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildChannelWire {
    pub id: Id<ChannelMarker>,
    pub name: Option<String>,
    pub position: Option<i32>,
    pub parent_id: Option<String>,
    #[serde(rename = "type")]
    pub kind: ChannelType,
}

impl From<&CacheChannel> for GuildChannelWire {
    fn from(c: &CacheChannel) -> Self {
        Self {
            id: c.id,
            name: c.name.clone(),
            position: c.position,
            parent_id: c.parent_id.map(|p| p.to_string()),
            kind: c.kind,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildEmojiWire {
    pub id: Id<EmojiMarker>,
    pub name: String,
    pub available: bool,
    pub animated: bool,
    pub managed: bool,
}

impl From<&CacheEmoji> for GuildEmojiWire {
    fn from(e: &CacheEmoji) -> Self {
        Self {
            id: e.id,
            name: e.name.clone(),
            available: e.available,
            animated: e.animated,
            managed: e.managed,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GuildStickerWire {
    pub id: Id<StickerMarker>,
    pub name: String,
    pub description: String,
    pub available: bool,
    pub format_type: StickerFormatType,
}
