use actix_web::post;
use actix_web::web::Json;
use serde::Deserialize;
use twilight_model::guild::Permissions;
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

use crate::api::response::RouteResult;
use crate::api::wire::{ExchangeTokenRequestWire, ExchangeTokenResponseWire};
use crate::config::CONFIG;
use crate::db::models::{GuildsWithAccessModel, UserModel};
use crate::tokens::{encode_token, TokenClaims};

#[derive(Deserialize)]
pub struct DiscordExchangeTokenResponseData {
    pub access_token: String,
}

#[derive(Deserialize)]
pub struct DiscordGuildsResponseDataEntry {
    pub id: Id<GuildMarker>,
    pub permissions: Permissions,
}

#[post("/auth/exchange")]
pub async fn route_auth_exchange(
    req: Json<ExchangeTokenRequestWire>,
) -> RouteResult<ExchangeTokenResponseWire> {
    let code = req.into_inner().code;

    let client = awc::ClientBuilder::new().finish();

    let token_resp: DiscordExchangeTokenResponseData = client
        .post("https://discord.com/api/v9/oauth2/token")
        .send_form(&[
            (
                "client_id",
                CONFIG.discord.oauth_client_id.to_string().as_str(),
            ),
            ("client_secret", &CONFIG.discord.oauth_client_secret),
            ("grant_type", "authorization_code"),
            ("code", &code),
            ("redirect_uri", &CONFIG.discord.oauth_redirect_uri),
        ])
        .await?
        .json()
        .await?;

    let user_model: UserModel = client
        .get("https://discord.com/api/v9/users/@me")
        .append_header((
            "Authorization",
            format!("Bearer {}", token_resp.access_token),
        ))
        .send()
        .await?
        .json()
        .await?;
    user_model.save().await?;

    let guilds: Vec<DiscordGuildsResponseDataEntry> = client
        .get("https://discord.com/api/v9/users/@me/guilds")
        .append_header((
            "Authorization",
            format!("Bearer {}", token_resp.access_token),
        ))
        .send()
        .await?
        .json()
        .await?;

    let guilds_model = GuildsWithAccessModel {
        user_id: user_model.id,
        guild_ids: guilds
            .into_iter()
            .filter(|g| g.permissions.contains(Permissions::MANAGE_MESSAGES))
            .map(|g| g.id)
            .collect(),
    };
    guilds_model.save().await?;

    Ok(Json(
        ExchangeTokenResponseWire {
            token: encode_token(&TokenClaims::new(user_model.id))?,
        }
        .into(),
    ))
}
