use actix_web::get;
use actix_web::web::{Json, ReqData};
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

use crate::api::response::RouteResult;
use crate::api::wire::GuildChannelWire;
use crate::bot::DISCORD_CACHE;

#[get("/channels")]
pub async fn route_guild_channel_list(
    guild_id: ReqData<Id<GuildMarker>>,
) -> RouteResult<Vec<GuildChannelWire>> {
    let stickers: Vec<GuildChannelWire> = DISCORD_CACHE
        .guild_channels(guild_id.into_inner())
        .map(|c| {
            c.value()
                .iter()
                .filter_map(|cid| {
                    DISCORD_CACHE
                        .channel(*cid)
                        .map(|s| GuildChannelWire::from(s.value()))
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(Json(stickers.into()))
}
