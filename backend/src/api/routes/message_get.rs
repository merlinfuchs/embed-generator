use actix_web::get;
use actix_web::web::{Json, Path, ReqData};

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::MessageWire;
use crate::db::models::MessageModel;
use crate::tokens::TokenClaims;

#[get("/messages/{message_id}")]
pub async fn route_message_get(
    message_id: Path<String>,
    token: ReqData<TokenClaims>,
) -> RouteResult<MessageWire> {
    let message_id = message_id.into_inner();

    let model = MessageModel::find_by_owner_id_and_id(token.user_id, &message_id)
        .await?
        .ok_or(RouteError::NotFound {
            entity: "message".into(),
        })?;

    Ok(Json(MessageWire::from(model).into()))
}
