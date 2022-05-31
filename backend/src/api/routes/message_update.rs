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

    let model = MessageModel {
        id: message_id,
        user_id: token.user_id.to_string(),
        name: req.name,
        description: req.description,
        data: req.data,
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
