use std::error::Error;

use actix_web::web::scope;
use actix_web::{middleware, App, HttpServer};

use crate::api::middlewares::{AuthCheck, GuildExtractor};
#[cfg(feature = "frontend")]
use crate::api::routes::route_serve_frontend;
use crate::api::routes::{route_auth_exchange, route_auth_redirect, route_guild_channel_list, route_guild_emoji_list, route_guild_get, route_guild_list, route_guild_role_list, route_guild_sticker_list, route_link_discord, route_link_invite, route_link_source, route_message_create, route_message_delete, route_message_get, route_message_list, route_message_send, route_message_update, route_user_get_me};
use crate::config::CONFIG;

mod middlewares;
mod response;
mod routes;
mod wire;

pub async fn serve_api() -> Result<(), Box<dyn Error>> {
    HttpServer::new(move || {
        let app = App::new().wrap(middleware::Compress::default());

        #[cfg(feature = "cors")]
        let app = app.wrap(
            actix_cors::Cors::default()
                .allowed_methods(["GET", "POST", "OPTIONS"])
                .allow_any_header()
                .allow_any_origin(),
        );

        let app = app.service(
            scope("/api")
                .service(route_auth_redirect)
                .service(route_auth_exchange)
                .service(route_link_discord)
                .service(route_link_invite)
                .service(route_link_source)
                .service(
                    scope("")
                        .wrap(AuthCheck)
                        .service(route_user_get_me)
                        .service(route_message_create)
                        .service(route_message_delete)
                        .service(route_message_update)
                        .service(route_message_get)
                        .service(route_message_list)
                        .service(route_guild_list)
                        .service(route_message_send)
                        .service(
                            scope("/guilds/{guild_id}")
                                .wrap(GuildExtractor)
                                .service(route_guild_get)
                                .service(route_guild_channel_list)
                                .service(route_guild_emoji_list)
                                .service(route_guild_role_list)
                                .service(route_guild_sticker_list),
                        ),
                ),
        );

        #[cfg(feature = "frontend")]
        let app = app.service(route_serve_frontend);

        app
    })
    .bind((CONFIG.host.as_str(), CONFIG.port))?
    .run()
    .await?;

    Ok(())
}
