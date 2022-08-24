use dashmap::mapref::one::Ref;
use dashmap::{DashMap, DashSet};
use twilight_model::channel::permission_overwrite::PermissionOverwrite;
use twilight_model::channel::ChannelType;
use twilight_model::gateway::event::Event;
use twilight_model::guild::Permissions;
use twilight_model::id::marker::{
    ChannelMarker, EmojiMarker, GuildMarker, RoleMarker, StickerMarker, UserMarker,
};
use twilight_model::id::Id;
use twilight_model::util::ImageHash;

use crate::CONFIG;

#[derive(Default)]
pub struct DiscordCache {
    guilds: DashMap<Id<GuildMarker>, CacheGuild>,
    channels: DashMap<Id<ChannelMarker>, CacheChannel>,
    roles: DashMap<Id<RoleMarker>, CacheRole>,
    emojis: DashMap<Id<EmojiMarker>, CacheEmoji>,
    stickers: DashMap<Id<StickerMarker>, CacheSticker>,

    bot_members: DashMap<Id<GuildMarker>, CacheBotMember>,

    guild_channels: DashMap<Id<GuildMarker>, DashSet<Id<ChannelMarker>>>,
    guild_roles: DashMap<Id<GuildMarker>, DashSet<Id<RoleMarker>>>,
    guild_emojis: DashMap<Id<GuildMarker>, DashSet<Id<EmojiMarker>>>,
    guild_stickers: DashMap<Id<GuildMarker>, DashSet<Id<StickerMarker>>>,
}

impl DiscordCache {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn update(&self, event: &Event) {
        match event {
            Event::GuildCreate(g) => {
                self.guilds.insert(
                    g.id,
                    CacheGuild {
                        id: g.id,
                        name: g.name.clone(),
                        icon: g.icon.clone(),
                        owner_id: g.owner_id,
                    },
                );

                for c in &g.channels {
                    self.channels.insert(
                        c.id,
                        CacheChannel {
                            id: c.id,
                            name: c.name.clone(),
                            guild_id: c.guild_id,
                            kind: c.kind,
                            position: c.position,
                            permission_overwrites: c.permission_overwrites.clone(),
                            parent_id: c.parent_id,
                        },
                    );
                    if let Some(guild_id) = c.guild_id {
                        self.guild_channels
                            .entry(guild_id)
                            .or_default()
                            .insert(c.id);
                    }
                }

                for r in &g.roles {
                    self.roles.insert(
                        r.id,
                        CacheRole {
                            id: r.id,
                            name: r.name.clone(),
                            guild_id: g.id,
                            permissions: r.permissions,
                            position: r.position,
                            managed: r.managed,
                        },
                    );
                    self.guild_roles.entry(g.id).or_default().insert(r.id);
                }

                for e in &g.emojis {
                    self.emojis.insert(
                        e.id,
                        CacheEmoji {
                            id: e.id,
                            animated: e.animated,
                            available: e.available,
                            managed: e.managed,
                            name: e.name.clone(),
                        },
                    );
                }
                self.guild_emojis
                    .insert(g.id, g.emojis.iter().map(|e| e.id).collect());

                for s in &g.stickers {
                    self.stickers.insert(
                        s.id,
                        CacheSticker {
                            id: s.id,
                            name: s.name.clone(),
                        },
                    );
                }
                self.guild_stickers
                    .insert(g.id, g.stickers.iter().map(|s| s.id).collect());

                for m in &g.members {
                    if m.user.id == CONFIG.discord.oauth_client_id.cast() {
                        self.bot_members.insert(
                            g.id,
                            CacheBotMember {
                                roles: m.roles.clone(),
                            },
                        );
                    }
                }
            }
            Event::GuildUpdate(g) => {
                self.guilds.insert(
                    g.id,
                    CacheGuild {
                        id: g.id,
                        name: g.name.clone(),
                        icon: g.icon.clone(),
                        owner_id: g.owner_id,
                    },
                );
            }
            Event::GuildDelete(g) => {
                if !g.unavailable {
                    self.guilds.remove(&g.id);
                    self.guild_channels.remove(&g.id);
                    self.guild_roles.remove(&g.id);
                    self.guild_emojis.remove(&g.id);
                    self.guild_stickers.remove(&g.id);
                    self.bot_members.remove(&g.id);
                }
            }
            Event::ChannelCreate(c) => {
                self.channels.insert(
                    c.id,
                    CacheChannel {
                        id: c.id,
                        name: c.name.clone(),
                        guild_id: c.guild_id,
                        kind: c.kind,
                        position: c.position,
                        permission_overwrites: c.permission_overwrites.clone(),
                        parent_id: c.parent_id,
                    },
                );
                if let Some(guild_id) = c.guild_id {
                    self.guild_channels
                        .entry(guild_id)
                        .or_default()
                        .insert(c.id);
                }
            }
            Event::ChannelUpdate(c) => {
                self.channels.insert(
                    c.id,
                    CacheChannel {
                        id: c.id,
                        name: c.name.clone(),
                        guild_id: c.guild_id,
                        kind: c.kind,
                        position: c.position,
                        permission_overwrites: c.permission_overwrites.clone(),
                        parent_id: c.parent_id,
                    },
                );
                if let Some(guild_id) = c.guild_id {
                    self.guild_channels
                        .entry(guild_id)
                        .or_default()
                        .insert(c.id);
                }
            }
            Event::ChannelDelete(c) => {
                self.channels.remove(&c.id);
                if let Some(guild_id) = c.guild_id {
                    if let Some(guild_channels) = self.guild_channels.get_mut(&guild_id) {
                        guild_channels.remove(&c.id);
                    }
                }
            }
            Event::ThreadCreate(c) => {
                self.channels.insert(
                    c.id,
                    CacheChannel {
                        id: c.id,
                        name: c.name.clone(),
                        guild_id: c.guild_id,
                        kind: c.kind,
                        position: c.position,
                        permission_overwrites: c.permission_overwrites.clone(),
                        parent_id: c.parent_id,
                    },
                );
                if let Some(guild_id) = c.guild_id {
                    self.guild_channels
                        .entry(guild_id)
                        .or_default()
                        .insert(c.id);
                }
            }
            Event::ThreadUpdate(c) => {
                self.channels.insert(
                    c.id,
                    CacheChannel {
                        id: c.id,
                        name: c.name.clone(),
                        guild_id: c.guild_id,
                        kind: c.kind,
                        position: c.position,
                        permission_overwrites: c.permission_overwrites.clone(),
                        parent_id: c.parent_id,
                    },
                );
                if let Some(guild_id) = c.guild_id {
                    self.guild_channels
                        .entry(guild_id)
                        .or_default()
                        .insert(c.id);
                }
            }
            Event::ThreadDelete(c) => {
                self.channels.remove(&c.id);
                if let Some(guild_channels) = self.guild_channels.get_mut(&c.guild_id) {
                    guild_channels.remove(&c.id);
                }
            }
            Event::ThreadListSync(event) => {
                for c in &event.threads {
                    self.channels.insert(
                        c.id,
                        CacheChannel {
                            id: c.id,
                            name: c.name.clone(),
                            guild_id: c.guild_id,
                            kind: c.kind,
                            position: c.position,
                            permission_overwrites: c.permission_overwrites.clone(),
                            parent_id: c.parent_id,
                        },
                    );
                    if let Some(guild_id) = c.guild_id {
                        self.guild_channels
                            .entry(guild_id)
                            .or_default()
                            .insert(c.id);
                    }
                }
            }
            Event::RoleCreate(r) => {
                self.roles.insert(
                    r.role.id,
                    CacheRole {
                        id: r.role.id,
                        name: r.role.name.clone(),
                        guild_id: r.guild_id,
                        permissions: r.role.permissions,
                        position: r.role.position,
                        managed: r.role.managed,
                    },
                );
                self.guild_roles
                    .entry(r.guild_id)
                    .or_default()
                    .insert(r.role.id);
            }
            Event::RoleUpdate(r) => {
                self.roles.insert(
                    r.role.id,
                    CacheRole {
                        id: r.role.id,
                        name: r.role.name.clone(),
                        guild_id: r.guild_id,
                        permissions: r.role.permissions,
                        position: r.role.position,
                        managed: r.role.managed,
                    },
                );
                self.guild_roles
                    .entry(r.guild_id)
                    .or_default()
                    .insert(r.role.id);
            }
            Event::RoleDelete(r) => {
                self.roles.remove(&r.role_id);
                self.guild_roles
                    .entry(r.guild_id)
                    .or_default()
                    .remove(&r.role_id);
            }
            Event::GuildEmojisUpdate(event) => {
                for e in &event.emojis {
                    self.emojis.insert(
                        e.id,
                        CacheEmoji {
                            id: e.id,
                            animated: e.animated,
                            available: e.available,
                            managed: e.managed,
                            name: e.name.clone(),
                        },
                    );
                }
                self.guild_emojis
                    .insert(event.guild_id, event.emojis.iter().map(|e| e.id).collect());
            }
            Event::GuildStickersUpdate(event) => {
                for s in &event.stickers {
                    self.stickers.insert(
                        s.id,
                        CacheSticker {
                            id: s.id,
                            name: s.name.clone(),
                        },
                    );
                }
                self.guild_stickers.insert(
                    event.guild_id,
                    event.stickers.iter().map(|s| s.id).collect(),
                );
            }
            Event::MemberAdd(m) => {
                if m.user.id == CONFIG.discord.oauth_client_id.cast() {
                    self.bot_members.insert(
                        m.guild_id,
                        CacheBotMember {
                            roles: m.roles.clone(),
                        },
                    );
                }
            }
            Event::MemberUpdate(m) => {
                if m.user.id == CONFIG.discord.oauth_client_id.cast() {
                    self.bot_members.insert(
                        m.guild_id,
                        CacheBotMember {
                            roles: m.roles.clone(),
                        },
                    );
                }
            }
            Event::MemberRemove(m) => {
                if m.user.id == CONFIG.discord.oauth_client_id.cast() {
                    self.bot_members.remove(&m.guild_id);
                }
            }
            Event::MemberChunk(e) => {
                for m in &e.members {
                    if m.user.id == CONFIG.discord.oauth_client_id.cast() {
                        self.bot_members.remove(&e.guild_id);
                    }
                }
            }
            _ => {}
        }
    }

    pub fn guild(&self, id: Id<GuildMarker>) -> Option<Ref<Id<GuildMarker>, CacheGuild>> {
        self.guilds.get(&id)
    }

    pub fn guild_channels(
        &self,
        id: Id<GuildMarker>,
    ) -> Option<Ref<Id<GuildMarker>, DashSet<Id<ChannelMarker>>>> {
        self.guild_channels.get(&id)
    }

    pub fn channel(&self, id: Id<ChannelMarker>) -> Option<Ref<Id<ChannelMarker>, CacheChannel>> {
        self.channels.get(&id)
    }

    pub fn guild_roles(
        &self,
        id: Id<GuildMarker>,
    ) -> Option<Ref<Id<GuildMarker>, DashSet<Id<RoleMarker>>>> {
        self.guild_roles.get(&id)
    }

    pub fn role(&self, id: Id<RoleMarker>) -> Option<Ref<Id<RoleMarker>, CacheRole>> {
        self.roles.get(&id)
    }

    pub fn bot_member(&self, id: Id<GuildMarker>) -> Option<Ref<Id<GuildMarker>, CacheBotMember>> {
        self.bot_members.get(&id)
    }

    pub fn guild_emojis(
        &self,
        id: Id<GuildMarker>,
    ) -> Option<Ref<Id<GuildMarker>, DashSet<Id<EmojiMarker>>>> {
        self.guild_emojis.get(&id)
    }

    pub fn emoji(&self, id: Id<EmojiMarker>) -> Option<Ref<Id<EmojiMarker>, CacheEmoji>> {
        self.emojis.get(&id)
    }

    pub fn guild_stickers(
        &self,
        id: Id<GuildMarker>,
    ) -> Option<Ref<Id<GuildMarker>, DashSet<Id<StickerMarker>>>> {
        self.guild_stickers.get(&id)
    }

    pub fn sticker(&self, id: Id<StickerMarker>) -> Option<Ref<Id<StickerMarker>, CacheSticker>> {
        self.stickers.get(&id)
    }
}

#[derive(Clone, Debug)]
pub struct CacheGuild {
    pub id: Id<GuildMarker>,
    pub name: String,
    pub icon: Option<ImageHash>,
    pub owner_id: Id<UserMarker>,
}

#[derive(Clone, Debug)]
pub struct CacheChannel {
    pub id: Id<ChannelMarker>,
    pub guild_id: Option<Id<GuildMarker>>,
    pub name: Option<String>,
    pub kind: ChannelType,
    pub permission_overwrites: Option<Vec<PermissionOverwrite>>,
    pub position: Option<i32>,
    pub parent_id: Option<Id<ChannelMarker>>,
}

#[derive(Clone, Debug)]
pub struct CacheRole {
    pub id: Id<RoleMarker>,
    pub guild_id: Id<GuildMarker>,
    pub name: String,
    pub managed: bool,
    pub permissions: Permissions,
    pub position: i64,
}

#[derive(Clone, Debug)]
pub struct CacheBotMember {
    pub roles: Vec<Id<RoleMarker>>,
}

#[derive(Clone, Debug)]
pub struct CacheEmoji {
    pub id: Id<EmojiMarker>,
    pub animated: bool,
    pub available: bool,
    pub managed: bool,
    pub name: String,
}

#[derive(Clone, Debug)]
pub struct CacheSticker {
    pub id: Id<StickerMarker>,
    pub name: String,
}
