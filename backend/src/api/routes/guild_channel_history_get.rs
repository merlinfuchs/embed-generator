use actix_web::get;
use actix_web::web::{Json, Path};
use twilight_model::id::Id;
use twilight_model::id::marker::ChannelMarker;

use crate::api::response::RouteResult;
use crate::api::wire::HistoryMessageWire;
use crate::db::models::ChannelMessagesModel;
use crate::util::id_to_timestamp;

#[get("/channels/{channel_id}/history")]
pub async fn route_guild_channel_history_get(
    channel_id: Path<String>,
) -> RouteResult<Vec<HistoryMessageWire>> {
    let channel_id: Id<ChannelMarker> = channel_id.into_inner().parse().unwrap_or(Id::new(1));
    let model = ChannelMessagesModel::find_by_channel_id(channel_id).await?;

    let messages: Vec<HistoryMessageWire> = model
        .message_ids
        .into_iter()
        .map(|mid| HistoryMessageWire {
            id: mid,
            created_at: id_to_timestamp(mid),
        })
        .collect();

    Ok(Json(messages.into()))
}
