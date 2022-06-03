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
use twilight_model::gateway::Intents;

use crate::bot::commands::{command_definitions, handle_interaction};
use crate::config::CONFIG;

mod commands;

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
            .timeout(Duration::from_secs(5))
            .build()
    );
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
        | Intents::GUILD_WEBHOOKS
        | Intents::GUILD_MESSAGES
        | Intents::MESSAGE_CONTENT;

    let queue = Arc::new(LocalQueue::new());

    let shard_scheme = ShardScheme::Range {
        from: 0,
        to: CONFIG.discord.shard_count - 1,
        total: CONFIG.discord.shard_count,
    };

    let (cluster, mut events) = Cluster::builder(CONFIG.discord.token.clone(), intents)
        .queue(queue)
        .shard_scheme(shard_scheme)
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
                    error!("Handling interaction failed: {:?}", e)
                }
            },
            Event::MessageDelete(msg) => {} // TODO: delete from last message store
            _ => {}
        }
    }

    Ok(())
}
