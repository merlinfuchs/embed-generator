use actix_web::http::StatusCode;
use actix_web::{get, HttpResponseBuilder, Responder};

use crate::config::{CONFIG, INVITE_URL};

#[get("/link/discord")]
pub async fn route_link_discord() -> impl Responder {
    HttpResponseBuilder::new(StatusCode::FOUND)
        .append_header(("Location", CONFIG.links.discord_invite.as_str()))
        .finish()
}

#[get("/link/source")]
pub async fn route_link_source() -> impl Responder {
    HttpResponseBuilder::new(StatusCode::FOUND)
        .append_header(("Location", CONFIG.links.source.as_str()))
        .finish()
}

#[get("/link/invite")]
pub async fn route_link_invite() -> impl Responder {
    HttpResponseBuilder::new(StatusCode::FOUND)
        .append_header(("Location", INVITE_URL.as_str()))
        .finish()
}
