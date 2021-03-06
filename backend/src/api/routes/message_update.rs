use std::time::{SystemTime, UNIX_EPOCH};
use actix_web::put;
use actix_web::web::{Json, Path, ReqData};

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::{MessageUpdateRequestWire, MessageWire, NormalizeValidate};
use crate::db::models::MessageModel;
use crate::tokens::TokenClaims;

#[put("/messages/{message_id}")]
pub async fn route_message_update(
    req: Json<MessageUpdateRequestWire>,
    message_id: Path<String>,
    token: ReqData<TokenClaims>,
) -> RouteResult<MessageWire> {
    let message_id = message_id.into_inner();
    let req = req.into_inner().normalize_and_validate()?;

    let unix_now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let model = MessageModel {
        id: message_id,
        owner_id: token.user_id,
        updated_at: unix_now,
        name: req.name,
        description: req.description,
        payload_json: req.payload_json,
    };
    let result = model.update().await?;
    if result.matched_count == 0 {
        Err(RouteError::NotFound {
            entity: "message".into(),
        })
    } else {
        Ok(Json(MessageWire::from(model).into()))
    }
}
