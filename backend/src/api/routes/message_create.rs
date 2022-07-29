use actix_web::post;
use actix_web::web::{Json, ReqData};
use nanoid::nanoid;

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::{MessageCreateRequestWire, MessageWire, NormalizeValidate};
use crate::CONFIG;
use crate::db::models::MessageModel;
use crate::tokens::TokenClaims;
use crate::util::unix_now_mongodb;

#[post("/messages")]
pub async fn route_message_create(
    req: Json<MessageCreateRequestWire>,
    token: ReqData<TokenClaims>,
) -> RouteResult<MessageWire> {
    let req = req.into_inner().normalize_and_validate()?;

    let message_count = MessageModel::count_by_owner_id(token.user_id).await?;
    if message_count > CONFIG.limits.max_messages_per_user {
        return Err(RouteError::MessageLimitReached)
    }

    let model = MessageModel {
        id: nanoid!(),
        owner_id: token.user_id,
        created_at: unix_now_mongodb(),
        updated_at: unix_now_mongodb(),
        name: req.name,
        description: req.description,
        payload_json: req.payload_json,
    };
    model.create().await?;

    Ok(Json(MessageWire::from(model).into()))
}
