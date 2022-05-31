use actix_web::get;
use actix_web::web::{Json, ReqData};

use crate::api::response::RouteResult;
use crate::api::wire::MessageWire;
use crate::db::models::MessageModel;
use crate::tokens::TokenClaims;

#[get("/messages")]
pub async fn route_message_list(token: ReqData<TokenClaims>) -> RouteResult<Vec<MessageWire>> {
    let models = MessageModel::list_by_user_id(token.user_id).await?;

    let messages: Vec<MessageWire> = models
        .into_iter()
        .filter_map(|m| m.map(|m| m.into()).ok())
        .collect();

    Ok(Json(messages.into()))
}
