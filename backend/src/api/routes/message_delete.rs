use actix_web::delete;
use actix_web::web::{Json, Path, ReqData};

use crate::api::response::{RouteError, RouteResult};
use crate::db::models::MessageModel;
use crate::tokens::TokenClaims;

#[delete("/messages/{message_id}")]
pub async fn route_message_delete(
    message_id: Path<String>,
    token: ReqData<TokenClaims>,
) -> RouteResult<()> {
    let message_id = message_id.into_inner();

    let result = MessageModel::delete_by_user_id_and_id(token.user_id, &message_id).await?;

    if result.deleted_count == 0 {
        Err(RouteError::NotFound {
            entity: "message".into(),
        })
    } else {
        Ok(Json(().into()))
    }
}
