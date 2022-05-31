use actix_web::get;
use actix_web::web::{Json, ReqData};
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

use crate::api::response::RouteResult;
use crate::api::wire::GuildRoleWire;
use crate::bot::DISCORD_CACHE;

#[get("/roles")]
pub async fn route_guild_role_list(
    guild_id: ReqData<Id<GuildMarker>>,
) -> RouteResult<Vec<GuildRoleWire>> {
    let stickers: Vec<GuildRoleWire> = DISCORD_CACHE
        .guild_roles(guild_id.into_inner())
        .map(|r| {
            r.value()
                .iter()
                .filter_map(|rid| {
                    DISCORD_CACHE
                        .role(*rid)
                        .map(|s| GuildRoleWire::from(s.value().resource()))
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(Json(stickers.into()))
}
