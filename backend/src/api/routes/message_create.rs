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

    let model = MessageModel {
        id: nanoid!(),
        user_id: token.user_id.to_string(),
        name: req.name,
        description: req.description,
        data: req.data,
    };
    model.create().await?;

    Ok(Json(MessageWire::from(model).into()))
}
