use std::error::Error;
use std::sync::Arc;
use std::time::Duration;

use futures_util::stream::StreamExt;
use lazy_static::lazy_static;
use log::{error, info};
use twilight_cache_inmemory::{InMemoryCache, ResourceType};
use twilight_gateway::cluster::ShardScheme;
use twilight_gateway::queue::LocalQueue;
use twilight_gateway::Cluster;
use twilight_http::Client;
use twilight_http_ratelimiting::InMemoryRatelimiter;
use twilight_model::gateway::event::Event;
use twilight_model::gateway::payload::outgoing::update_presence::UpdatePresencePayload;
use twilight_model::gateway::presence::{Activity, ActivityType, Status};
use twilight_model::gateway::Intents;
use twilight_model::guild::Permissions;
use twilight_model::id::marker::ChannelMarker;
use twilight_model::id::Id;

use crate::bot::commands::{command_definitions, handle_interaction, InteractionError};
use crate::bot::webhooks::delete_webhooks_for_channel;
use crate::config::CONFIG;
use crate::db::models::ChannelMessageModel;

mod commands;
pub mod emojis;
pub mod message;
pub mod webhooks;

lazy_static! {
    pub static ref DISCORD_CACHE: InMemoryCache = InMemoryCache::builder()
        .message_cache_size(0)
        .resource_types(
            ResourceType::ROLE
                | ResourceType::CHANNEL
                | ResourceType::GUILD
                | ResourceType::EMOJI
                | ResourceType::STICKER
                | ResourceType::MEMBER // only caches the bots member because we don't have the intent
        )
        .build();
    pub static ref DISCORD_HTTP: Arc<Client> = Arc::new(
        Client::builder()
            .token(CONFIG.discord.token.clone())
            .ratelimiter(Some(Box::new(InMemoryRatelimiter::new())))
            .timeout(Duration::from_secs(30))
            .build()
    );
}

pub fn get_bot_permissions_in_channel(channel_id: Id<ChannelMarker>) -> Permissions {
    let user_id = Id::new(CONFIG.discord.oauth_client_id.get());
    DISCORD_CACHE
        .permissions()
        .in_channel(user_id, channel_id)
        .unwrap_or(Permissions::empty())
}

pub async fn sync_commands() -> Result<(), Box<dyn Error>> {
    let http = DISCORD_HTTP.interaction(CONFIG.discord.oauth_client_id);
    if let Some(guild_id) = CONFIG.discord.test_guild_id {
        http.set_guild_commands(guild_id, &command_definitions())
            .exec()
            .await?;
    } else {
        http.set_global_commands(&command_definitions())
            .exec()
            .await?;
    }
    Ok(())
}

pub async fn run_bot() -> Result<(), Box<dyn Error>> {
    info!("Syncing commands ...");
    sync_commands().await?;
    info!("Successfully synced commands");

    let intents = Intents::GUILDS
        | Intents::GUILD_EMOJIS_AND_STICKERS
        | Intents::GUILD_WEBHOOKS
        | Intents::GUILD_MESSAGES;

    let queue = Arc::new(LocalQueue::new());

    let shard_scheme = ShardScheme::Range {
        from: 0,
        to: CONFIG.discord.shard_count - 1,
        total: CONFIG.discord.shard_count,
    };

    let (cluster, mut events) = Cluster::builder(CONFIG.discord.token.clone(), intents)
        .queue(queue)
        .shard_scheme(shard_scheme)
        .presence(UpdatePresencePayload {
            activities: vec![Activity {
                application_id: None,
                assets: None,
                buttons: vec![],
                created_at: None,
                details: None,
                emoji: None,
                flags: None,
                id: None,
                instance: None,
                kind: ActivityType::Watching,
                name: "message.style".to_string(),
                party: None,
                secrets: None,
                state: None,
                timestamps: None,
                url: None,
            }],
            status: Status::Online,
            afk: false,
            since: None,
        })
        .build()
        .await?;

    let cluster = Arc::new(cluster);
    let cluster_spawn = cluster.clone();
    tokio::spawn(async move {
        cluster_spawn.up().await;
    });

    while let Some((_, event)) = events.next().await {
        DISCORD_CACHE.update(&event);

        match event {
            Event::InteractionCreate(i) => {
                if let Err(e) = handle_interaction(i.0).await {
                    match e {
                        InteractionError::NoOp => {}
                        _ => error!("Handling interaction failed: {:?}", e),
                    }
                }
            }
            Event::MessageDelete(m) => {
                let _ = ChannelMessageModel::delete_by_message_id(m.id).await;
            }
            Event::WebhooksUpdate(w) => delete_webhooks_for_channel(w.channel_id),
            _ => {}
        }
    }

    Ok(())
}
