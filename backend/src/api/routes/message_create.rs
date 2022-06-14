use std::time::{SystemTime, UNIX_EPOCH};

use actix_web::post;
use actix_web::web::{Json, ReqData};
use nanoid::nanoid;

use crate::api::response::RouteResult;
use crate::api::wire::{MessageCreateRequestWire, MessageWire, NormalizeValidate};
use crate::db::models::MessageModel;
use crate::tokens::TokenClaims;

#[post("/messages")]
pub async fn route_message_create(
    req: Json<MessageCreateRequestWire>,
    token: ReqData<TokenClaims>,
) -> RouteResult<MessageWire> {
    let req = req.into_inner().normalize_and_validate()?;

    // TODO: check message limit for user

    let unix_now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let model = MessageModel {
        id: nanoid!(),
        owner_id: token.user_id,
        updated_at: unix_now,
        name: req.name,
        description: req.description,
        payload_json: req.payload_json,
    };
    model.create().await?;

    Ok(Json(MessageWire::from(model).into()))
}
