use actix_web::get;
use actix_web::web::{Json, ReqData};

use crate::api::response::{RouteError, RouteResult};
use crate::api::wire::UserWire;
use crate::db::models::UserModel;
use crate::tokens::TokenClaims;

#[get("/users/@me")]
pub async fn route_user_get_me(token: ReqData<TokenClaims>) -> RouteResult<UserWire> {
    let model = UserModel::find_by_id(token.user_id)
        .await?
        .ok_or(RouteError::NotFound {
            entity: "user".into(),
        })?;

    Ok(Json(UserWire::from(model).into()))
}
