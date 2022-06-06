use dashmap::DashMap;
use lazy_static::lazy_static;
use twilight_model::channel::Webhook;
use twilight_model::id::Id;
use twilight_model::id::marker::{ApplicationMarker, ChannelMarker, GuildMarker, WebhookMarker};

use crate::bot::DISCORD_HTTP;

lazy_static! {
    static ref WEBHOOK_CACHE: DashMap<Id<GuildMarker>, Vec<CachedWebhook>> = DashMap::new();
}

#[derive(Debug, Clone)]
pub struct CachedWebhook {
    pub id: Id<WebhookMarker>,
    pub application_id: Option<Id<ApplicationMarker>>,
    pub channel_id: Id<ChannelMarker>,
    pub token: Option<String>
}

pub async fn get_webhooks_for_guild(
    guild_id: Id<GuildMarker>,
) -> Result<Vec<CachedWebhook>, twilight_http::error::Error> {
    if let Some(webhooks) = WEBHOOK_CACHE.get(&guild_id) {
        return Ok(webhooks.value().to_vec());
    }

    let mut webhooks: Vec<Webhook> = DISCORD_HTTP
        .guild_webhooks(guild_id)
        .exec()
        .await?
        .model()
        .await
        .unwrap()
        .into();

    // we sort the vector to make sure that the bot always chooses the same webhook for the same channel
    webhooks.sort_by(|a, b| a.id.get().partial_cmp(&b.id.get()).unwrap());

    let cached_webhooks: Vec<CachedWebhook> = webhooks.into_iter().map(|w| CachedWebhook {
        id: w.id,
        application_id: w.application_id,
        channel_id: w.channel_id,
        token: w.token
    }).collect();
    WEBHOOK_CACHE.insert(guild_id, cached_webhooks.clone());

    Ok(cached_webhooks)
}

pub fn delete_webhooks_for_guild(guild_id: Id<GuildMarker>) {
    WEBHOOK_CACHE.remove(&guild_id);
}
