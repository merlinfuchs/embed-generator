use actix_web::post;
use actix_web::web::{Json, ReqData};

use crate::api::response::RouteResult;
use crate::api::wire::{MessageSendExecuteRequestWire, MessageWire};
use crate::tokens::TokenClaims;

#[post("/messages/send")]
pub async fn route_message_send(
    _req: Json<MessageSendExecuteRequestWire>,
    _token: ReqData<TokenClaims>,
) -> RouteResult<MessageWire> {
    // if webhook target just execute and return errors or message

    // if channel
    // - check if user has access to guild and channel belongs to the right guild
    // - get or create a webhook in that channel
    // - if message id is provided fetch message and check if webhook id matches? (or just catch error?)
    // - execute and return errors or message

    unimplemented!()
}
