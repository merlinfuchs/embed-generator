use actix_web::http::StatusCode;
use actix_web::{get, HttpResponseBuilder, Responder};
use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};

use crate::config::CONFIG;

#[get("/auth/redirect")]
pub async fn route_auth_redirect() -> impl Responder {
    let url = format!(
        "https://discord.com/api/oauth2/authorize?client_id={}&redirect_uri={}&response_type=code&scope=identify%20guilds&prompt=none",
        CONFIG.discord.oauth_client_id,
        utf8_percent_encode(&CONFIG.discord.oauth_redirect_uri, NON_ALPHANUMERIC)
    );

    HttpResponseBuilder::new(StatusCode::FOUND)
        .append_header(("Location", url))
        .finish()
}
