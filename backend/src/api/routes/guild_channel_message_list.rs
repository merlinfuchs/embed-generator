use actix_web::get;
use actix_web::web::{Json, Path};
use twilight_model::id::marker::ChannelMarker;
use twilight_model::id::Id;
use twilight_model::util::Timestamp;

use crate::api::response::RouteResult;
use crate::api::wire::ChannelMessageWire;
use crate::db::models::ChannelMessageModel;

#[get("/channels/{channel_id}/messages")]
pub async fn route_guild_channel_message_list(
    channel_id: Path<String>,
) -> RouteResult<Vec<ChannelMessageWire>> {
    let channel_id: Id<ChannelMarker> = channel_id.into_inner().parse().unwrap_or(Id::new(1));
    let models = ChannelMessageModel::find_by_channel_id(channel_id).await?;

    let messages: Vec<ChannelMessageWire> = models
        .into_iter()
        .filter_map(|m| {
            m.ok().map(|m| ChannelMessageWire {
                id: m.message_id,
                hash: m.hash,
                created_at: Timestamp::from_secs(m.created_at.time as i64).unwrap(),
                updated_at: Timestamp::from_secs(m.updated_at.time as i64).unwrap(),
            })
        })
        .collect();

    Ok(Json(messages.into()))
}
