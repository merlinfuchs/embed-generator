use actix_web::get;
use actix_web::web::{Json, ReqData};
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

use crate::api::response::RouteResult;
use crate::api::wire::GuildStickerWire;
use crate::bot::DISCORD_CACHE;

#[get("/stickers")]
pub async fn route_guild_sticker_list(
    guild_id: ReqData<Id<GuildMarker>>,
) -> RouteResult<Vec<GuildStickerWire>> {
    let stickers: Vec<GuildStickerWire> = DISCORD_CACHE
        .guild_stickers(guild_id.into_inner())
        .map(|s| {
            s.value()
                .iter()
                .filter_map(|sid| {
                    DISCORD_CACHE
                        .sticker(*sid)
                        .map(|s| GuildStickerWire::from(s.value().resource()))
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(Json(stickers.into()))
}
