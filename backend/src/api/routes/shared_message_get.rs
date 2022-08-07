use actix_web::get;
use actix_web::web::{Json, Path};

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::SharedMessageWire;
use crate::db::models::SharedMessageModel;

#[get("/shared/{share_id}")]
pub async fn route_shared_message_get(message_id: Path<String>) -> RouteResult<SharedMessageWire> {
    let share_id = message_id.into_inner();

    let model = SharedMessageModel::find_by_id(&share_id)
        .await?
        .ok_or(RouteError::NotFound {
            entity: "shared_message".into(),
        })?;

    Ok(Json(SharedMessageWire::from(model).into()))
}
