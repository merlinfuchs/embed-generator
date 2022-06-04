use actix_web::http::StatusCode;
use actix_web::{get, HttpResponseBuilder, Responder};

use crate::config::CONFIG;

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
    let url = format!("https://discord.com/api/oauth2/authorize?client_id={}&permissions=536871936&scope=bot%20applications.commands", CONFIG.discord.oauth_client_id);

    HttpResponseBuilder::new(StatusCode::FOUND)
        .append_header(("Location", url))
        .finish()
}
