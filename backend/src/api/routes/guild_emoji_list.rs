use actix_web::get;
use actix_web::web::{Json, ReqData};
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

use crate::api::response::RouteResult;
use crate::api::wire::GuildEmojiWire;
use crate::bot::DISCORD_CACHE;

#[get("/emojis")]
pub async fn route_guild_emoji_list(
    guild_id: ReqData<Id<GuildMarker>>,
) -> RouteResult<Vec<GuildEmojiWire>> {
    let emojis: Vec<GuildEmojiWire> = DISCORD_CACHE
        .guild_emojis(guild_id.into_inner())
        .map(|e| {
            e.value()
                .iter()
                .filter_map(|eid| {
                    DISCORD_CACHE
                        .emoji(*eid)
                        .map(|s| GuildEmojiWire::from(s.value().resource()))
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(Json(emojis.into()))
}
