use actix_web::get;
use actix_web::web::{Json, ReqData};

use crate::api::response::RouteResult;
use crate::api::wire::GuildWire;
use crate::bot::DISCORD_CACHE;
use crate::db::models::GuildsWithAccessModel;
use crate::tokens::TokenClaims;

#[get("/guilds")]
pub async fn route_guild_list(token: ReqData<TokenClaims>) -> RouteResult<Vec<GuildWire>> {
    let guilds_with_access = GuildsWithAccessModel::find_by_user_id(token.user_id).await?;

    let guilds: Vec<GuildWire> = guilds_with_access
        .guild_ids
        .into_iter()
        .filter_map(|gid| DISCORD_CACHE.guild(gid).map(|g| GuildWire::from(g.value())))
        .collect();

    Ok(Json(guilds.into()))
}
