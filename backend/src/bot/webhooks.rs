use dashmap::DashMap;
use lazy_static::lazy_static;
use twilight_model::channel::Webhook;
use twilight_model::id::marker::{ApplicationMarker, ChannelMarker, WebhookMarker};
use twilight_model::id::Id;

use crate::bot::DISCORD_HTTP;

lazy_static! {
    static ref WEBHOOK_CACHE: DashMap<Id<ChannelMarker>, Vec<CachedWebhook>> = DashMap::new();
}

#[derive(Debug, Clone)]
pub struct CachedWebhook {
    pub id: Id<WebhookMarker>,
    pub application_id: Option<Id<ApplicationMarker>>,
    pub token: Option<String>,
}

pub async fn get_webhooks_for_channel(
    channel_id: Id<ChannelMarker>,
) -> Result<Vec<CachedWebhook>, twilight_http::error::Error> {
    if let Some(webhooks) = WEBHOOK_CACHE.get(&channel_id) {
        return Ok(webhooks.value().to_vec());
    }

    let mut webhooks: Vec<Webhook> = DISCORD_HTTP
        .channel_webhooks(channel_id)
        .await?
        .model()
        .await
        .unwrap();

    // we sort the vector to make sure that the bot always chooses the same webhook for the same channel
    webhooks.sort_by(|a, b| a.id.get().partial_cmp(&b.id.get()).unwrap());

    let cached_webhooks: Vec<CachedWebhook> = webhooks
        .into_iter()
        .map(|w| CachedWebhook {
            id: w.id,
            application_id: w.application_id,
            token: w.token,
        })
        .collect();
    WEBHOOK_CACHE.insert(channel_id, cached_webhooks.clone());

    Ok(cached_webhooks)
}

pub fn delete_webhooks_for_channel(channel_id: Id<ChannelMarker>) {
    WEBHOOK_CACHE.remove(&channel_id);
}
