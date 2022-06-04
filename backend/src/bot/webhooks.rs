use dashmap::DashMap;
use lazy_static::lazy_static;
use twilight_model::channel::Webhook;
use twilight_model::id::Id;
use twilight_model::id::marker::GuildMarker;

lazy_static! {
    static ref WEBHOOK_CACHE: DashMap<Id<GuildMarker>, Vec<Webhook>> = DashMap::new();
}

pub async fn get_webhooks_for_guild(guild_id: Id<GuildMarker>) -> Result<Vec<Webhook>, twilight_http::error::Error> {
    if let Some(webhooks) = WEBHOOK_CACHE.get(&guild_id) {
        return Ok(webhooks.value().clone())
    }

    // TODO

    Ok(vec![])
}

pub fn delete_webhooks_for_guild(guild_id: Id<GuildMarker>) {
    WEBHOOK_CACHE.remove(&guild_id);
}
