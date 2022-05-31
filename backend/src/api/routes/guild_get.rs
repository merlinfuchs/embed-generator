use actix_web::get;
use actix_web::web::{Json, ReqData};
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::GuildWire;
use crate::bot::DISCORD_CACHE;

#[get("")]
pub async fn route_guild_get(guild_id: ReqData<Id<GuildMarker>>) -> RouteResult<GuildWire> {
    let guild: GuildWire = DISCORD_CACHE
        .guild(guild_id.into_inner())
        .ok_or(RouteError::NotFound {
            entity: "guild".into(),
        })?
        .value()
        .into();

    Ok(Json(guild.into()))
}
